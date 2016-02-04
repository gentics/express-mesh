'use strict';
var Q = require('q');
var fs = require('fs');
var URL = require('url');
function fileExists(path) {
    var deferred = Q.defer();
    fs.access(path, fs.R_OK, function (err) {
        if (err) {
            deferred.reject(false);
        }
        else {
            deferred.resolve(true);
        }
    });
    return deferred.promise;
}
exports.fileExists = fileExists;
function isDefined(obj) {
    return typeof obj !== 'undefined' && obj !== null;
}
exports.isDefined = isDefined;
function getPath(url) {
    var parsedUrl;
    if (isDefined(url)) {
        parsedUrl = URL.parse(url);
        return parsedUrl.pathname;
    }
    return url;
}
exports.getPath = getPath;
function asyncLoop(items, doLoopBody) {
    var i = 0, d = Q.defer();
    nextIteration();
    return d.promise;
    function nextIteration() {
        if (i < items.length) {
            doLoopBody(items[i], i, items).then(function () {
                i++;
                nextIteration();
            }, onError);
        }
        else {
            d.resolve(undefined);
        }
    }
    function onError(reason) {
        d.reject(reason);
    }
}
exports.asyncLoop = asyncLoop;
;
exports.STATUS_ERROR = 500;
