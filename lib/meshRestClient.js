'use strict';
var http = require('http');
var Q = require('q');
var URL = require('url');
var u = require('./meshUtil');
var lang = require('./meshLanguages');
var mesh_1 = require("./mesh");
/**
 * Mesh Rest response object
 */
var MeshRestResponse = (function () {
    function MeshRestResponse(status, data, isBinary) {
        this.status = status;
        this.data = data;
        this.isBinary = isBinary;
    }
    return MeshRestResponse;
})();
exports.MeshRestResponse = MeshRestResponse;
/**
 * Possible authentication methods.
 */
(function (MeshAuthType) {
    MeshAuthType[MeshAuthType["BASIC"] = 0] = "BASIC";
})(exports.MeshAuthType || (exports.MeshAuthType = {}));
var MeshAuthType = exports.MeshAuthType;
/**
 * Mesh authentication obejct.
 */
var MeshAuth = (function () {
    /**
     * Initialize the Mesh authentication object.
     * It generates the needed authentication header for making Mesh requests.
     * @param request The MeshRequest
     */
    function MeshAuth(request) {
        this.type = MeshAuthType.BASIC;
        if (u.isDefined(request.session[MeshAuth.MESH_USER_SESSION_KEY]) && u.isDefined(request.session[MeshAuth.MESH_PASSWORD_SESSION_KEY])) {
            this.header = this.getBasicAuthHeader(request.session[MeshAuth.MESH_USER_SESSION_KEY], request.session[MeshAuth.MESH_PASSWORD_SESSION_KEY]);
        }
        else {
            this.header = this.getBasicAuthHeader(request.meshConfig.publicUser.username, request.meshConfig.publicUser.password);
        }
    }
    /**
     * Generate basic auth header from username and password.
     * @param username Username
     * @param password Password
     * @returns {string} Header string.
     */
    MeshAuth.prototype.getBasicAuthHeader = function (username, password) {
        return 'Basic ' + new Buffer(username + ':' + password).toString('base64');
    };
    MeshAuth.MESH_USER_SESSION_KEY = 'meshusername';
    MeshAuth.MESH_PASSWORD_SESSION_KEY = 'meshpassword';
    return MeshAuth;
})();
exports.MeshAuth = MeshAuth;
/**
 * Options for making Mesh Requests.
 */
var MeshRequestOptions = (function () {
    /**
     * Initialize request options and prefill it with the authentication object.
     * @param request MeshRequest
     */
    function MeshRequestOptions(request) {
        this.auth = new MeshAuth(request);
        this.logging = request.meshConfig.logging;
    }
    return MeshRequestOptions;
})();
exports.MeshRequestOptions = MeshRequestOptions;
/**
 * MeshRestClient that can be used to make requests to the mesh backend.
 */
var MeshRestClient = (function () {
    function MeshRestClient() {
        this.publicMeshCookieUserStore = {};
    }
    /**
     *
     * @param req
     * @param path
     * @param maxDepth
     * @returns {Q.Promise<MeshRestResponse<IMeshNav>>}
     */
    MeshRestClient.prototype.getNavigationByPath = function (req, path, maxDepth) {
        var url = req.meshConfig.backendUrl + req.meshConfig.base + req.meshConfig.project + req.meshConfig.navroot + path, params = new mesh_1.MeshQueryParams();
        params.maxDepth = maxDepth ? maxDepth : 10;
        return this.meshSimpleGET(req, url, params).then(function (response) {
            return response;
        });
    };
    MeshRestClient.prototype.getNavigationByUUID = function (req, uuid, maxDepth) {
        var url = req.meshConfig.backendUrl + req.meshConfig.base + req.meshConfig.project + MeshRestClient.NODES_ENDPOINT + uuid + MeshRestClient.NAVIGATION_ENDPOINT, params = new mesh_1.MeshQueryParams();
        params.maxDepth = maxDepth ? maxDepth : 10;
        return this.meshSimpleGET(req, url, params).then(function (response) {
            return response;
        });
    };
    MeshRestClient.prototype.getWebrootNode = function (req, params) {
        var url = req.originalUrl;
        if (typeof url === 'undefined' || u.getPath(url) === '/') {
            url = req.meshConfig.index;
        }
        url = req.meshConfig.backendUrl + req.meshConfig.base + req.meshConfig.project + req.meshConfig.webroot + url;
        return this.meshSimpleGET(req, url, params).then(function (response) {
            if (req.meshConfig.checkPublished && !response.isBinary && !response.data.published) {
                response.status = 404;
            }
            return response;
        });
    };
    MeshRestClient.prototype.getMeshNode = function (req, uuid, params) {
        var url = req.meshConfig.backendUrl + req.meshConfig.base + req.meshConfig.project + MeshRestClient.NODES_ENDPOINT + uuid;
        return this.meshSimpleGET(req, url, params).then(function (response) {
            if (req.meshConfig.checkPublished && !response.isBinary && !response.data.published) {
                response.status = 404;
            }
            return response;
        });
    };
    MeshRestClient.prototype.getChildren = function (req, uuid, lang, params) {
        var sort = (params && params.orderBy ? params.orderBy : "created"), query = { "filter": { "bool": { "must": [{ "term": { "parentNode.uuid": uuid } }, { "term": { "language": lang } }], "_cache": true } }, "sort": {} };
        query.sort[sort] = { "order": "asc" };
        return this.meshSearch(req, query, params);
    };
    MeshRestClient.prototype.meshSearch = function (req, query, params) {
        var opts = new MeshRequestOptions(req), languages = lang.getLanguageArray(req);
        opts.url = opts.url = req.meshConfig.backendUrl + req.meshConfig.base + 'search/nodes';
        opts.params = params;
        opts.params.resolveLinks = 'short';
        if (u.isDefined(languages)) {
            opts.params.lang = languages.join(',');
        }
        return this.meshPOST(opts, query);
    };
    MeshRestClient.prototype.getTagFamilies = function (req, params) {
        var url = req.meshConfig.backendUrl + req.meshConfig.base + req.meshConfig.project + MeshRestClient.TAG_FAMILIES_ENDPOINT;
        return this.meshSimpleGET(req, url, params);
    };
    MeshRestClient.prototype.getTagsOfTagFamily = function (req, uuid, params) {
        var url = req.meshConfig.backendUrl + req.meshConfig.base + req.meshConfig.project + MeshRestClient.TAG_FAMILIES_ENDPOINT + '/' + uuid + '/tags';
        return this.meshSimpleGET(req, url, params);
    };
    MeshRestClient.prototype.login = function (req, username, password) {
        var opts = new MeshRequestOptions(req);
        opts.url = opts.url = req.meshConfig.backendUrl + req.meshConfig.base + 'auth/login';
        return this.meshPOST(opts, {
            "username": username,
            "password": password
        }).then(function (response) {
            if (response.status === 200) {
                return true;
            }
            else {
                return false;
            }
        }).catch(function (err) {
            return false;
        });
    };
    MeshRestClient.prototype.logout = function (req) {
        var opts = new MeshRequestOptions(req);
        opts.url = opts.url = req.meshConfig.backendUrl + req.meshConfig.base + 'auth/logout';
        return this.makeMeshRequest(opts).then(function (response) {
            return true;
        }).catch(function (err) {
            return false;
        });
    };
    MeshRestClient.prototype.meshSimpleGET = function (req, url, params) {
        return this.meshSimpleRequest('GET', req, url, params);
    };
    MeshRestClient.prototype.meshSimpleRequest = function (method, req, url, params, data) {
        var opts = new MeshRequestOptions(req), languages = lang.getLanguageArray(req);
        opts.url = url;
        opts.params = params ? params : new mesh_1.MeshQueryParams();
        opts.params.resolveLinks = 'short';
        opts.method = method;
        opts.data = data;
        if (u.isDefined(languages)) {
            opts.params.lang = languages.join(',');
        }
        return this.makeMeshRequest(opts);
    };
    MeshRestClient.prototype.meshPOST = function (requestOptions, data) {
        requestOptions.method = 'POST';
        requestOptions.data = data;
        return this.makeMeshRequest(requestOptions);
    };
    /**
     * Convert a queryParams object into a URL-encoded string.
     */
    MeshRestClient.prototype.queryStringFromParams = function (queryParams) {
        var queryString = '?';
        for (var prop in queryParams) {
            if (queryParams.hasOwnProperty(prop)) {
                queryString += prop + '=' + encodeURIComponent(queryParams[prop]) + '&';
            }
        }
        // return substring to remove trailing '&'
        return queryString.substr(0, queryString.length - 1);
    };
    MeshRestClient.prototype.makeMeshRequest = function (requestOptions) {
        var _this = this;
        var deferred = Q.defer(), options = {}, urlString = requestOptions.url, url, data;
        if (u.isDefined(requestOptions.params)) {
            urlString += this.queryStringFromParams(requestOptions.params);
        }
        url = URL.parse(urlString);
        options.host = url.host;
        options.port = Number(url.port);
        options.path = url.path;
        options.hostname = url.hostname;
        options.method = requestOptions.method ? requestOptions.method : 'GET';
        options.headers = {};
        if (u.isDefined(this.publicMeshCookieUserStore[requestOptions.auth.header])) {
            options.headers['Cookie'] = this.publicMeshCookieUserStore[requestOptions.auth.header];
        }
        options.headers['Accept'] = '*/*';
        if (u.isDefined(requestOptions.data)) {
            data = JSON.stringify(requestOptions.data);
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = Buffer.byteLength(data);
        }
        if (requestOptions.auth && requestOptions.auth.type === MeshAuthType.BASIC) {
            options.headers['Authorization'] = requestOptions.auth.header;
        }
        var starttime = Date.now(), req = http.request(options, function (res) {
            var data = '';
            if (res.statusCode === 401 || res.statusCode === 403) {
                console.error(res.statusCode, res.statusMessage, 'Check your mesh user.');
            }
            if (u.isDefined(res.headers) && u.isDefined(res.headers['set-cookie'])) {
                res.headers['set-cookie'].forEach(function (cookie) {
                    var meshCookie;
                    if (cookie.indexOf('mesh.session') > -1) {
                        meshCookie = cookie.substring(0, cookie.indexOf(';'));
                        _this.publicMeshCookieUserStore[requestOptions.auth.header] = meshCookie;
                    }
                });
            }
            if (u.isDefined(res.headers) && u.isDefined(res.headers['content-disposition'])) {
                var response = new MeshRestResponse(res.statusCode, undefined, true);
                response.stream = res;
                deferred.resolve(response);
            }
            else {
                res.on('data', function (chunk) {
                    data += chunk;
                });
                res.on('error', function (err) {
                    console.error(err);
                });
                res.on('end', function () {
                    try {
                        var result = JSON.parse(data);
                        if (requestOptions.logging.data) {
                            console.log(JSON.stringify(result, null, 4));
                        }
                        if (requestOptions.logging.timing) {
                            console.log('TIMING: ', options.path, (Date.now() - starttime) + 'ms');
                        }
                        if (result.error || result.success == 0) {
                            deferred.reject(new MeshRestResponse(res.statusCode, result.error || 'Unknown error', false));
                        }
                        else {
                            //DEBUG LOG FOR JSON NODES
                            deferred.resolve(new MeshRestResponse(res.statusCode, result, false));
                        }
                    }
                    catch (e) {
                        console.error('parse error');
                        e.parseError = 'Error while parsing json';
                        e.options = options;
                        deferred.reject(new MeshRestResponse(res.statusCode, e, false));
                    }
                });
            }
        });
        req.on('socket', function (socket) {
            socket.setTimeout(30000);
            socket.on('timeout', function () {
                req.abort();
            });
        });
        req.on('error', function (err) {
            err.options = options;
            console.error('ERROR IN REQUEST', err);
            deferred.reject(new MeshRestResponse(u.STATUS_ERROR, err, false));
        });
        if (u.isDefined(data)) {
            req.write(data);
        }
        req.end();
        return deferred.promise;
    };
    MeshRestClient.NODES_ENDPOINT = '/nodes/';
    MeshRestClient.NAVIGATION_ENDPOINT = '/navigation';
    MeshRestClient.CHILDREN_ENDPOINT = '/children';
    MeshRestClient.TAG_FAMILIES_ENDPOINT = '/tagFamilies';
    return MeshRestClient;
})();
exports.MeshRestClient = MeshRestClient;
