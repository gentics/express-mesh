'use strict';

import Q = require('q');
import fs = require('fs');
import path = require('path');
import URL = require('url');
import swig  = require('swig');
import lang  = require('./meshLanguages');
import moment  = require('moment');

var TRANSLATE_FILTER_KEY : string = 'translate';
var YOUTUBE_FILTER_KEY : string = 'youtube';
var MOMENT_FILTER_KEY : string = 'moment';

export function registerFilters() : void {
    // register swig filter to be able to translate in templates
    swig.setFilter(TRANSLATE_FILTER_KEY, lang.translateFilter);
    swig.setFilter(YOUTUBE_FILTER_KEY, youtubeFilter);
    swig.setFilter(MOMENT_FILTER_KEY, momentFilter);
}


function youtubeFilter(input : string) : string {
    var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    var match = input.match(regExp);
    if (match && match[2].length == 11) {
        return match[2];
    } else {
        return input;
    }
}

function momentFilter(input : any, format : string) : string {
    if (typeof input === 'number') {
        // In mesh we use unix timestamps
        input = input * 1000;
    }
    return moment(input).format(format);
}

