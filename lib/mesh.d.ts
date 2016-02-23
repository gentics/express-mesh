import Q = require('q');
import express = require('express');
import { MeshConfig } from "./config";
import { IMeshSchemaHandler } from "./meshHandlerStore";
import { IMeshViewHandler } from "./meshHandlerStore";
import { IMeshErrorHandler } from "./meshHandlerStore";
import { RenderData } from "./meshRenderer";
import { MeshRestResponse } from "./meshRestClient";
import { IFilterRegisterFunction } from "./meshTemplateFilters";
/**
 * Wrapper for the express.Request.
 * We can use them to add properties to the request.
 */
export interface IMeshRequest extends express.Request {
    meshConfig: MeshConfig;
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
    lang?: string;
    resolveLinks?: string;
    maxDepth?: number;
}
/**
 * Implementation of IMeshNodeListQueryParams.
 * Possible request options for Mesh list requests.
 */
export declare class MeshQueryParams implements IMeshNodeListQueryParams {
    expand: string;
    expandAll: boolean;
    page: number;
    perPage: number;
    orderBy: string;
    lang: string;
    maxDepth: number;
}
/**
 * Mesh response of a list of Mesh Objects.
 */
export interface IMeshNodeListResponse<T> {
    _metainfo: IMeshMetaInfo;
    data: Array<T>;
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
    sort?: any;
    query?: any;
    filter?: any;
}
/**
 * Mesh object reference.
 */
export interface IMeshRef {
    name?: string;
    uuid?: string;
}
/**
 * Mesh node reference.
 */
export interface IMeshNodeRef {
    displayName: string;
    uuid: string;
    schema: IMeshRef;
}
/**
 * Possible mesh permissions.
 */
export declare enum MeshPermission {
    CREATE,
    READ,
    UPDATE,
    DELETE,
}
/**
 * Mesh navigation object.
 * The mesh navigation object has a root node, which is a MeshNavElement.
 */
export interface IMeshNav {
    root: IMeshNavElement;
}
/**
 * MeshNavElement.
 * Consists of the uuid of the node, the node itself and its children.
 */
export interface IMeshNavElement {
    uuid: string;
    node: IMeshNode<any>;
    children: Array<IMeshNavElement>;
}
/**
 * A Mesh object. This object is the base for more complex objects, such as Mesh Nodes.
 */
export interface IMeshObject {
    uuid: string;
    creator: IMeshRef;
    created: number;
    editor: IMeshRef;
    edited: number;
    permissions: Array<MeshPermission>;
}
/**
 * Representation of a tag family in mesh.
 */
export interface IMeshTagFamily extends IMeshObject {
    name: string;
}
/**
 * Fields node for the MeshTag containing the "value" of the tag as name.
 */
export interface ITagFields {
    name: string;
}
/**
 * Representation of a MeshTag.
 */
export interface IMeshTag extends IMeshObject {
    tagFamily: IMeshRef;
    fields: ITagFields;
}
/**
 * Representation of a MeshNode.
 * This representation is generic, because its fields are defined in the
 * Schema of the node.
 */
export interface IMeshNode<T> {
    uuid: string;
    creator: IMeshRef;
    created: number;
    editor: IMeshRef;
    edited: number;
    permissions: Array<MeshPermission>;
    language: string;
    availableLanguages: Array<string>;
    languagePaths?: {
        [key: string]: string;
    };
    parentNode: IMeshNodeRef;
    tags: IMeshTags;
    childrenInfo: any;
    schema?: IMeshRef;
    microschema?: IMeshRef;
    published: boolean;
    displayField: string;
    fields: T;
    url?: string;
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
export declare class Mesh {
    private app;
    private config;
    private meshClient;
    private renderer;
    /**
     * Constructor for the main frontend API entry point.
     * @param app Express app.
     * @param config Configuration for the mesh server.
     */
    constructor(app: express.Express, config: MeshConfig);
    /**
     * Register a custom schema handler.
     * A registered schema handler will be executed before a node with the schema it has been
     * registered for will be rendered. This can be used to fetch additional information and
     * perform operations on the data provided by Mesh.
     * @param schema Schema the handler should be registered for
     * @param handler The handler that should be registered
     */
    registerSchemaHandler<T>(schema: string, handler: IMeshSchemaHandler<T>): void;
    /**
     * Register a custom view handler.
     * A view handler will be executed every time before a view is being rendered by the Mesh
     * frontend. This can be used to fetch additional information and perform operations on the
     * data provided by Mesh.
     * @param handler The handler that should be registered
     */
    registerViewHandler(handler: IMeshViewHandler): void;
    /**
     * Register a custom error handler.
     * A error handler will be executed if an error with the status it has been registered for
     * occurs.
     * @param status The status the handler should be registered for
     * @param handler The handler that should be registered
     */
    registerErrorHandler(status: number, handler: IMeshErrorHandler): void;
    /**
     * Render a Mesh node.
     * This function will render the provided node with the view that is named after the node's schema.
     * If the view with this name is not available, the default view will be rendered.
     * All registered handlers that apply for this function will be executed.
     * @param node Mesh node that should be rendered.
     * @param req The mesh request / Express request.
     * @param res The mesh response / Express response.
     */
    renderNode(node: IMeshNode<any>, req: IMeshRequest, res: IMeshResponse): void;
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
    renderView(view: string, renderdata: RenderData, req: IMeshRequest, res: IMeshResponse): void;
    /**
     * Login to Gentics Mesh with the provided user. All subsequent requests with the same session
     * will use the provided credentials for requests to Mesh.
     * @param req The mesh request / Express request.
     * @param username Login
     * @param password Password
     * @returns {Promise<U>} A promise that will be fulfilled as soon es the login completes and will
     *          be rejected if the login fails.
     */
    login(req: IMeshRequest, username: string, password: string): Q.Promise<boolean>;
    /**
     * Logout from Gentics Mesh. All subsequent requests with the same session will use the default
     * user that has been configured in the MeshConfig for requests to Mesh.
     * @param req The mesh request / Express request.
     * @returns {Promise<U>} A promise that will be fulfilled as soon as the logout completes and will
     *          be rejected if the logout fails.
     */
    logout(req: IMeshRequest): Q.Promise<boolean>;
    /**
     * Perform a search for Mesh Nodes.
     * @param req The mesh request / Express request.
     * @param query The elastic search query object.
     * @param params NodeListParams to implement pagination.
     * @returns {Promise<U>} A promise that will be fulfilled once the search request complets and will be rejected
     *          if the search fails.
     */
    searchNodes<T>(req: IMeshRequest, query: IMeshSearchQuery, params?: IMeshNodeListQueryParams): Q.Promise<IMeshNodeListResponse<IMeshNode<T>>>;
    /**
     * Load all child nodes of a specified node.
     * @param req The mesh request / Express request.
     * @param uuid The specified node, which children should be loaded.
     * @param lang The language the nodes should be loaded in.
     * @param opts NodeListParams to implement pagination.
     * @returns {Promise<U>} A promise that will be fulfilled once the children have been loaded and will be rejected
     *          if loading the children fails.
     */
    getChildren<T>(req: IMeshRequest, uuid: string, lang: string, opts?: IMeshNodeListQueryParams): Q.Promise<IMeshNodeListResponse<IMeshNode<T>>>;
    /**
     * Load a Mesh node with the specified uuid.
     * @param req The mesh request / Express request.
     * @param uuid The uuid of the node that should be loaded.
     * @param params QueryParams to specify the language and other options.
     * @returns {Promise<U>} A promise that will be fulfilled once the Mesh node is loaded and will be rejected
     *          if loading of the Mesh node fails.
     */
    getNode<T>(req: IMeshRequest, uuid: string, params?: MeshQueryParams): Q.Promise<IMeshNode<T>>;
    /**
     * Load a navigation object by its path. e.g. / for the root navigation.
     * You can only load navigation objects for container nodes.
     * @param req The mesh request / Express request.
     * @param path The path for which the navigation object should be loaded.
     * @param maxDepth Maximal depth of the loaded navigation tree.
     * @returns {Q.Promise<MeshRestResponse<IMeshNav>>} A promise that will be fulfilled once the navigation object
     *          has been loaded and will be rejected if loading of the navigation object fails.
     */
    getNavigationByPath(req: IMeshRequest, path: string, maxDepth?: number): Q.Promise<MeshRestResponse<IMeshNav>>;
    /**
     * Load a navigation object by its uuid.
     * You can only load navigation objects for container nodes.
     * @param req The mesh request / Express request.
     * @param uuid The uuid of the root node of the navigation tree you want to load.
     * @param maxDepth Maximal depth of the loaded navigation tree.
     * @returns {Q.Promise<MeshRestResponse<IMeshNav>>} A promise that will be fulfilled once the navigation object
     *          has been loaded and will be rejected if loading of the navigation object fails.
     */
    getNavigationByUUID(req: IMeshRequest, uuid: string, maxDepth?: number): Q.Promise<MeshRestResponse<IMeshNav>>;
    /**
     * Load the tag families of the current project.
     * @param req The mesh request / Express request.
     * @param params Query params to specify pagination.
     * @returns {Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshTagFamily>>>} A promise that will be fulfilled once
     *          the tag families have been loaded and will be rejected if loading of the tag families fails.
     */
    getTagFamilies(req: IMeshRequest, params?: MeshQueryParams): Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshTagFamily>>>;
    /**
     * Load the tags that are contained in a tag family.
     * @param req The mesh request / Express request.
     * @param uuid The uuid of the tag family.
     * @param params Query params to specify pagination.
     * @returns {Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshTag>>>} A promise that will be fulfilled once
     *          the tags have been loaded and will fail if loading of the tags fail.
     */
    getTagsOfTagFamily(req: IMeshRequest, uuid: string, params?: MeshQueryParams): Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshTag>>>;
    /**
     * Make a GET request to the mesh backend.
     * @param req The Mesh Request
     * @param url The url you want to GET
     * @param params Query params for your request.
     * @returns {Q.Promise<MeshRestResponse<T>>} A promise that will be fulfilled once the request has been completed
     *          and will fail if the request fails.
     */
    get<T>(req: IMeshRequest, url: string, params?: MeshQueryParams): Q.Promise<MeshRestResponse<T>>;
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
    request<T>(method: string, req: IMeshRequest, url: string, params?: MeshQueryParams, data?: any): Q.Promise<MeshRestResponse<T>>;
    /**
     * Private method that constructs the quest handler, that will serve the Mesh content from webroot.
     * @returns {function(IMeshRequest, express.Response): undefined}
     */
    private getRequestHandler();
    /**
     * Private method that will register the mesh middleware in the Express app.
     * This middleware will enrich the mesh request with the configuration and the
     * active language.
     * @param app The Express app.
     */
    private registerMeshMiddleware(app);
    /**
     * Register default template filters.
     * Out of the box we support registering filters with swig and handlebars. If you have a different template engine
     * please pass a register function to register the filters with your template engine. This function will then be called
     * for each of the mesh filters.
     * @param engine Your template engine.
     * @param registerfunction [optional] register function that will be called for each of the mesh filters.
     **/
    registerTemplateFilters(engine: any, registerfunction?: IFilterRegisterFunction): void;
    /**
     * Initialize the Mesh server. Call this method after you added your own request handlers to the Express app,
     * as this method will attach a * handler to catch all requests that have not been handled by another handler.
     * @param app The Express app.
     */
    server(app: express.Express): void;
}
