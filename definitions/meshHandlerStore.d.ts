import Q = require('q');
import { RenderData } from "./meshRenderer";
import { IMeshResponse } from "./index";
import { IMeshRequest } from "./index";
import { IMeshNode } from "./index";
export interface IMeshSchemaHandler<T> {
    (item: IMeshNode<T>, req: IMeshRequest, res: IMeshResponse): Q.Promise<IMeshNode<T>>;
}
export interface IMeshViewHandler {
    (renderdata: RenderData, req: IMeshRequest, res: IMeshResponse): Q.Promise<RenderData>;
}
export interface IMeshErrorHandler {
    (error: any, status: number, req: IMeshRequest, res: IMeshResponse): void;
}
export declare class SchemaHandlerStore {
    registerSchemaHandler<T>(schema: string, handler: IMeshSchemaHandler<T>): void;
    unregisterSchemaHandler<T>(schema: string, handler: IMeshSchemaHandler<T>): void;
    workSchemaHandlers<T>(schema: string, item: IMeshNode<T>, req?: IMeshRequest, res?: IMeshResponse): Q.Promise<IMeshNode<T>>;
}
export declare class ViewHandlerStore {
    private handlers;
    registerViewHandler(handler: IMeshViewHandler): void;
    unregisterSchemaHandler(handler: IMeshViewHandler): void;
    workViewHandlers(renderdata: RenderData, req?: IMeshRequest, res?: IMeshResponse): Q.Promise<RenderData>;
}
export declare class ErrorHandlerStore {
    registerErrorHandler(status: number, handler: IMeshErrorHandler): void;
    unregisterErrorHandler(status: number, handler?: IMeshErrorHandler): void;
    workErrorHandler(status: number, error: any, req: IMeshRequest, res: IMeshResponse): Q.Promise<void>;
}
