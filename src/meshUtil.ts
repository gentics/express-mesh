'use strict';
import Q = require('q');
import fs = require('fs');
import path = require('path');
import URL = require('url');

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

export function isDefined(obj : any) : boolean {
    return typeof obj !== 'undefined' && obj !== null;
}

export function getPath(url : string) : string {
    var parsedUrl;
    if (isDefined(url)) {
        parsedUrl = URL.parse(url);
        return parsedUrl.pathname;
    }
    return url;
}

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
