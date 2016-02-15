'use strict';
var Q = require('q');
var meshClient = require('./meshRestClient');
var path = require('path');
var u = require('./meshUtil');
var handler = require('./meshHandlerStore');
var lang = require('./meshLanguages');
/**
 * Render information that will be passed to the rendered template in the RenderData.
 */
var RenderInformation = (function () {
    /**
     * Constructor that initializes the render information.
     * @param req The MeshRequest.
     * @param node The MeshNode that should be rendered.
     */
    function RenderInformation(req, node) {
        var _this = this;
        this.languageURLs = {};
        this.activeLanguage = lang.getActiveLanguage(req);
        if (u.isDefined(node)) {
            this.availableLanguages = node.availableLanguages;
            this.availableLanguages.forEach(function (lang) {
                _this.languageURLs[lang] = node.languagePaths[lang];
            });
        }
        else {
            this.availableLanguages = req.meshConfig.languages;
            this.availableLanguages.forEach(function (lang) {
                _this.languageURLs[lang] = '?lang=' + lang;
            });
        }
        this.username = req.session[meshClient.MeshAuth.MESH_USER_SESSION_KEY] ?
            req.session[meshClient.MeshAuth.MESH_USER_SESSION_KEY] : req.meshConfig.publicUser.username;
        this.loggedin = this.username !== req.meshConfig.publicUser.username;
    }
    return RenderInformation;
})();
exports.RenderInformation = RenderInformation;
/**
 * Render data that is passed to the rendered template and contains the data that should be rendered.
 */
var RenderData = (function () {
    function RenderData() {
        this.meta = {};
    }
    return RenderData;
})();
exports.RenderData = RenderData;
/**
 * The MeshRenderer is responsible for rendering templates.
 */
var MeshRenderer = (function () {
    /**
     * Initialize the renderer.
     * @param app Express app.
     * @param viewDir Directory that contains the templates.
     */
    function MeshRenderer(app, viewDir) {
        this.app = app;
        this.viewDir = viewDir;
        this.schemaHandlerStore = new handler.SchemaHandlerStore();
        this.errorHandlerStore = new handler.ErrorHandlerStore();
        this.viewHandlerStore = new handler.ViewHandlerStore();
    }
    MeshRenderer.prototype.registerSchemaHandler = function (schema, handler) {
        this.schemaHandlerStore.registerSchemaHandler(schema, handler);
    };
    MeshRenderer.prototype.registerErrorHandler = function (status, handler) {
        this.errorHandlerStore.registerErrorHandler(status, handler);
    };
    MeshRenderer.prototype.registerViewRenderHandler = function (handler) {
        this.viewHandlerStore.registerViewHandler(handler);
    };
    MeshRenderer.prototype.renderMeshNode = function (node, req, res) {
        var _this = this;
        var schema = u.isDefined(node) && u.isDefined(node.schema) ? node.schema : {}, key = u.isDefined(schema.name) ? schema.name : schema.uuid;
        if (u.isDefined(key)) {
            this.handleMicroNodeFields(node).then(function (node) {
                return _this.schemaHandlerStore.workSchemaHandlers(key, node, req, res);
            })
                .then(function (node) {
                var renderData = _this.getRenderData(node, req);
                _this.viewExists(key).then(function () {
                    _this.renderView(key, renderData, req, res);
                }).catch(function () {
                    console.warn('Template for schema {' + key + '} not found, using default: ' + req.meshConfig.defaultView);
                    _this.renderView(req.meshConfig.defaultView, renderData, req, res);
                });
            }).catch(function (err) {
                console.error('Error in schema handlers');
                _this.renderError(u.STATUS_ERROR, req, res, err);
            });
        }
        else {
            this.renderError(u.STATUS_ERROR, req, res, { message: 'No schema found' });
        }
    };
    MeshRenderer.prototype.renderError = function (status, req, res, err) {
        var _this = this;
        this.errorHandlerStore.workErrorHandler(status, err, req, res).catch(function () {
            var viewname = '' + status, renderdata = new RenderData();
            res.status(status);
            console.error(status, err, err.stack);
            renderdata.meta.error = err;
            _this.viewExists(viewname).then(function () {
                _this.renderView(viewname, renderdata, req, res);
            }).catch(function () {
                _this.renderView(req.meshConfig.defaultErrorView, renderdata, req, res);
            });
        });
    };
    MeshRenderer.prototype.viewExists = function (name) {
        var filename = name + MeshRenderer.TEMPLATE_EXTENSION;
        return u.fileExists(path.join(this.viewDir, filename));
    };
    MeshRenderer.prototype.renderView = function (name, data, req, res) {
        this.viewHandlerStore.workViewHandlers(data, req, res).then(function (renderdata) {
            if (req.meshConfig.logging.renderdata) {
                console.log(JSON.stringify(renderdata, null, 4));
            }
            res.render(name, renderdata);
        }).catch(function (err) {
            console.error('ERROR IN VIEWHANDLER', err, err.stack);
            if (req.meshConfig.logging.renderdata) {
                console.log(JSON.stringify(data, null, 4));
            }
            data.meta.error = true;
            res.render(name, data);
        });
    };
    MeshRenderer.prototype.handleMicroNodeFields = function (node) {
        var _this = this;
        var deferred = Q.defer(), promises = [];
        if (u.isDefined(node) && u.isDefined(node.fields)) {
            Object.keys(node.fields).forEach(function (key) {
                var field = node.fields[key];
                promises.push(_this.resolveField(field).then(function (resolved) {
                    node.fields[key] = resolved;
                }));
            });
            Q.all(promises).then(function () {
                deferred.resolve(node);
            });
        }
        else {
            deferred.resolve(node);
        }
        return deferred.promise;
    };
    MeshRenderer.prototype.resolveField = function (field) {
        var _this = this;
        var listpromises = [];
        if (u.isDefined(field) && Array.isArray(field)) {
            field.forEach(function (listitem) {
                // check if there is a schema, if not we just add the node itself
                if (u.isDefined(listitem.schema) || u.isDefined(listitem.microschema)) {
                    listpromises.push(_this.meshNodeToString(listitem));
                }
                else {
                    listpromises.push(Q.fcall(function () {
                        return listitem;
                    }));
                }
            });
            return Q.all(listpromises);
        }
        else if (u.isDefined(field) && (u.isDefined(field.schema) || u.isDefined(field.microschema))) {
            return this.meshNodeToString(field);
        }
        else {
            return Q.fcall(function () {
                return field;
            });
        }
    };
    MeshRenderer.prototype.meshNodeToString = function (node) {
        var _this = this;
        var deferred = Q.defer(), key = u.isDefined(node) ? this.getSchemaKey(node) : undefined;
        if (u.isDefined(key)) {
            this.schemaHandlerStore.workSchemaHandlers(key, node).then(function (node) {
                _this.viewExists(key).then(function () {
                    _this.renderTemplate(key, node).then(function (html) {
                        deferred.resolve(html);
                    }).catch(function (err) {
                        console.error('Error while rendering template for {' + key + '}. Using blank.', err);
                        deferred.resolve('');
                    });
                }).catch(function () {
                    console.warn('Template for schema {' + key + '} not found. Using blank.');
                    deferred.resolve('');
                });
            }).catch(function (err) {
                console.error('Error in schema handlers', err);
                deferred.reject('');
            });
        }
        else {
            console.error('Schema for node not found', JSON.stringify(node, null, 4));
            deferred.reject('');
        }
        return deferred.promise;
    };
    MeshRenderer.prototype.getSchemaKey = function (node) {
        var schemaObj = u.isDefined(node.schema) ? node.schema : node.microschema, key = u.isDefined(schemaObj) ? (u.isDefined(schemaObj.name) ? schemaObj.name : schemaObj.uuid) : undefined;
        return key;
    };
    MeshRenderer.prototype.renderTemplate = function (name, data) {
        var deferred = Q.defer();
        if (!u.isDefined(this.app)) {
            deferred.reject("App not defined. Call setApp with the Express app.");
        }
        else {
            this.app.render(name, data, function (err, html) {
                if (u.isDefined(err)) {
                    deferred.reject(err);
                }
                else {
                    deferred.resolve(html);
                }
            });
        }
        return deferred.promise;
    };
    MeshRenderer.prototype.getRenderData = function (node, req) {
        var data = new RenderData();
        lang.setActiveLanguage(req, node.language);
        data.node = node;
        data.renderInformation = new RenderInformation(req, node);
        return data;
    };
    MeshRenderer.TEMPLATE_EXTENSION = '.html';
    return MeshRenderer;
})();
exports.MeshRenderer = MeshRenderer;
