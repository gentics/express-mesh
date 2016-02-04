import Q = require('q');
import express = require('express');
import { MeshConfig } from "./config";
import { IMeshSchemaHandler } from "./meshHandlerStore";
import { IMeshViewHandler } from "./meshHandlerStore";
import { IMeshErrorHandler } from "./meshHandlerStore";
import { MeshRestResponse } from "./meshRestClient";
import { RenderData } from "./meshRenderer";
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
export interface IMeshRef {
    name?: string;
    uuid?: string;
}
export interface IMeshNodeRef {
    displayName: string;
    uuid: string;
    schema: IMeshRef;
}
export declare enum MeshPermission {
    CREATE,
    READ,
    UPDATE,
    DELETE,
}
export interface IMeshNav {
    root: IMeshNavElement;
}
export interface IMeshNavElement {
    uuid: string;
    node: IMeshNode<any>;
    children: Array<IMeshNavElement>;
}
export interface IMeshObject {
    uuid: string;
    creator: IMeshRef;
    created: number;
    editor: IMeshRef;
    edited: number;
    permissions: Array<MeshPermission>;
}
export interface IMeshTagFamily extends IMeshObject {
    name: string;
}
export interface ITagFields {
    name: string;
}
export interface IMeshTag extends IMeshObject {
    tagFamily: IMeshRef;
    fields: ITagFields;
}
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
export declare class Mesh {
    private config;
    private meshClient;
    private renderer;
    constructor(config: MeshConfig);
    registerSchemaHandler<T>(schema: string, handler: IMeshSchemaHandler<T>): void;
    registerViewHandler(handler: IMeshViewHandler): void;
    registerErrorHandler(status: number, handler: IMeshErrorHandler): void;
    renderMeshNode(node: IMeshNode<any>, req: IMeshRequest, res: IMeshResponse): void;
    renderView(view: string, renderdata: RenderData, req: IMeshRequest, res: IMeshResponse): void;
    login(req: IMeshRequest, username: string, password: string): Q.Promise<boolean>;
    logout(req: IMeshRequest): Q.Promise<boolean>;
    searchMeshNodes<T>(req: IMeshRequest, query: IMeshSearchQuery, params?: IMeshNodeListQueryParams): Q.Promise<IMeshNodeListResponse<IMeshNode<T>>>;
    getChildren<T>(req: IMeshRequest, uuid: string, lang: string, opts?: IMeshNodeListQueryParams): Q.Promise<IMeshNodeListResponse<IMeshNode<T>>>;
    getMeshNode<T>(req: IMeshRequest, uuid: string, params?: MeshQueryParams): Q.Promise<IMeshNode<T>>;
    getNavigationByPath(req: IMeshRequest, path: string, maxDepth?: number): Q.Promise<MeshRestResponse<IMeshNav>>;
    getNavigationByUUID(req: IMeshRequest, uuid: string, maxDepth?: number): Q.Promise<MeshRestResponse<IMeshNav>>;
    getTagFamilies(req: IMeshRequest, params?: MeshQueryParams): Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshTagFamily>>>;
    getTagsOfTagFamily(req: IMeshRequest, uuid: string, params?: MeshQueryParams): Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshTag>>>;
    private getRequestHandler();
    registerMeshMiddleware(app: express.Express): void;
    server(app: express.Express): void;
}
