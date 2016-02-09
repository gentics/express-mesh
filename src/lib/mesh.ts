'use strict';
import Q = require('q');
import express = require('express');
import rest = require('./meshRestClient');
import renderer = require('./meshRenderer');
import lang = require('./meshLanguages');
import u = require('./meshUtil');

import {MeshConfig} from "./config";
import {MeshRenderer} from "./meshRenderer";
import {MeshRestClient} from "./meshRestClient";
import {IMeshSchemaHandler} from "./meshHandlerStore";
import {IMeshViewHandler} from "./meshHandlerStore";
import {IMeshErrorHandler} from "./meshHandlerStore";
import {RenderData} from "./meshRenderer";
import {MeshRestResponse} from "./meshRestClient";

    /**
     * Wrapper for the express.Request.
     * We can use them to add properties to the request.
     */
    export interface IMeshRequest extends express.Request {
        meshConfig : MeshConfig;
    }

    /**
     * Wrapper for the express.Response.
     * We can use them to add properties to the response.
     */
    export interface IMeshResponse extends express.Response {
    }

    /**
     * Possible request options for Mesh list requests.
     */
    export interface IMeshNodeListQueryParams {
        expand?: string;
        page?: number;
        perPage?: number;
        orderBy?: string;
        lang?:string
        resolveLinks?:string;
        maxDepth?:number;
    }

    /**
     * Implementation of IMeshNodeListQueryParams.
     * Possible request options for Mesh list requests.
     */
    export class MeshQueryParams implements IMeshNodeListQueryParams {
        public expand : string;
        public expandAll : boolean;
        public page : number;
        public perPage : number;
        public orderBy : string;
        public lang : string;
        public maxDepth : number;
    }

    /**
     * Mesh response of a list of Mesh Objects.
     */
    export interface IMeshNodeListResponse<T> {
        _metainfo : IMeshMetaInfo;
        data : Array<T>;
    }

    /**
     * Meta information contained in IMeshNodeListResponse
     */
    export interface IMeshMetaInfo {
        page: number;
        pageCount: number;
        perPage: number;
        totalCount: number;
    }

    /**
     * Search query structure for the elastic search in Mesh.
     */
    export interface IMeshSearchQuery {
        sort? : any;
        query? : any;
        filter? : any;
    }

    export interface IMeshRef {
        name? : string;
        uuid? : string;
    }

    export interface IMeshNodeRef {
        displayName : string;
        uuid : string;
        schema : IMeshRef;
    }

    export enum MeshPermission {
        CREATE = <any>"create",
        READ = <any>"read",
        UPDATE = <any>"update",
        DELETE = <any>"delete"
    }

    export interface IMeshNav {
        root : IMeshNavElement;
    }

    export interface IMeshNavElement {
        uuid : string;
        node : IMeshNode<any>;
        children : Array<IMeshNavElement>;
    }

    export interface IMeshObject {
        uuid : string;
        creator : IMeshRef;
        created : number;
        editor : IMeshRef;
        edited : number;
        permissions : Array<MeshPermission>;
    }

    export interface IMeshTagFamily extends IMeshObject {
        name : string;
    }

    export interface ITagFields {
        name : string;
    }

    export interface IMeshTag extends IMeshObject {
        tagFamily : IMeshRef;
        fields : ITagFields;
    }

    export interface IMeshNode<T> {
        uuid : string;
        creator : IMeshRef;
        created : number;
        editor : IMeshRef;
        edited : number;
        permissions : Array<MeshPermission>;
        language : string;
        availableLanguages : Array<string>;
        languagePaths? : { [key:string]:string; };
        parentNode : IMeshNodeRef;
        tags : IMeshTags;
        childrenInfo : any;
        schema? : IMeshRef;
        microschema? : IMeshRef;
        published : boolean;
        displayField: string;
        fields : T;
        url? : string;
        container: boolean;
    }

    export interface IMeshTags {
        [tagFamily: string]: {
            uuid: string;
            items: Array<IMeshRef>;
        };
    }

    export interface BinaryNode<T> extends IMeshNode<T> {
        binaryProperties: {
            sha512sum: string;
            fileSize: number;
            mimeType: string;
        };
        fileName: string;
        path: string;
    }

    export class Mesh {

        private meshClient : MeshRestClient;
        private renderer : MeshRenderer;

        constructor(private config : MeshConfig) {

            this.meshClient = new MeshRestClient();
            this.renderer = new MeshRenderer(this.config.viewDirectory);
        }

        public registerSchemaHandler<T>(schema : string, handler : IMeshSchemaHandler<T>) : void {
            this.renderer.registerSchemaHandler(schema, handler);
        }

        public registerViewHandler(handler : IMeshViewHandler) : void {
            this.renderer.registerViewRenderHandler(handler);
        }

        public registerErrorHandler(status : number, handler : IMeshErrorHandler) : void {
            this.renderer.registerErrorHandler(status, handler);
        }

        public renderMeshNode(node : IMeshNode<any>, req : IMeshRequest, res : IMeshResponse) : void {
            this.renderer.renderMeshNode(node, req, res);
        }

        public renderView(view : string, renderdata : RenderData, req : IMeshRequest, res : IMeshResponse) : void {
            this.renderer.renderView(view, renderdata, req, res);
        }

        public login(req : IMeshRequest, username : string, password : string) : Q.Promise<boolean> {
            return this.meshClient.login(req, username, password).then((loggedin) => {
                if (loggedin === true) {
                    req.session[rest.MeshAuth.MESH_USER_SESSION_KEY] = username;
                    req.session[rest.MeshAuth.MESH_PASSWORD_SESSION_KEY] = password;
                }
                return loggedin;
            });
        }

        public logout(req : IMeshRequest) : Q.Promise<boolean> {
            return this.meshClient.logout(req).then((loggedout) => {
                req.session[rest.MeshAuth.MESH_USER_SESSION_KEY] = undefined;
                req.session[rest.MeshAuth.MESH_PASSWORD_SESSION_KEY] = undefined;
                return loggedout;
            })
        }

        public searchMeshNodes<T>(req : IMeshRequest, query : IMeshSearchQuery, params? : IMeshNodeListQueryParams) : Q.Promise<IMeshNodeListResponse<IMeshNode<T>>> {
            return this.meshClient.meshSearch<IMeshNode<T>>(req, query, params).then((response)=> {
                return response.data;
            });
        }

        public getChildren<T>(req : IMeshRequest, uuid : string, lang : string, opts? : IMeshNodeListQueryParams) : Q.Promise<IMeshNodeListResponse<IMeshNode<T>>> {
            return this.meshClient.getChildren<T>(req, uuid, lang, opts).then((response) => {
                return response.data;
            });
        }

        public getMeshNode<T>(req : IMeshRequest, uuid : string, params? : MeshQueryParams) : Q.Promise<IMeshNode<T>> {
            return this.meshClient.getMeshNode<T>(req, uuid, params).then((response)=> {
                return response.data;
            });
        }

        public getNavigationByPath(req : IMeshRequest, path : string, maxDepth? : number) : Q.Promise<MeshRestResponse<IMeshNav>> {
            return this.meshClient.getNavigationByPath(req, path, maxDepth);
        }

        public getNavigationByUUID(req : IMeshRequest, uuid : string, maxDepth? : number) : Q.Promise<MeshRestResponse<IMeshNav>> {
            return this.meshClient.getNavigationByUUID(req, uuid, maxDepth);
        }

        public getTagFamilies(req : IMeshRequest, params? : MeshQueryParams) : Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshTagFamily>>> {
            return this.meshClient.getTagFamilies(req, params);
        }

        public getTagsOfTagFamily(req : IMeshRequest, uuid : string, params? : MeshQueryParams) : Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshTag>>> {
            return this.meshClient.getTagsOfTagFamily(req, uuid, params);
        }

        private getRequestHandler() : (req : express.Request, res : express.Response)=>void {
            return (req : IMeshRequest, res : express.Response) => {
                this.meshClient.getWebrootNode<IMeshNode<any>>(req).then((response : MeshRestResponse<IMeshNode<any>>) => {
                    var status = Number(response.status);
                    if (status < 400) {
                        res.status(response.status);
                        if (response.isBinary) {
                            response.stream.pipe(res);
                        } else {
                            this.renderer.renderMeshNode(response.data, req, res);
                        }
                    } else {
                        this.renderer.renderError(status, req, res, response.data);
                    }
                }).catch((err) => {
                    this.renderer.renderError(500, req, res, err);
                });
            };
        }

        public registerMeshMiddleware(app : express.Express) : void {
            app.use('*', (req : IMeshRequest, res : IMeshResponse, next : Function) => {
                if (!u.isDefined(req.meshConfig)) {
                    req.meshConfig = this.config;
                }
                if (u.isDefined(req.query.lang)) {
                    lang.setActiveLanguage(req, req.query.lang);
                }
                lang.readLanguageFiles(this.config);
                next();
            });
        }

        public server(app : express.Express) : void {
            this.registerMeshMiddleware(app);
            app.get('*', this.getRequestHandler());
        }
    }

