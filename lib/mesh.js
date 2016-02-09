'use strict';
var rest = require('./meshRestClient');
var lang = require('./meshLanguages');
var u = require('./meshUtil');
var meshRenderer_1 = require("./meshRenderer");
var meshRestClient_1 = require("./meshRestClient");
/**
 * Implementation of IMeshNodeListQueryParams.
 * Possible request options for Mesh list requests.
 */
var MeshQueryParams = (function () {
    function MeshQueryParams() {
    }
    return MeshQueryParams;
})();
exports.MeshQueryParams = MeshQueryParams;
(function (MeshPermission) {
    MeshPermission[MeshPermission["CREATE"] = "create"] = "CREATE";
    MeshPermission[MeshPermission["READ"] = "read"] = "READ";
    MeshPermission[MeshPermission["UPDATE"] = "update"] = "UPDATE";
    MeshPermission[MeshPermission["DELETE"] = "delete"] = "DELETE";
})(exports.MeshPermission || (exports.MeshPermission = {}));
var MeshPermission = exports.MeshPermission;
var Mesh = (function () {
    function Mesh(config) {
        this.config = config;
        this.meshClient = new meshRestClient_1.MeshRestClient();
        this.renderer = new meshRenderer_1.MeshRenderer(this.config.viewDirectory);
    }
    Mesh.prototype.registerSchemaHandler = function (schema, handler) {
        this.renderer.registerSchemaHandler(schema, handler);
    };
    Mesh.prototype.registerViewHandler = function (handler) {
        this.renderer.registerViewRenderHandler(handler);
    };
    Mesh.prototype.registerErrorHandler = function (status, handler) {
        this.renderer.registerErrorHandler(status, handler);
    };
    Mesh.prototype.renderMeshNode = function (node, req, res) {
        this.renderer.renderMeshNode(node, req, res);
    };
    Mesh.prototype.renderView = function (view, renderdata, req, res) {
        this.renderer.renderView(view, renderdata, req, res);
    };
    Mesh.prototype.login = function (req, username, password) {
        return this.meshClient.login(req, username, password).then(function (loggedin) {
            if (loggedin === true) {
                req.session[rest.MeshAuth.MESH_USER_SESSION_KEY] = username;
                req.session[rest.MeshAuth.MESH_PASSWORD_SESSION_KEY] = password;
            }
            return loggedin;
        });
    };
    Mesh.prototype.logout = function (req) {
        return this.meshClient.logout(req).then(function (loggedout) {
            req.session[rest.MeshAuth.MESH_USER_SESSION_KEY] = undefined;
            req.session[rest.MeshAuth.MESH_PASSWORD_SESSION_KEY] = undefined;
            return loggedout;
        });
    };
    Mesh.prototype.searchMeshNodes = function (req, query, params) {
        return this.meshClient.meshSearch(req, query, params).then(function (response) {
            return response.data;
        });
    };
    Mesh.prototype.getChildren = function (req, uuid, lang, opts) {
        return this.meshClient.getChildren(req, uuid, lang, opts).then(function (response) {
            return response.data;
        });
    };
    Mesh.prototype.getMeshNode = function (req, uuid, params) {
        return this.meshClient.getMeshNode(req, uuid, params).then(function (response) {
            return response.data;
        });
    };
    Mesh.prototype.getNavigationByPath = function (req, path, maxDepth) {
        return this.meshClient.getNavigationByPath(req, path, maxDepth);
    };
    Mesh.prototype.getNavigationByUUID = function (req, uuid, maxDepth) {
        return this.meshClient.getNavigationByUUID(req, uuid, maxDepth);
    };
    Mesh.prototype.getTagFamilies = function (req, params) {
        return this.meshClient.getTagFamilies(req, params);
    };
    Mesh.prototype.getTagsOfTagFamily = function (req, uuid, params) {
        return this.meshClient.getTagsOfTagFamily(req, uuid, params);
    };
    Mesh.prototype.getRequestHandler = function () {
        var _this = this;
        return function (req, res) {
            _this.meshClient.getWebrootNode(req).then(function (response) {
                var status = Number(response.status);
                if (status < 400) {
                    res.status(response.status);
                    if (response.isBinary) {
                        response.stream.pipe(res);
                    }
                    else {
                        _this.renderer.renderMeshNode(response.data, req, res);
                    }
                }
                else {
                    _this.renderer.renderError(status, req, res, response.data);
                }
            }).catch(function (err) {
                _this.renderer.renderError(500, req, res, err);
            });
        };
    };
    Mesh.prototype.registerMeshMiddleware = function (app) {
        var _this = this;
        app.use('*', function (req, res, next) {
            if (!u.isDefined(req.meshConfig)) {
                req.meshConfig = _this.config;
            }
            if (u.isDefined(req.query.lang)) {
                lang.setActiveLanguage(req, req.query.lang);
            }
            lang.readLanguageFiles(_this.config);
            next();
        });
    };
    Mesh.prototype.server = function (app) {
        this.registerMeshMiddleware(app);
        app.get('*', this.getRequestHandler());
    };
    return Mesh;
})();
exports.Mesh = Mesh;
