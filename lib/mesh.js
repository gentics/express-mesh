'use strict';
var rest = require('./meshRestClient');
var filters = require('./meshTemplateFilters');
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
/**
 * Possible mesh permissions.
 */
(function (MeshPermission) {
    MeshPermission[MeshPermission["CREATE"] = "create"] = "CREATE";
    MeshPermission[MeshPermission["READ"] = "read"] = "READ";
    MeshPermission[MeshPermission["UPDATE"] = "update"] = "UPDATE";
    MeshPermission[MeshPermission["DELETE"] = "delete"] = "DELETE";
})(exports.MeshPermission || (exports.MeshPermission = {}));
var MeshPermission = exports.MeshPermission;
/**
 * Main entry point for the frontend API. Use this class to power your express mesh server.
 *
 * Usage:
 *  import * as mesh from 'express-mesh';
 *  var Mesh = new mesh.Mesh(new mesh.MeshConfig('Demo', 'public', 'languages'));
 *  Mesh.server(app);
 */
var Mesh = (function () {
    /**
     * Constructor for the main frontend API entry point.
     * @param config Configuration for the mesh server.
     */
    function Mesh(config) {
        this.config = config;
        this.meshClient = new meshRestClient_1.MeshRestClient();
        this.renderer = new meshRenderer_1.MeshRenderer(this.config.viewDirectory);
    }
    /**
     * Register a custom schema handler.
     * A registered schema handler will be executed before a node with the schema it has been
     * registered for will be rendered. This can be used to fetch additional information and
     * perform operations on the data provided by Mesh.
     * @param schema Schema the handler should be registered for
     * @param handler The handler that should be registered
     */
    Mesh.prototype.registerSchemaHandler = function (schema, handler) {
        this.renderer.registerSchemaHandler(schema, handler);
    };
    /**
     * Register a custom view handler.
     * A view handler will be executed every time before a view is being rendered by the Mesh
     * frontend. This can be used to fetch additional information and perform operations on the
     * data provided by Mesh.
     * @param handler The handler that should be registered
     */
    Mesh.prototype.registerViewHandler = function (handler) {
        this.renderer.registerViewRenderHandler(handler);
    };
    /**
     * Register a custom error handler.
     * A error handler will be executed if an error with the status it has been registered for
     * occurs.
     * @param status The status the handler should be registered for
     * @param handler The handler that should be registered
     */
    Mesh.prototype.registerErrorHandler = function (status, handler) {
        this.renderer.registerErrorHandler(status, handler);
    };
    /**
     * Render a Mesh node.
     * This function will render the provided node with the view that is named after the node's schema.
     * If the view with this name is not available, the default view will be rendered.
     * All registered handlers that apply for this function will be executed.
     * @param node Mesh node that should be rendered.
     * @param req The mesh request / Express request.
     * @param res The mesh response / Express response.
     */
    Mesh.prototype.renderMeshNode = function (node, req, res) {
        this.renderer.renderMeshNode(node, req, res);
    };
    /**
     * Render a view.
     * This function will render the provided view.
     * If the view with this name is not available, the default view will be rendered.
     * All registered handlers that apply for this function will be executed.
     * @param view name of the view that should be rendered.
     * @param renderdata Data that should be passed to the view.
     * @param req The mesh request / Express request.
     * @param res The mesh response / Express response.
     */
    Mesh.prototype.renderView = function (view, renderdata, req, res) {
        this.renderer.renderView(view, renderdata, req, res);
    };
    /**
     * Login to Gentics Mesh with the provided user. All subsequent requests with the same session
     * will use the provided credentials for requests to Mesh.
     * @param req The mesh request / Express request.
     * @param username Login
     * @param password Password
     * @returns {Promise<U>} A promise that will be fulfilled as soon es the login completes and will
     *          be rejected if the login fails.
     */
    Mesh.prototype.login = function (req, username, password) {
        return this.meshClient.login(req, username, password).then(function (loggedin) {
            if (loggedin === true) {
                req.session[rest.MeshAuth.MESH_USER_SESSION_KEY] = username;
                req.session[rest.MeshAuth.MESH_PASSWORD_SESSION_KEY] = password;
            }
            return loggedin;
        });
    };
    /**
     * Logout from Gentics Mesh. All subsequent requests with the same session will use the default
     * user that has been configured in the MeshConfig for requests to Mesh.
     * @param req The mesh request / Express request.
     * @returns {Promise<U>} A promise that will be fulfilled as soon as the logout completes and will
     *          be rejected if the logout fails.
     */
    Mesh.prototype.logout = function (req) {
        return this.meshClient.logout(req).then(function (loggedout) {
            req.session[rest.MeshAuth.MESH_USER_SESSION_KEY] = undefined;
            req.session[rest.MeshAuth.MESH_PASSWORD_SESSION_KEY] = undefined;
            return loggedout;
        });
    };
    /**
     * Perform a search for Mesh Nodes.
     * @param req The mesh request / Express request.
     * @param query The elastic search query object.
     * @param params NodeListParams to implement pagination.
     * @returns {Promise<U>} A promise that will be fulfilled once the search request complets and will be rejected
     *          if the search fails.
     */
    Mesh.prototype.searchMeshNodes = function (req, query, params) {
        return this.meshClient.meshSearch(req, query, params).then(function (response) {
            return response.data;
        });
    };
    /**
     * Load all child nodes of a specified node.
     * @param req The mesh request / Express request.
     * @param uuid The specified node, which children should be loaded.
     * @param lang The language the nodes should be loaded in.
     * @param opts NodeListParams to implement pagination.
     * @returns {Promise<U>} A promise that will be fulfilled once the children have been loaded and will be rejected
     *          if loading the children fails.
     */
    Mesh.prototype.getChildren = function (req, uuid, lang, opts) {
        return this.meshClient.getChildren(req, uuid, lang, opts).then(function (response) {
            return response.data;
        });
    };
    /**
     * Load a Mesh node with the specified uuid.
     * @param req The mesh request / Express request.
     * @param uuid The uuid of the node that should be loaded.
     * @param params QueryParams to specify the language and other options.
     * @returns {Promise<U>} A promise that will be fulfilled once the Mesh node is loaded and will be rejected
     *          if loading of the Mesh node fails.
     */
    Mesh.prototype.getMeshNode = function (req, uuid, params) {
        return this.meshClient.getMeshNode(req, uuid, params).then(function (response) {
            return response.data;
        });
    };
    /**
     * Load a navigation object by its path. e.g. / for the root navigation.
     * You can only load navigation objects for container nodes.
     * @param req The mesh request / Express request.
     * @param path The path for which the navigation object should be loaded.
     * @param maxDepth Maximal depth of the loaded navigation tree.
     * @returns {Q.Promise<MeshRestResponse<IMeshNav>>} A promise that will be fulfilled once the navigation object
     *          has been loaded and will be rejected if loading of the navigation object fails.
     */
    Mesh.prototype.getNavigationByPath = function (req, path, maxDepth) {
        return this.meshClient.getNavigationByPath(req, path, maxDepth);
    };
    /**
     * Load a navigation object by its uuid.
     * You can only load navigation objects for container nodes.
     * @param req The mesh request / Express request.
     * @param uuid The uuid of the root node of the navigation tree you want to load.
     * @param maxDepth Maximal depth of the loaded navigation tree.
     * @returns {Q.Promise<MeshRestResponse<IMeshNav>>} A promise that will be fulfilled once the navigation object
     *          has been loaded and will be rejected if loading of the navigation object fails.
     */
    Mesh.prototype.getNavigationByUUID = function (req, uuid, maxDepth) {
        return this.meshClient.getNavigationByUUID(req, uuid, maxDepth);
    };
    /**
     * Load the tag families of the current project.
     * @param req The mesh request / Express request.
     * @param params Query params to specify pagination.
     * @returns {Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshTagFamily>>>} A promise that will be fulfilled once
     *          the tag families have been loaded and will be rejected if loading of the tag families fails.
     */
    Mesh.prototype.getTagFamilies = function (req, params) {
        return this.meshClient.getTagFamilies(req, params);
    };
    /**
     * Load the tags that are contained in a tag family.
     * @param req The mesh request / Express request.
     * @param uuid The uuid of the tag family.
     * @param params Query params to specify pagination.
     * @returns {Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshTag>>>} A promise that will be fulfilled once
     *          the tags have been loaded and will fail if loading of the tags fail.
     */
    Mesh.prototype.getTagsOfTagFamily = function (req, uuid, params) {
        return this.meshClient.getTagsOfTagFamily(req, uuid, params);
    };
    /**
     * Private method that constructs the quest handler, that will serve the Mesh content from webroot.
     * @returns {function(IMeshRequest, express.Response): undefined}
     */
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
    /**
     * Private method that will register the mesh middleware in the Express app.
     * This middleware will enrich the mesh request with the configuration and the
     * active language.
     * @param app The Express app.
     */
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
    /**
     * Register default template filters.
     * Out of the box we support registering filters with swig and handlebars. If you have a different template engine
     * please pass a register function to register the filters with your template engine. This function will then be called
     * for each of the mesh filters.
     * @param engine Your template engine.
     * @param registerfunction [optional] register function that will be called for each of the mesh filters.
     **/
    Mesh.prototype.registerTemplateFilters = function (engine, registerfunction) {
        filters.registerFilters(engine, registerfunction);
    };
    /**
     * Set the express app. This function needs to be called if you did not call the server() function. In order to
     * be able to render templates.
     * @param app The Express app.
     */
    Mesh.prototype.setApp = function (app) {
        this.registerMeshMiddleware(app);
        this.renderer.setApp(app);
    };
    /**
     * Initialize the Mesh server. Call this method after you added your own request handlers to the Express app,
     * as this method will attach a * handler to catch all requests that have not been handled by another handler.
     * @param app The Express app.
     */
    Mesh.prototype.server = function (app) {
        this.setApp(app);
        app.get('*', this.getRequestHandler());
    };
    return Mesh;
})();
exports.Mesh = Mesh;
