'use strict';
var Q = require('q');
var u = require('./meshUtil');
var SchemaHandlerStore = (function () {
    function SchemaHandlerStore() {
    }
    SchemaHandlerStore.prototype.registerSchemaHandler = function (schema, handler) {
        var list = this[schema];
        if (!u.isDefined(list)) {
            list = [];
            this[schema] = list;
        }
        list.push(handler);
    };
    SchemaHandlerStore.prototype.unregisterSchemaHandler = function (schema, handler) {
        var list = this[schema];
        if (u.isDefined(list)) {
            if (list.indexOf(handler) >= 0) {
                list.splice(list.indexOf(handler), 1);
            }
        }
    };
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
var ViewHandlerStore = (function () {
    function ViewHandlerStore() {
        this.handlers = [];
    }
    ViewHandlerStore.prototype.registerViewHandler = function (handler) {
        if (!u.isDefined(this.handlers)) {
            this.handlers = [];
        }
        this.handlers.push(handler);
    };
    ViewHandlerStore.prototype.unregisterSchemaHandler = function (handler) {
        if (u.isDefined(this.handlers)) {
            if (this.handlers.indexOf(handler) >= 0) {
                this.handlers.splice(this.handlers.indexOf(handler), 1);
            }
        }
    };
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
var ErrorHandlerStore = (function () {
    function ErrorHandlerStore() {
    }
    ErrorHandlerStore.prototype.registerErrorHandler = function (status, handler) {
        this[status] = handler;
    };
    ErrorHandlerStore.prototype.unregisterErrorHandler = function (status, handler) {
        this[status] = undefined;
    };
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
