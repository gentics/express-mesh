'use strict';
var Q = require('q');
var fs = require('fs');
var URL = require('url');
/**
 * Check if a file exists.
 * @param path Path of the file to check.
 * @returns {Promise<boolean>} A promise that will be resolved if the check finished and will be rejected if the check fails.
 */
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
/**
 * Short hand to check if a variable is defined and not null.
 * @param obj Variable to check.
 * @returns {boolean} true if it is defined and not null, false otherwise.
 */
function isDefined(obj) {
    return typeof obj !== 'undefined' && obj !== null;
}
exports.isDefined = isDefined;
/**
 * Short hand to check if a variable is a function.
 * @param obj Variable to check
 * @returns {boolean} true if it is a function, false otherwise.
 */
function isFunction(obj) {
    return typeof obj === 'function';
}
exports.isFunction = isFunction;
/**
 * Get the path from an URL.
 * @param url URL to convert to a path.
 * @returns {string} The path part of a URL.
 */
function getPath(url) {
    var parsedUrl;
    if (isDefined(url)) {
        parsedUrl = URL.parse(url);
        return parsedUrl.pathname;
    }
    return url;
}
exports.getPath = getPath;
/**
 * A loop that iterates over a series of functions returning promises in sequence.
 * @param items Array of function to iterate over.
 * @param doLoopBody
 * @returns {Promise<void>}
 */
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
