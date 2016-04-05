'use strict';

import Q = require('q');
import meshClient = require('./meshRestClient');
import path = require('path');
import u = require('./meshUtil');
import express = require('express');
import handler = require('./meshHandlerStore');
import lang = require('./meshLanguages');
import filter = require('./meshTemplateFilters');


import {IMeshRequest} from "./mesh";
import {IMeshNode} from "./mesh";
import {IMeshResponse} from "./mesh";
import {IMeshRef} from "./mesh";
import {IMeshErrorHandler} from "./meshHandlerStore";
import {IMeshViewHandler} from "./meshHandlerStore";
import {IMeshSchemaHandler} from "./meshHandlerStore";

/**
 * Render information that will be passed to the rendered template in the RenderData.
 */
export class RenderInformation {
    public activeLanguage : string;
    public availableLanguages : Array<string>;
    public languageURLs : { [key:string]:string; } = {};
    public username : string;
    public loggedin : boolean;


    /**
     * Constructor that initializes the render information.
     * @param req The MeshRequest.
     * @param node The MeshNode that should be rendered.
     */
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
            req.session[meshClient.MeshAuth.MESH_USER_SESSION_KEY] : req.meshConfig.publicUser.username;
        this.loggedin = this.username !== req.meshConfig.publicUser.username;
    }
}

/**
 * Render data that is passed to the rendered template and contains the data that should be rendered.
 */
export class RenderData {
    public node : IMeshNode<any>;
    public nodes : Array<IMeshNode<any>>;
    public renderInformation : RenderInformation;
    public meta : any;
    constructor(){
        this.meta = {};
    }
}

/**
 * The MeshRenderer is responsible for rendering templates.
 */
export class MeshRenderer {

    public static TEMPLATE_EXTENSION : string = '.html';

    private schemaHandlerStore : handler.SchemaHandlerStore;
    private errorHandlerStore : handler.ErrorHandlerStore;
    private viewHandlerStore : handler.ViewHandlerStore;

    /**
     * Initialize the renderer.
     * @param app Express app.
     * @param viewDir Directory that contains the templates.
     */
    constructor(private app : express.Express, private viewDir : string){
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
            this.handleMicroNodeFields(node, req , res).then((node : IMeshNode<T>) => {
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

    private handleMicroNodeFields<T>(node : IMeshNode<T>, req : IMeshRequest, res : IMeshResponse) : Q.Promise<IMeshNode<T>> {
        var deferred = Q.defer<IMeshNode<T>>(),
            promises = [];
        if (u.isDefined(node) && u.isDefined(node.fields)) {
            Object.keys(node.fields).forEach((key) => {
                var field = node.fields[key];
                promises.push(this.resolveField(field, req, res).then((resolved)=>{
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

    private resolveField(field : any, req : IMeshRequest, res : IMeshResponse) : Q.Promise<any> {
        var listpromises = [];
        if (u.isDefined(field) && Array.isArray(field)) {
            field.forEach((listitem)=>{
                // check if there is a schema, if not we just add the node itself
                if (u.isDefined(listitem.schema) || u.isDefined(listitem.microschema) ) {
                    listpromises.push(this.meshNodeToString(listitem, req, res));
                } else {
                    listpromises.push(Q.fcall(()=>{
                        return listitem;
                    }));
                }
            });
            return Q.all(listpromises);
        } else if (u.isDefined(field) && (u.isDefined(field.schema) || u.isDefined(field.microschema))) {
            return this.meshNodeToString(field, req, res);
        } else {
            return Q.fcall(()=>{
                return field;
            });
        }
    }

    private meshNodeToString<T>(node : IMeshNode<T>, req : IMeshRequest, res : IMeshResponse) : Q.Promise<string> {
        var deferred = Q.defer<string>(),
            key : string = u.isDefined(node) ? this.getSchemaKey(node): undefined;
        if (u.isDefined(key)) {
            this.schemaHandlerStore.workSchemaHandlers(key, node, req, res).then((node : IMeshNode<T>) => {
                this.viewExists(key).then(() => {
                    this.renderTemplate(key, node).then((html : string) => {
                        deferred.resolve(html);
                    }).catch((err) => {
                        console.error('Error while rendering template for {' + key + '}. Using blank.',err);
                        deferred.resolve('');
                    })
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

    private renderTemplate(name : string, data : any) : Q.Promise<string> {
        var deferred = Q.defer<string>();
            if (!u.isDefined(this.app)) {
                deferred.reject("App not defined. Call setApp with the Express app.");
            } else {
                this.app.render(name, data, (err : Error, html : string) => {
                   if (u.isDefined(err)) {
                       deferred.reject(err);
                   } else {
                       deferred.resolve(html);
                   }
                });
            }
        return deferred.promise;
    }

    public getRenderData<T>(node : IMeshNode<T>, req : IMeshRequest) : RenderData {
        var data = new RenderData();
        lang.setActiveLanguage(req, node.language);
        data.node = node;
        data.renderInformation = new RenderInformation(req, node);
        return data;
    }
}
