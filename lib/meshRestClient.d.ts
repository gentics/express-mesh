import http = require('http');
import Q = require('q');
import { LoggingConfig } from "./config";
import { IMeshRequest } from "./mesh";
import { IMeshNodeListQueryParams } from "./mesh";
import { IMeshNav } from "./mesh";
import { IMeshNode } from "./mesh";
import { IMeshNodeListResponse } from "./mesh";
import { IMeshSearchQuery } from "./mesh";
import { IMeshTagFamily } from "./mesh";
import { IMeshTag } from "./mesh";
import { MeshQueryParams } from "./mesh";
/**
 * Mesh Rest response object
 */
export declare class MeshRestResponse<T> {
    status: number;
    data: T;
    isBinary: boolean;
    stream: http.IncomingMessage;
    constructor(status: number, data: T, isBinary: boolean);
}
/**
 * Possible authentication methods.
 */
export declare enum MeshAuthType {
    BASIC = 0,
}
/**
 * Mesh authentication obejct.
 */
export declare class MeshAuth {
    static MESH_USER_SESSION_KEY: string;
    static MESH_PASSWORD_SESSION_KEY: string;
    type: MeshAuthType;
    header: string;
    /**
     * Initialize the Mesh authentication object.
     * It generates the needed authentication header for making Mesh requests.
     * @param request The MeshRequest
     */
    constructor(request: IMeshRequest);
    /**
     * Generate basic auth header from username and password.
     * @param username Username
     * @param password Password
     * @returns {string} Header string.
     */
    private getBasicAuthHeader(username, password);
}
/**
 * Options for making Mesh Requests.
 */
export declare class MeshRequestOptions {
    url: string;
    method: string;
    data: any;
    params: IMeshNodeListQueryParams;
    auth: MeshAuth;
    logging: LoggingConfig;
    /**
     * Initialize request options and prefill it with the authentication object.
     * @param request MeshRequest
     */
    constructor(request: IMeshRequest);
}
/**
 * MeshRestClient that can be used to make requests to the mesh backend.
 */
export declare class MeshRestClient {
    private static NODES_ENDPOINT;
    private static NAVIGATION_ENDPOINT;
    private static CHILDREN_ENDPOINT;
    private static TAG_FAMILIES_ENDPOINT;
    private publicMeshCookieUserStore;
    /**
     *
     * @param req
     * @param path
     * @param maxDepth
     * @returns {Q.Promise<MeshRestResponse<IMeshNav>>}
     */
    getNavigationByPath(req: IMeshRequest, path: string, maxDepth?: number, includeAll?: boolean): Q.Promise<MeshRestResponse<IMeshNav>>;
    getNavigationByUUID(req: IMeshRequest, uuid: string, maxDepth?: number, includeAll?: boolean): Q.Promise<MeshRestResponse<IMeshNav>>;
    getWebrootNode<T>(req: IMeshRequest, params?: MeshQueryParams): Q.Promise<MeshRestResponse<IMeshNode<T>>>;
    getMeshNode<T>(req: IMeshRequest, uuid: string, params?: MeshQueryParams): Q.Promise<MeshRestResponse<IMeshNode<T>>>;
    getChildren<T>(req: IMeshRequest, uuid: string, lang?: string, params?: IMeshNodeListQueryParams): Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshNode<T>>>>;
    meshSearch<T>(req: IMeshRequest, query: IMeshSearchQuery, params?: IMeshNodeListQueryParams): Q.Promise<MeshRestResponse<IMeshNodeListResponse<T>>>;
    getTagFamilies(req: IMeshRequest, params?: MeshQueryParams): Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshTagFamily>>>;
    getTagsOfTagFamily(req: IMeshRequest, uuid: string, params?: MeshQueryParams): Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshTag>>>;
    login(req: IMeshRequest, username: string, password: string): Q.Promise<boolean>;
    logout(req: IMeshRequest): Q.Promise<boolean>;
    meshSimpleGET<T>(req: IMeshRequest, url: string, params?: MeshQueryParams): Q.Promise<MeshRestResponse<T>>;
    meshSimpleRequest<T>(method: string, req: IMeshRequest, url: string, params?: MeshQueryParams, data?: any): Q.Promise<MeshRestResponse<T>>;
    meshPOST(requestOptions: MeshRequestOptions, data?: any): Q.Promise<MeshRestResponse<any>>;
    /**
     * Convert a queryParams object into a URL-encoded string.
     */
    private queryStringFromParams(queryParams);
    private makeMeshRequest(requestOptions);
}
