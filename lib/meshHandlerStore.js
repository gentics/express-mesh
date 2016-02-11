'use strict';
var Q = require('q');
var u = require('./meshUtil');
/**
 * Schema handler store. This store keeps the registered schema handlers.
 * Go through the Mesh API to register a schema handler.
 */
var SchemaHandlerStore = (function () {
    function SchemaHandlerStore() {
    }
    /**
     * Register a schema handler.
     * @param schema The schema, the handler should be registered for.
     * @param handler The handler, that should be registered.
     */
    SchemaHandlerStore.prototype.registerSchemaHandler = function (schema, handler) {
        var list = this[schema];
        if (!u.isDefined(list)) {
            list = [];
            this[schema] = list;
        }
        list.push(handler);
    };
    /**
     * Unregister a schema handler.
     * @param schema The schema, the handler should unregistered from.
     * @param handler The handler, that should be unregistered.
     */
    SchemaHandlerStore.prototype.unregisterSchemaHandler = function (schema, handler) {
        var list = this[schema];
        if (u.isDefined(list)) {
            if (list.indexOf(handler) >= 0) {
                list.splice(list.indexOf(handler), 1);
            }
        }
    };
    /**
     * Executes the schema handlers for a passed MeshNode.
     * @param schema The schema, for which the handlers should be executed.
     * @param item The MeshNode, that should be processed in the handlers.
     * @param req The MeshRequest.
     * @param res The MeshResponse
     * @returns {Promise<IMeshNode<T>>} A promise, that will be fulfilled, once all the handlers have been processed
     *          and will be rejected if executing a handler fails.
     */
    SchemaHandlerStore.prototype.workSchemaHandlers = function (schema, item, req, res) {
        var deferred = Q.defer(), list = this[schema];
        if (u.isDefined(list)) {
            u.asyncLoop(list, function (handler) {
                return handler(item, req, res);
            }).then(function () {
                deferred.resolve(item);
            }).catch(function (err) {
                deferred.reject(err);
            });
        }
        else {
            deferred.resolve(item);
        }
        return deferred.promise;
    };
    return SchemaHandlerStore;
})();
exports.SchemaHandlerStore = SchemaHandlerStore;
/**
 * View handler store. This store keeps the registered view handlers.
 * Go through the Mesh API to register a view handler.
 */
var ViewHandlerStore = (function () {
    function ViewHandlerStore() {
        this.handlers = [];
    }
    /**
     * Register a view handler.
     * @param handler The handler that should be registered.
     */
    ViewHandlerStore.prototype.registerViewHandler = function (handler) {
        if (!u.isDefined(this.handlers)) {
            this.handlers = [];
        }
        this.handlers.push(handler);
    };
    /**
     * Unregister a view handler.
     * @param handler The handler that should be unregistered.
     */
    ViewHandlerStore.prototype.unregisterSchemaHandler = function (handler) {
        if (u.isDefined(this.handlers)) {
            if (this.handlers.indexOf(handler) >= 0) {
                this.handlers.splice(this.handlers.indexOf(handler), 1);
            }
        }
    };
    /**
     * Execute all view handlers.
     * @param renderdata Renderdata, that should be processed by the view handlers.
     * @param req The MeshRequest.
     * @param res The MeshResponse
     * @returns {Promise<RenderData>} A promise, that will be fulfilled, once all the view handlers have been executed
     *          and will be rejected if executing a view handler fails.
     */
    ViewHandlerStore.prototype.workViewHandlers = function (renderdata, req, res) {
        var deferred = Q.defer();
        if (u.isDefined(this.handlers)) {
            u.asyncLoop(this.handlers, function (handler) {
                return handler(renderdata, req, res);
            }).then(function () {
                deferred.resolve(renderdata);
            }).catch(function (err) {
                deferred.reject(err);
            });
        }
        else {
            deferred.resolve(renderdata);
        }
        return deferred.promise;
    };
    return ViewHandlerStore;
})();
exports.ViewHandlerStore = ViewHandlerStore;
/**
 * Error handler store. This store keeps the registered error handlers.
 * Go through the Mesh API to register an error handler.
 */
var ErrorHandlerStore = (function () {
    function ErrorHandlerStore() {
    }
    /**
     * Register an error handler for an error status.
     * There can only be one handler per status.
     * @param status The status the handler should be registered for.
     * @param handler The handler that should be registered.
     */
    ErrorHandlerStore.prototype.registerErrorHandler = function (status, handler) {
        this[status] = handler;
    };
    /**
     * Unregister an error handler for a status.
     * @param status The status the handler should be unregistered from.
     * @param handler The handler that should be unregistered.
     */
    ErrorHandlerStore.prototype.unregisterErrorHandler = function (status, handler) {
        this[status] = undefined;
    };
    /**
     * Execute the error handler for a status.
     * @param status The status for which the handler should be executed.
     * @param error An object describing the error.
     * @param req The MeshRequest.
     * @param res The MeshResponse
     * @returns {Promise<void>} A promise, that will be fulfilled once the error handler has been executed and will be
     *          rejected if executing the error handler fails.
     */
    ErrorHandlerStore.prototype.workErrorHandler = function (status, error, req, res) {
        var deferred = Q.defer(), handler = this[status];
        if (u.isDefined(handler)) {
            try {
                handler(error, status, req, res);
                deferred.resolve(undefined);
            }
            catch (e) {
                deferred.reject(undefined);
            }
        }
        else {
            deferred.reject(undefined);
        }
        return deferred.promise;
    };
    return ErrorHandlerStore;
})();
exports.ErrorHandlerStore = ErrorHandlerStore;
