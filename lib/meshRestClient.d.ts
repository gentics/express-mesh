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
export declare class MeshRestResponse<T> {
    status: number;
    data: T;
    isBinary: boolean;
    stream: http.IncomingMessage;
    constructor(status: number, data: T, isBinary: boolean);
}
export declare enum MeshAuthType {
    BASIC = 0,
}
export declare class MeshAuth {
    static MESH_USER_SESSION_KEY: string;
    static MESH_PASSWORD_SESSION_KEY: string;
    type: MeshAuthType;
    header: string;
    constructor(request: IMeshRequest);
    private getBasicAuthHeader(username, password);
}
export declare class MeshRequestOptions {
    url: string;
    method: string;
    data: any;
    params: IMeshNodeListQueryParams;
    auth: MeshAuth;
    logging: LoggingConfig;
    constructor(request: IMeshRequest);
}
export declare class MeshRestClient {
    private static NODES_ENDPOINT;
    private static NAVIGATION_ENDPOINT;
    private static CHILDREN_ENDPOINT;
    private static TAG_FAMILIES_ENDPOINT;
    private publicMeshCookieUserStore;
    getNavigationByPath(req: IMeshRequest, path: string, maxDepth?: number): Q.Promise<MeshRestResponse<IMeshNav>>;
    getNavigationByUUID(req: IMeshRequest, uuid: string, maxDepth?: number): Q.Promise<MeshRestResponse<IMeshNav>>;
    getWebrootNode<T>(req: IMeshRequest, params?: MeshQueryParams): Q.Promise<MeshRestResponse<IMeshNode<T>>>;
    getMeshNode<T>(req: IMeshRequest, uuid: string, params?: MeshQueryParams): Q.Promise<MeshRestResponse<IMeshNode<T>>>;
    getChildren<T>(req: IMeshRequest, uuid: string, lang: string, params?: IMeshNodeListQueryParams): Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshNode<T>>>>;
    meshSearch<T>(req: IMeshRequest, query: IMeshSearchQuery, params?: IMeshNodeListQueryParams): Q.Promise<MeshRestResponse<IMeshNodeListResponse<T>>>;
    getTagFamilies(req: IMeshRequest, params?: MeshQueryParams): Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshTagFamily>>>;
    getTagsOfTagFamily(req: IMeshRequest, uuid: string, params?: MeshQueryParams): Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshTag>>>;
    login(req: IMeshRequest, username: string, password: string): Q.Promise<boolean>;
    logout(req: IMeshRequest): Q.Promise<boolean>;
    private meshSimpleGET<T>(req, url, params?);
    meshPOST(requestOptions: MeshRequestOptions, data?: any): Q.Promise<MeshRestResponse<any>>;
    /**
     * Convert a queryParams object into a URL-encoded string.
     */
    private queryStringFromParams(queryParams);
    private makeMeshRequest(requestOptions);
}
