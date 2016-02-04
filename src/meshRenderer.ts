'use strict';

import Q = require('q');
import meshClient = require('./meshRestClient');
import path = require('path');
import u = require('./meshUtil');
import handler = require('./meshHandlerStore');
import lang = require('./meshLanguages');
import filter = require('./meshTemplateFilters');
import swig  = require('swig');

import {IMeshRequest} from "./index";
import {IMeshNode} from "./index";
import {IMeshResponse} from "./index";
import {IMeshRef} from "./index";
import {IMeshErrorHandler} from "./meshHandlerStore";
import {IMeshViewHandler} from "./meshHandlerStore";
import {IMeshSchemaHandler} from "./meshHandlerStore";

export class RenderInformation {
    public activeLanguage : string;
    public availableLanguages : Array<string>;
    public languageURLs : { [key:string]:string; } = {};
    public username : string;
    public loggedin : boolean;
    constructor(req : IMeshRequest, node? : IMeshNode<any>) {
        this.activeLanguage = lang.getActiveLanguage(req);
        if (u.isDefined(node)) {
            this.availableLanguages = node.availableLanguages;
            this.availableLanguages.forEach((lang : string) => {
               this.languageURLs[lang] = node.languagePaths[lang];
            });
        } else {
            this.availableLanguages = req.meshConfig.languages;
            this.availableLanguages.forEach((lang : string) => {
                this.languageURLs[lang] = '?lang=' + lang;
            });
        }
        this.username = req.session[meshClient.MeshAuth.MESH_USER_SESSION_KEY] ?
            req.session[meshClient.MeshAuth.MESH_USER_SESSION_KEY] : req.meshConfig.meshPublicUser.username;
        this.loggedin = this.username !== req.meshConfig.meshPublicUser.username;
    }
}

export class RenderData {
    public node : IMeshNode<any>;
    public nodes : Array<IMeshNode<any>>;
    public renderInformation : RenderInformation;
    public meta : any;
    constructor(){
        this.meta = {};
    }
}

export class MeshRenderer {

    public static TEMPLATE_EXTENSION : string = '.html';

    private schemaHandlerStore : handler.SchemaHandlerStore;
    private errorHandlerStore : handler.ErrorHandlerStore;
    private viewHandlerStore : handler.ViewHandlerStore;

    constructor(private viewDir : string){
        filter.registerFilters();
        this.schemaHandlerStore = new handler.SchemaHandlerStore();
        this.errorHandlerStore = new handler.ErrorHandlerStore();
        this.viewHandlerStore = new handler.ViewHandlerStore();
    }

    public registerSchemaHandler<T>(schema : string, handler : IMeshSchemaHandler<T>) : void {
        this.schemaHandlerStore.registerSchemaHandler(schema, handler);
    }

    public registerErrorHandler(status : number, handler : IMeshErrorHandler) : void {
        this.errorHandlerStore.registerErrorHandler(status, handler);
    }

    public registerViewRenderHandler(handler : IMeshViewHandler) : void {
        this.viewHandlerStore.registerViewHandler(handler);
    }

    public renderMeshNode<T>(node : IMeshNode<T>, req : IMeshRequest, res : IMeshResponse) : void {
        var schema : IMeshRef = u.isDefined(node) && u.isDefined(node.schema) ? node.schema : {},
            key : string = u.isDefined(schema.name) ? schema.name : schema.uuid;
        if (u.isDefined(key)) {
            this.handleMicroNodeFields(node).then((node : IMeshNode<T>) => {
                return this.schemaHandlerStore.workSchemaHandlers(key, node, req, res);
            })
            .then((node : IMeshNode<T>) => {
                var renderData = this.getRenderData(node, req);
                this.viewExists(key).then(() => {
                    this.renderView(key, renderData, req, res);
                }).catch(() => {
                    console.warn('Template for schema {'+key+'} not found, using default: '+req.meshConfig.defaultView);
                    this.renderView(req.meshConfig.defaultView, renderData, req, res);
                });
            }).catch((err) => {
                console.error('Error in schema handlers');
                this.renderError(u.STATUS_ERROR, req, res, err);
            });
        } else {
            this.renderError(u.STATUS_ERROR, req, res, {message : 'No schema found'});
        }
    }

    public renderError(status : number, req : IMeshRequest, res : IMeshResponse, err? : any) : void {
        this.errorHandlerStore.workErrorHandler(status, err, req, res).catch(()=>{
            var viewname = '' + status, renderdata = new RenderData();
            res.status(status);
            console.error(status, err, err.stack);
            renderdata.meta.error = err;
            this.viewExists(viewname).then(() => {
                this.renderView(viewname, renderdata, req, res);
            }).catch(() => {
                this.renderView(req.meshConfig.defaultErrorView, renderdata, req, res);
            });
        });
    }

    private viewExists(name : string) : Q.Promise<boolean> {
        var filename = name + MeshRenderer.TEMPLATE_EXTENSION;
        return u.fileExists(path.join(this.viewDir, filename));
    }

    public renderView(name : string, data : RenderData, req : IMeshRequest, res : IMeshResponse) {
        this.viewHandlerStore.workViewHandlers(data, req, res).then((renderdata) => {
            if (req.meshConfig.logging.renderdata) {
                console.log(JSON.stringify(renderdata, null, 4));
            }
            res.render(name, renderdata);
        }).catch((err) => {
            console.error('ERROR IN VIEWHANDLER', err, err.stack);
            if (req.meshConfig.logging.renderdata) {
                console.log(JSON.stringify(data, null, 4));
            }
            data.meta.error = true;
            res.render(name, data);
        })
    }

    private handleMicroNodeFields<T>(node : IMeshNode<T>) : Q.Promise<IMeshNode<T>> {
        var deferred = Q.defer<IMeshNode<T>>(),
            promises = [];
        if (u.isDefined(node) && u.isDefined(node.fields)) {
            Object.keys(node.fields).forEach((key) => {
                var field = node.fields[key];
                promises.push(this.resolveField(field).then((resolved)=>{
                    node.fields[key] = resolved;
                }));
            });
            Q.all(promises).then(()=>{
                deferred.resolve(node);
            });
        } else {
            deferred.resolve(node);
        }
        return deferred.promise;
    }

    private resolveField(field : any) : Q.Promise<any> {
        var listpromises = [];
        if (u.isDefined(field) && Array.isArray(field)) {
            field.forEach((listitem)=>{
                // check if there is a schema, if not we just add the node itself
                if (u.isDefined(listitem.schema) || u.isDefined(listitem.microschema) ) {
                    listpromises.push(this.meshNodeToString(listitem));
                } else {
                    listpromises.push(Q.fcall(()=>{
                        return listitem;
                    }));
                }
            });
            return Q.all(listpromises);
        } else if (u.isDefined(field) && (u.isDefined(field.schema) || u.isDefined(field.microschema))) {
            return this.meshNodeToString(field);
        } else {
            return Q.fcall(()=>{
                return field;
            });
        }
    }

    private meshNodeToString<T>(node : IMeshNode<T>) : Q.Promise<string> {
        var deferred = Q.defer<string>(),
            key : string = u.isDefined(node) ? this.getSchemaKey(node): undefined;
        if (u.isDefined(key)) {
            this.schemaHandlerStore.workSchemaHandlers(key, node).then((node : IMeshNode<T>) => {
                this.viewExists(key).then(() => {
                    deferred.resolve(this.renderTemplate(key, node));
                }).catch(() => {
                    console.warn('Template for schema {' + key + '} not found. Using blank.');
                    deferred.resolve('')
                });
            }).catch((err) => {
                console.error('Error in schema handlers', err);
                deferred.reject('');
            });
        } else {
            console.error('Schema for node not found', JSON.stringify(node, null, 4));
            deferred.reject('');
        }
        return deferred.promise;
    }

    private getSchemaKey<T>(node : IMeshNode<T>) : string {
        var schemaObj : IMeshRef = u.isDefined(node.schema) ? node.schema : node.microschema,
            key : string = u.isDefined(schemaObj) ?  (u.isDefined(schemaObj.name) ? schemaObj.name : schemaObj.uuid) : undefined;
        return key;
    }

    private renderTemplate(name : string, data : any) : string {
        var templatepath = path.join(this.viewDir, name + MeshRenderer.TEMPLATE_EXTENSION);
        return swig.renderFile(templatepath, data);
    }

    public getRenderData<T>(node : IMeshNode<T>, req : IMeshRequest) : RenderData {
        var data = new RenderData();
        lang.setActiveLanguage(req, node.language);
        data.node = node;
        data.renderInformation = new RenderInformation(req, node);
        return data;
    }
}
