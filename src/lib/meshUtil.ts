'use strict';
import Q = require('q');
import fs = require('fs');
import path = require('path');
import URL = require('url');

/**
 * Check if a file exists.
 * @param path Path of the file to check.
 * @returns {Promise<boolean>} A promise that will be resolved if the check finished and will be rejected if the check fails.
 */
export function fileExists(path : string) : Q.Promise<boolean> {
    var deferred = Q.defer<boolean>();
    fs.access(path, fs.R_OK, (err : any) => {
        if (err) {
            deferred.reject(false);
        } else {
            deferred.resolve(true);
        }
    });
    return deferred.promise;
}

/**
 * Short hand to check if a variable is defined and not null.
 * @param obj Variable to check.
 * @returns {boolean} true if it is defined and not null, false otherwise.
 */
export function isDefined(obj : any) : boolean {
    return typeof obj !== 'undefined' && obj !== null;
}

/**
 * Get the path from an URL.
 * @param url URL to convert to a path.
 * @returns {string} The path part of a URL.
 */
export function getPath(url : string) : string {
    var parsedUrl;
    if (isDefined(url)) {
        parsedUrl = URL.parse(url);
        return parsedUrl.pathname;
    }
    return url;
}

/**
 * A loop that iterates over a series of functions returning promises in sequence.
 * @param items Array of function to iterate over.
 * @param doLoopBody
 * @returns {Promise<void>}
 */
export function asyncLoop(items, doLoopBody) : Q.Promise<void>{
    var i = 0, d = Q.defer<void>();

    nextIteration();

    return d.promise;

    function nextIteration() {
        if( i < items.length ) {
            doLoopBody(items[i], i, items).then(
                () => {
                    i++;
                    nextIteration();
                },
                onError
            );
        }
        else {
            d.resolve(undefined);
        }
    }

    function onError(reason) {
        d.reject(reason);
    }
};

export var STATUS_ERROR : number = 500;
