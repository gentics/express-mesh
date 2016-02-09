'use strict';
import https = require('https');
import http = require('http');
import Q = require('q');
import URL = require('url');
import u = require('./meshUtil');
import lang = require('./meshLanguages');


import {LoggingConfig} from "./config";
import {IMeshRequest} from "./mesh";
import {IMeshNodeListQueryParams} from "./mesh";
import {IMeshNav} from "./mesh";
import {IMeshNode} from "./mesh";
import {IMeshNodeListResponse} from "./mesh";
import {IMeshSearchQuery} from "./mesh";
import {IMeshTagFamily} from "./mesh";
import {IMeshTag} from "./mesh";
import {MeshQueryParams} from "./mesh";

export class MeshRestResponse<T> {
    public stream : http.IncomingMessage;
    constructor(public status : number, public data : T, public isBinary : boolean){}
}

export enum MeshAuthType {
    BASIC
}

export class MeshAuth {
    public static MESH_USER_SESSION_KEY = 'meshusername';
    public static MESH_PASSWORD_SESSION_KEY = 'meshpassword';

    type : MeshAuthType;
    header : string;

    constructor(request : IMeshRequest) {
        this.type = MeshAuthType.BASIC;
        if (u.isDefined(request.session[MeshAuth.MESH_USER_SESSION_KEY]) && u.isDefined(request.session[MeshAuth.MESH_PASSWORD_SESSION_KEY])) {
            this.header = this.getBasicAuthHeader(request.session[MeshAuth.MESH_USER_SESSION_KEY],
                request.session[MeshAuth.MESH_PASSWORD_SESSION_KEY]);
        } else {
            this.header = this.getBasicAuthHeader(request.meshConfig.meshPublicUser.username, request.meshConfig.meshPublicUser.password);
        }
    }

    private getBasicAuthHeader(username : string, password : string) : string {
        return 'Basic ' + new Buffer(username + ':' + password).toString('base64');
    }
}

export class MeshRequestOptions {
    url : string;
    method : string;
    data : any;
    params : IMeshNodeListQueryParams;
    auth : MeshAuth;
    logging : LoggingConfig;
    constructor(request : IMeshRequest) {
        this.auth = new MeshAuth(request);
        this.logging = request.meshConfig.logging;
    }
}

export class MeshRestClient {

    private static NODES_ENDPOINT = '/nodes/';
    private static NAVIGATION_ENDPOINT = '/navigation';
    private static CHILDREN_ENDPOINT = '/children';
    private static TAG_FAMILIES_ENDPOINT = '/tagFamilies';

    private publicMeshCookieUserStore : any = {};

    public getNavigationByPath(req : IMeshRequest, path : string, maxDepth? : number) : Q.Promise<MeshRestResponse<IMeshNav>> {
        var url = req.meshConfig.meshUrl + req.meshConfig.meshBase + req.meshConfig.meshProject + req.meshConfig.meshNavroot + path,
            params = new MeshQueryParams();
        params.maxDepth = maxDepth ? maxDepth : 10;
        return this.meshSimpleGET(req, url, params).then((response : MeshRestResponse<IMeshNav>)=>{
            return response;
        });
    }

    public getNavigationByUUID(req : IMeshRequest, uuid : string, maxDepth? : number) : Q.Promise<MeshRestResponse<IMeshNav>> {
        var url = req.meshConfig.meshUrl + req.meshConfig.meshBase + req.meshConfig.meshProject + MeshRestClient.NODES_ENDPOINT + uuid + MeshRestClient.NAVIGATION_ENDPOINT,
            params = new MeshQueryParams();
            params.maxDepth = maxDepth ? maxDepth : 10;
        return this.meshSimpleGET(req,url, params).then((response : MeshRestResponse<IMeshNav>)=>{
            return response;
        });
    }

    public getWebrootNode<T>(req : IMeshRequest, params? : MeshQueryParams) : Q.Promise<MeshRestResponse<IMeshNode<T>>> {
        var url = req.originalUrl;
        if (typeof url === 'undefined' || u.getPath(url) === '/') {
            url = req.meshConfig.meshIndex;
        }
        url = req.meshConfig.meshUrl + req.meshConfig.meshBase + req.meshConfig.meshProject + req.meshConfig.meshWebroot + url;
        return this.meshSimpleGET<IMeshNode<T>>(req, url, params).then((response : MeshRestResponse<IMeshNode<T>>)=>{
            if (req.meshConfig.meshCheckPublished && !response.isBinary && !response.data.published) {
                response.status = 404;
            }
            return response;
        });
    }

    public getMeshNode<T>(req : IMeshRequest, uuid : string, params? : MeshQueryParams) : Q.Promise<MeshRestResponse<IMeshNode<T>>> {
        var url = req.meshConfig.meshUrl + req.meshConfig.meshBase + req.meshConfig.meshProject + MeshRestClient.NODES_ENDPOINT + uuid;
        return this.meshSimpleGET<IMeshNode<T>>(req, url, params).then((response : MeshRestResponse<IMeshNode<T>>)=>{
            if (req.meshConfig.meshCheckPublished && !response.isBinary && !response.data.published) {
                response.status = 404;
            }
            return response;
        });
    }

    public getChildren<T>(req : IMeshRequest, uuid : string, lang : string, params? : IMeshNodeListQueryParams) : Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshNode<T>>>> {
        var sort = (params && params.orderBy ? params.orderBy : "created"),
            query =
        {"filter":{"bool":{"must":[{"term":{"parentNode.uuid":uuid}},{"term":{"language":lang}}],"_cache":true}},"sort":{}};
        query.sort[sort] = {"order":"asc"};
        return this.meshSearch<IMeshNode<T>>(req, query, params);
    }

    public meshSearch<T>(req : IMeshRequest, query : IMeshSearchQuery, params? : IMeshNodeListQueryParams) : Q.Promise<MeshRestResponse<IMeshNodeListResponse<T>>> {
        var opts = new MeshRequestOptions(req),
            languages = lang.getLanguageArray(req);
        opts.url = opts.url = req.meshConfig.meshUrl + req.meshConfig.meshBase + 'search/nodes';
        opts.params = params;
        opts.params.resolveLinks = 'short';
        if (u.isDefined(languages)) {
            opts.params.lang = languages.join(',');
        }
        return this.meshPOST(opts, query);
    }

    public getTagFamilies(req : IMeshRequest, params? : MeshQueryParams) : Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshTagFamily>>> {
        var url = req.meshConfig.meshUrl + req.meshConfig.meshBase + req.meshConfig.meshProject + MeshRestClient.TAG_FAMILIES_ENDPOINT;
        return this.meshSimpleGET<IMeshNodeListResponse<IMeshTagFamily>>(req, url, params);
    }

    public getTagsOfTagFamily(req : IMeshRequest, uuid : string, params? : MeshQueryParams) : Q.Promise<MeshRestResponse<IMeshNodeListResponse<IMeshTag>>> {
        var url = req.meshConfig.meshUrl + req.meshConfig.meshBase + req.meshConfig.meshProject + MeshRestClient.TAG_FAMILIES_ENDPOINT + '/' + uuid + '/tags';
        return this.meshSimpleGET<IMeshNodeListResponse<IMeshTag>>(req, url, params);
    }

    public login(req : IMeshRequest, username : string, password : string) : Q.Promise<boolean> {
        var opts = new MeshRequestOptions(req);
        opts.url = opts.url = req.meshConfig.meshUrl + req.meshConfig.meshBase + 'auth/login';
        return this.meshPOST(opts, {
            "username" : username,
            "password" : password
        }).then((response) => {
            if (response.status === 200) {
                return true;
            } else {
                return false;
            }
        }).catch((err) => {
            return false;
        });
    }

    public logout(req : IMeshRequest) : Q.Promise<boolean> {
        var opts = new MeshRequestOptions(req);
        opts.url = opts.url = req.meshConfig.meshUrl + req.meshConfig.meshBase + 'auth/logout';
        return this.makeMeshRequest(opts).then((response) => {
            return true;
        }).catch((err) => {
            return false;
        });
    }

    private meshSimpleGET<T>(req : IMeshRequest, url : string, params? : MeshQueryParams) : Q.Promise<MeshRestResponse<T>> {
        var opts = new MeshRequestOptions(req),
            languages = lang.getLanguageArray(req);
        opts.url = url;
        opts.params = params ? params : new MeshQueryParams();
        opts.params.resolveLinks = 'short';
        if (u.isDefined(languages)) {
            opts.params.lang = languages.join(',');
        }
        return this.makeMeshRequest(opts);
    }

    public meshPOST(requestOptions : MeshRequestOptions, data? : any) : Q.Promise<MeshRestResponse<any>> {
        requestOptions.method = 'POST';
        requestOptions.data = data;
        return this.makeMeshRequest(requestOptions);
    }

    /**
     * Convert a queryParams object into a URL-encoded string.
     */
    private queryStringFromParams(queryParams: IMeshNodeListQueryParams) {
        var queryString = '?';

        for (var prop in queryParams) {
            if (queryParams.hasOwnProperty(prop)) {
                queryString += prop + '=' + encodeURIComponent(queryParams[prop]) + '&';
            }
        }
        // return substring to remove trailing '&'
        return queryString.substr(0, queryString.length - 1);
    }

    private makeMeshRequest(requestOptions : MeshRequestOptions) : Q.Promise<MeshRestResponse<any>> {
        var deferred = Q.defer<MeshRestResponse<any>>(),
            options : https.RequestOptions = {},
            urlString : string = requestOptions.url,
            url,
            data;
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
        var starttime = Date.now(),
            req = http.request(options, (res) => {
            var data = '';
            if (u.isDefined(res.headers) && u.isDefined(res.headers['set-cookie'])) {
                res.headers['set-cookie'].forEach((cookie) => {
                    var meshCookie;
                   if (cookie.indexOf('mesh.session') > -1) {
                       meshCookie = cookie.substring(0, cookie.indexOf(';'));
                       this.publicMeshCookieUserStore[requestOptions.auth.header] = meshCookie;
                   }
                });
            }
            if (u.isDefined(res.headers) && u.isDefined(res.headers['content-disposition'])) {
                let response = new MeshRestResponse(res.statusCode, undefined, true);
                response.stream = res;
                deferred.resolve(response);
            } else {
                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('error', (err)=>{
                    console.error(err);
                });
                res.on('end', () => {
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
                        } else {
                            //DEBUG LOG FOR JSON NODES
                            deferred.resolve(new MeshRestResponse(res.statusCode, result, false));
                        }
                    } catch (e) {
                        console.error('parse error');
                        e.parseError = 'Error while parsing json';
                        e.options = options;
                        deferred.reject(new MeshRestResponse(res.statusCode, e, false));
                    }
                });
            }
        });

        req.on('socket',  (socket) => {
            socket.setTimeout(30000);
            socket.on('timeout', function() {
                req.abort();
            });
        });

        req.on('error', (err) => {
            err.options = options;
            console.error('ERROR IN REQUEST', err);
            deferred.reject(new MeshRestResponse(u.STATUS_ERROR, err, false));
        });

        if (u.isDefined(data)) {
            req.write(data);
        }

        req.end();
        return deferred.promise;
    }
}

