'use strict';
import Q = require('q');
import express = require('express');
import rest = require('./meshRestClient');
import renderer = require('./meshRenderer');
import filters = require('./meshTemplateFilters');
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
import {IFilterRegisterFunction} from "./meshTemplateFilters";

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
        includeAll?: boolean;
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
        public includeAll : boolean;
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
        currentPage: number;
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

    /**
     * Mesh object reference.
     */
    export interface IMeshRef {
        name? : string;
        uuid? : string;
    }

    /**
     * Mesh node reference.
     */
    export interface IMeshNodeRef {
        displayName : string;
        uuid : string;
        schema : IMeshRef;
    }

    /**
     * Possible mesh permissions.
     */
    export enum MeshPermission {
        CREATE = <any>"create",
        READ = <any>"read",
        UPDATE = <any>"update",
        DELETE = <any>"delete"
    }

    /**
     * Mesh navigation object.
     * The mesh navigation object has a root node, which is a MeshNavElement.
     */
    export interface IMeshNav {
        root : IMeshNavElement;
    }

    /**
     * MeshNavElement.
     * Consists of the uuid of the node, the node itself and its children.
     */
    export interface IMeshNavElement {
        uuid : string;
        node : IMeshNode<any>;
        children : Array<IMeshNavElement>;
    }

    /**
     * A Mesh object. This object is the base for more complex objects, such as Mesh Nodes.
     */
    export interface IMeshObject {
        uuid : string;
        creator : IMeshRef;
        created : number;
        editor : IMeshRef;
        edited : number;
        permissions : Array<MeshPermission>;
    }

    /**
     * Representation of a tag family in mesh.
     */
    export interface IMeshTagFamily extends IMeshObject {
        name : string;
    }

    /**
     * Fields node for the MeshTag containing the "value" of the tag as name.
     */
    export interface ITagFields {
        name : string;
    }

    /**
     * Representation of a MeshTag.
     */
    export interface IMeshTag extends IMeshObject {
        tagFamily : IMeshRef;
        fields : ITagFields;
    }

    /**
     * Representation of a MeshNode.
     * This representation is generic, because its fields are defined in the
     * Schema of the node.
     */
    export interface IMeshNode<T> {
        uuid : string;
        creator : IMeshRef;
        created : number;
        editor : IMeshRef;
        edited : number;
        permissions : Array<MeshPermission>;
        language : string;
        availableLanguages : Array<string>;
        path? : string;
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

    /**
     * Container for a node's tags.
     */
    export interface IMeshTags {
        [tagFamily: string]: {
            uuid: string;
            items: Array<IMeshRef>;
        };
    }

    /**
     * Representation for a node with binary content.
     */
    export interface BinaryNode<T> extends IMeshNode<T> {
        binaryProperties: {
            sha512sum: string;
            fileSize: number;
            mimeType: string;
        };
        fileName: string;
        path: string;
    }

    /**
     * Main entry point for the frontend API. Use this class to power your express mesh server.
     *
     * Usage:
     *  import * as mesh from 'express-mesh';
     *  var Mesh = new mesh.Mesh(new mesh.MeshConfig('Demo', 'public', 'languages'));
     *  Mesh.server(app);
     */
    export class Mesh {

        private meshClient : MeshRestClient;
        private renderer : MeshRenderer;

        /**
         * Constructor for the main frontend API entry point.
         * @param app Express app.
         * @param config Configuration for the mesh server.
         */
        constructor(private app : express.Express, private config : MeshConfig) {
            this.meshClient = new MeshRestClient();
            this.renderer = new MeshRenderer(this.app, this.config.viewDirectory);
            this.registerMeshMiddleware(app);
        }

        /**
         * Register a custom schema handler.
         * A registered schema handler will be executed before a node with the schema it has been
         * registered for will be rendered. This can be used to fetch additional information and
         * perform operations on the data provided by Mesh.
         * @param schema Schema the handler should be registered for
         * @param handler The handler that should be registered
         */
        public registerSchemaHandler<T>(schema : string, handler : IMeshSchemaHandler<T>) : void {
            this.renderer.registerSchemaHandler(schema, handler);
        }

        /**
         * Register a custom view handler.
         * A view handler will be executed every time before a view is being rendered by the Mesh
         * frontend. This can be used to fetch additional information and perform operations on the
         * data provided by Mesh.
         * @param handler The handler that should be registered
         */
        public registerViewHandler(handler : IMeshViewHandler) : void {
            this.renderer.registerViewRenderHandler(handler);
        }

        /**
         * Register a custom error handler.
         * A error handler will be executed if an error with the status it has been registered for
         * occurs.
         * @param status The status the handler should be registered for
         * @param handler The handler that should be registered
         */
        public registerErrorHandler(status : number, handler : IMeshErrorHandler) : void {
            this.renderer.registerErrorHandler(status, handler);
        }

        /**
         * Render a Mesh node.
         * This function will render the provided node with the view that is named after the node's schema.
         * If the view with this name is not available, the default view will be rendered.
         * All registered handlers that apply for this function will be executed.
         * @param node Mesh node that should be rendered.
         * @param req The mesh request / Express request.
         * @param res The mesh response / Express response.
         */
        public renderNode(node : IMeshNode<any>, req : IMeshRequest, res : IMeshResponse) : void {
            this.renderer.renderMeshNode(node, req, res);
        }

        /**
         * Render a view.
         * This function will render the provided view.
         * If the view with this name is not available, the default view will be rendered.
         * All registered handlers that apply for this function will be executed.
         * @param view name of the view that should be rendered.
         * @param renderdata Data that should be passed to the view.
         * @param req The mesh request / Express request.
         * @param res The mesh response / Express response.
         */
        public renderView(view : string, renderdata : RenderData, req : IMeshRequest, res : IMeshResponse) : void {
            this.renderer.renderView(view, renderdata, req, res);
        }

        /**
         * Login to Gentics Mesh with the provided user. All subsequent requests with the same session
         * will use the provided credentials for requests to Mesh.
         * @param req The mesh request / Express request.
         * @param username Login
         * @param password Password
         * @returns {Promise<U>} A promise that will be fulfilled as soon es the login completes and will
         *          be rejected if the login fails.
         */
        public login(req : IMeshRequest, username : string, password : string) : Q.Promise<boolean> {
            return this.meshClient.login(req, username, password).then((loggedin) => {
                if (loggedin === true) {
                    req.session[rest.MeshAuth.MESH_USER_SESSION_KEY] = username;
                    req.session[rest.MeshAuth.MESH_PASSWORD_SESSION_KEY] = password;
                }
                return loggedin;
            });
        }

        /**
         * Logout from Gentics Mesh. All subsequent requests with the same session will use the default
         * user that has been configured in the MeshConfig for requests to Mesh.
         * @param req The mesh request / Express request.
         * @returns {Promise<U>} A promise that will be fulfilled as soon as the logout completes and will
         *          be rejected if the logout fails.
         */
        public logout(req : IMeshRequest) : Q.Promise<boolean> {
            return this.meshClient.logout(req).then((loggedout) => {
                req.session[rest.MeshAuth.MESH_USER_SESSION_KEY] = undefined;
                req.session[rest.MeshAuth.MESH_PASSWORD_SESSION_KEY] = undefined;
                return loggedout;
            })
        }

        /**
         * Perform a search for Mesh Nodes.
         * @param req The mesh request / Express request.
         * @param query The elastic search query object.
         * @param params NodeListParams to implement pagination.
         * @returns {Promise<U>} A promise that will be fulfilled once the search request complets and will be rejected
         *          if the search fails.
         */
        public searchNodes<T>(req : IMeshRequest, query : IMeshSearchQuery, params? : IMeshNodeListQueryParams) : Q.Promise<IMeshNodeListResponse<IMeshNode<T>>> {
            return this.meshClient.meshSearch<IMeshNode<T>>(req, query, params).then((response)=> {
                return response.data;
            });
        }

        /**
         * Load all child nodes of a specified node.
         * @param req The mesh request / Express request.
         * @param uuid The specified node, which children should be loaded.
         * @param params QueryParams to specify the language and other options.
         * @returns {Promise<U>} A promise that will be fulfilled once the children have been loaded and will be rejected
         *          if loading the children fails.
         */
        public getChildren<T>(req : IMeshRequest, uuid : string, params? : MeshQueryParams) : Q.Promise<IMeshNodeListResponse<IMeshNode<T>>> {
            return this.meshClient.getChildren<T>(req, uuid, params).then((response) => {
                return response.data;
            });
        }

        /**
         * Load a Mesh node with the specified uuid.
         * @param req The mesh request / Express request.
         * @param uuid The uuid of the node that should be loaded.
         * @param params QueryParams to specify the language and other options.
         * @returns {Promise<U>} A promise that will be fulfilled once the Mesh node is loaded and will be rejected
         *          if loading of the Mesh node fails.
         */
        public getNode<T>(req : IMeshRequest, uuid : string, params? : MeshQueryParams) : Q.Promise<IMeshNode<T>> {
            return this.meshClient.getMeshNode<T>(req, uuid, params).then((response)=> {
                return response.data;
            });
        }

        /**
         * Load a navigation object by its path. e.g. / for the root navigation.
         * You can only load navigation objects for container nodes.
         * @param req The mesh request / Express request.
         * @param path The path for which the navigation object should be loaded.
         * @param params QueryParams to specify the language, navigation depth, includeAll and other options.
         * @returns {Q.Promise<MeshRestResponse<IMeshNav>>} A promise that will be fulfilled once the navigation object
         *          has been loaded and will be rejected if loading of the navigation object fails.
         */
        public getNavigationByPath(req : IMeshRequest, path : string, params: MeshQueryParams) : Q.Promise<MeshRestResponse<IMeshNav>> {
            return this.meshClient.getNavigationByPath(req, path, params);
        }

        /**
         * Load a navigation object by its uuid.
         * You can only load navigation objects for container nodes.
         * @param req The mesh request / Express request.
         * @param uuid The uuid of the root node of the navigation tree you want to load.
         * @param params QueryParams to specify the language, navigation depth, includeAll and other options.
         * @returns {Q.Promise<MeshRestResponse<IMeshNav>>} A promise that will be fulfilled once the navigation object
         *          has been loaded and will be rejected if loading of the navigation object fails.
         */
        public getNavigationByUUID(req : IMeshRequest, uuid : string, params: MeshQueryParams) : Q.Promise<MeshRestResponse<IMeshNav>> {
            return this.meshClient.getNavigationByUUID(req, uuid, params);
        }

        /**
         * Load the tag families of the current project.
         * @param req The mesh request / Express request.
         * @param params Query params to specify pagination.
         * @returns {Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshTagFamily>>>} A promise that will be fulfilled once
         *          the tag families have been loaded and will be rejected if loading of the tag families fails.
         */
        public getTagFamilies(req : IMeshRequest, params? : MeshQueryParams) : Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshTagFamily>>> {
            return this.meshClient.getTagFamilies(req, params);
        }

        /**
         * Load the tags that are contained in a tag family.
         * @param req The mesh request / Express request.
         * @param uuid The uuid of the tag family.
         * @param params Query params to specify pagination.
         * @returns {Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshTag>>>} A promise that will be fulfilled once
         *          the tags have been loaded and will fail if loading of the tags fail.
         */
        public getTagsOfTagFamily(req : IMeshRequest, uuid : string, params? : MeshQueryParams) : Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshTag>>> {
            return this.meshClient.getTagsOfTagFamily(req, uuid, params);
        }

        /**
         * Make a GET request to the mesh backend.
         * @param req The Mesh Request
         * @param url The url you want to GET
         * @param params Query params for your request.
         * @returns {Q.Promise<MeshRestResponse<T>>} A promise that will be fulfilled once the request has been completed
         *          and will fail if the request fails.
         */
        public get<T>(req : IMeshRequest, url : string, params? : MeshQueryParams) : Q.Promise<MeshRestResponse<T>> {
            return this.meshClient.meshSimpleGET<T>(req, url, params);
        }

        /**
         * Make a request to the mesh backend.
         * @param method The request method (GET/POST/PUT/DELETE/...)
         * @param req The Mesh Request
         * @param url The url you want to GET
         * @param params Query params for your request.
         * @param data Data you want to send with the request (PUT/POST)
         * @returns {Q.Promise<MeshRestResponse<T>>} A promise that will be fulfilled once the request has been completed
         *          and will fail if the request fails.
         */
        public request<T>(method : string, req : IMeshRequest, url : string, params? : MeshQueryParams, data? : any) : Q.Promise<MeshRestResponse<T>> {
            return this.meshClient.meshSimpleRequest<T>(method, req, url, params, data);
        }

        /**
         * Private method that constructs the quest handler, that will serve the Mesh content from webroot.
         * @returns {function(IMeshRequest, express.Response): undefined}
         */
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

        /**
         * Private method that will register the mesh middleware in the Express app.
         * This middleware will enrich the mesh request with the configuration and the
         * active language.
         * @param app The Express app.
         */
        private registerMeshMiddleware(app : express.Express) : void {
            app.use('*', (req : IMeshRequest, res : IMeshResponse, next : Function) => {
                if (!u.isDefined(req.meshConfig)) {
                    req.meshConfig = this.config;
                }
                if (u.isDefined(req.query.lang)) {
                    lang.setActiveLanguage(req, req.query.lang);
                }
                // polifill for express-session
                if (!u.isDefined(req.session)) {
                    req.session = <Express.Session>{};
                }
                lang.readLanguageFiles(this.config);
                next();
            });
        }

        /**
         * Register default template filters.
         * Out of the box we support registering filters with swig and handlebars. If you have a different template engine
         * please pass a register function to register the filters with your template engine. This function will then be called
         * for each of the mesh filters.
         * @param engine Your template engine.
         * @param registerfunction [optional] register function that will be called for each of the mesh filters.
         **/
        public registerTemplateFilters(engine : any, registerfunction? : IFilterRegisterFunction) : void {
            filters.registerFilters(engine, registerfunction);
        }

        /**
         * Initialize the Mesh server. Call this method after you added your own request handlers to the Express app,
         * as this method will attach a * handler to catch all requests that have not been handled by another handler.
         * @param app The Express app.
         */
        public server(app : express.Express) : void {
            app.get('*', this.getRequestHandler());
        }
    }

