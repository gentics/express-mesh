'use strict';

import Q = require('q');
import path = require('path');
import u = require('./meshUtil');

import {RenderData} from "./meshRenderer";
import {IMeshResponse} from "./mesh";
import {IMeshRequest} from "./mesh";
import {IMeshNode} from "./mesh";

/**
 * Interface for the schema handler. A schema handler can be registered for a schema. If registered, it will be executed
 * before a node with this schema is being rendered.
 */
export interface IMeshSchemaHandler<T> {
    (item : IMeshNode<T>, req : IMeshRequest, res : IMeshResponse) : Q.Promise<IMeshNode<T>>;
}

/**
 * Interface for the view handler. A view handler can be registered. If registered, it will be executed becore a
 * view is being rendered.
 */
export interface IMeshViewHandler {
    (renderdata : RenderData, req : IMeshRequest, res : IMeshResponse) : Q.Promise<RenderData>;
}

/**
 * Interface for the error handler. An error handler can be registered for an error status. If registered, it will be
 * executed if an error with this status code occurs.
 */
export interface IMeshErrorHandler {
    (error : any, status : number, req : IMeshRequest, res : IMeshResponse) : void;
}

/**
 * Schema handler store. This store keeps the registered schema handlers.
 * Go through the Mesh API to register a schema handler.
 */
export class SchemaHandlerStore {

    /**
     * Register a schema handler.
     * @param schema The schema, the handler should be registered for.
     * @param handler The handler, that should be registered.
     */
    public registerSchemaHandler<T>(schema : string, handler : IMeshSchemaHandler<T>) : void {
        var list = this[schema];
        if (!u.isDefined(list)) {
            list = [];
            this[schema] = list;
        }
        list.push(handler);
    }

    /**
     * Unregister a schema handler.
     * @param schema The schema, the handler should unregistered from.
     * @param handler The handler, that should be unregistered.
     */
    public unregisterSchemaHandler<T>(schema : string, handler : IMeshSchemaHandler<T>) : void {
        var list = this[schema];
        if (u.isDefined(list)) {
            if (list.indexOf(handler) >= 0) {
                list.splice(list.indexOf(handler), 1);
            }
        }
    }

    /**
     * Executes the schema handlers for a passed MeshNode.
     * @param schema The schema, for which the handlers should be executed.
     * @param item The MeshNode, that should be processed in the handlers.
     * @param req The MeshRequest.
     * @param res The MeshResponse
     * @returns {Promise<IMeshNode<T>>} A promise, that will be fulfilled, once all the handlers have been processed
     *          and will be rejected if executing a handler fails.
     */
    public workSchemaHandlers<T>(schema : string,
                                 item : IMeshNode<T>,
                                 req? : IMeshRequest,
                                 res? : IMeshResponse) : Q.Promise<IMeshNode<T>> {
        var deferred = Q.defer<IMeshNode<T>>(),
            list = this[schema];

        if (u.isDefined(list)) {
            u.asyncLoop(list, (handler : IMeshSchemaHandler<T>)=>{
                return handler(item, req, res);
            }).then(()=>{
                deferred.resolve(item);
            }).catch((err) => {
                deferred.reject(err);
            });
        } else {
            deferred.resolve(item);
        }
        return deferred.promise;
    }
}

/**
 * View handler store. This store keeps the registered view handlers.
 * Go through the Mesh API to register a view handler.
 */
export class ViewHandlerStore {

    private handlers : Array<IMeshViewHandler> = [];

    /**
     * Register a view handler.
     * @param handler The handler that should be registered.
     */
    public registerViewHandler(handler : IMeshViewHandler) : void {
        if (!u.isDefined(this.handlers)) {
            this.handlers = [];
        }
        this.handlers.push(handler);
    }

    /**
     * Unregister a view handler.
     * @param handler The handler that should be unregistered.
     */
    public unregisterSchemaHandler(handler : IMeshViewHandler) : void {
        if (u.isDefined(this.handlers)) {
            if (this.handlers.indexOf(handler) >= 0) {
                this.handlers.splice(this.handlers.indexOf(handler), 1);
            }
        }
    }

    /**
     * Execute all view handlers.
     * @param renderdata Renderdata, that should be processed by the view handlers.
     * @param req The MeshRequest.
     * @param res The MeshResponse
     * @returns {Promise<RenderData>} A promise, that will be fulfilled, once all the view handlers have been executed
     *          and will be rejected if executing a view handler fails.
     */
    public workViewHandlers(renderdata : RenderData,
                                 req? : IMeshRequest,
                                 res? : IMeshResponse) : Q.Promise<RenderData> {
        var deferred = Q.defer<RenderData>();

        if (u.isDefined(this.handlers)) {
            u.asyncLoop(this.handlers, (handler : IMeshViewHandler)=>{
                return handler(renderdata, req, res);
            }).then(()=>{
                deferred.resolve(renderdata);
            }).catch((err) => {
                deferred.reject(err);
            });
        } else {
            deferred.resolve(renderdata);
        }
        return deferred.promise;
    }
}

/**
 * Error handler store. This store keeps the registered error handlers.
 * Go through the Mesh API to register an error handler.
 */
export class ErrorHandlerStore {

    /**
     * Register an error handler for an error status.
     * There can only be one handler per status.
     * @param status The status the handler should be registered for.
     * @param handler The handler that should be registered.
     */
    public registerErrorHandler(status : number, handler : IMeshErrorHandler) : void {
        this[status] = handler;
    }

    /**
     * Unregister an error handler for a status.
     * @param status The status the handler should be unregistered from.
     * @param handler The handler that should be unregistered.
     */
    public unregisterErrorHandler(status : number, handler? : IMeshErrorHandler) : void {
        this[status] = undefined;
    }

    /**
     * Execute the error handler for a status.
     * @param status The status for which the handler should be executed.
     * @param error An object describing the error.
     * @param req The MeshRequest.
     * @param res The MeshResponse
     * @returns {Promise<void>} A promise, that will be fulfilled once the error handler has been executed and will be
     *          rejected if executing the error handler fails.
     */
    public workErrorHandler(status : number,
                                 error : any,
                                 req : IMeshRequest,
                                 res : IMeshResponse) : Q.Promise<void> {
        var deferred = Q.defer<void>(),
            handler : IMeshErrorHandler = this[status];

        if (u.isDefined(handler)) {
           try {
               handler(error, status, req, res);
               deferred.resolve(undefined);
           } catch(e) {
               deferred.reject(undefined);
           }
        } else {
            deferred.reject(undefined);
        }
        return deferred.promise;
    }
}

