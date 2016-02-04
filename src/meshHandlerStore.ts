'use strict';

import Q = require('q');
import path = require('path');
import u = require('./meshUtil');

import {RenderData} from "./meshRenderer";
import {IMeshResponse} from "./index";
import {IMeshRequest} from "./index";
import {IMeshNode} from "./index";

export interface IMeshSchemaHandler<T> {
    (item : IMeshNode<T>, req : IMeshRequest, res : IMeshResponse) : Q.Promise<IMeshNode<T>>;
}

export interface IMeshViewHandler {
    (renderdata : RenderData, req : IMeshRequest, res : IMeshResponse) : Q.Promise<RenderData>;
}

export interface IMeshErrorHandler {
    (error : any, status : number, req : IMeshRequest, res : IMeshResponse) : void;
}

export class SchemaHandlerStore {

    public registerSchemaHandler<T>(schema : string, handler : IMeshSchemaHandler<T>) : void {
        var list = this[schema];
        if (!u.isDefined(list)) {
            list = [];
            this[schema] = list;
        }
        list.push(handler);
    }

    public unregisterSchemaHandler<T>(schema : string, handler : IMeshSchemaHandler<T>) : void {
        var list = this[schema];
        if (u.isDefined(list)) {
            if (list.indexOf(handler) >= 0) {
                list.splice(list.indexOf(handler), 1);
            }
        }
    }

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

export class ViewHandlerStore {

    private handlers : Array<IMeshViewHandler> = [];

    public registerViewHandler(handler : IMeshViewHandler) : void {
        if (!u.isDefined(this.handlers)) {
            this.handlers = [];
        }
        this.handlers.push(handler);
    }

    public unregisterSchemaHandler(handler : IMeshViewHandler) : void {
        if (u.isDefined(this.handlers)) {
            if (this.handlers.indexOf(handler) >= 0) {
                this.handlers.splice(this.handlers.indexOf(handler), 1);
            }
        }
    }

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

export class ErrorHandlerStore {

    public registerErrorHandler(status : number, handler : IMeshErrorHandler) : void {
        this[status] = handler;
    }

    public unregisterErrorHandler(status : number, handler? : IMeshErrorHandler) : void {
        this[status] = undefined;
    }

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

