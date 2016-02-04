'use strict';
var swig = require('swig');
var lang = require('./meshLanguages');
var moment = require('moment');
var TRANSLATE_FILTER_KEY = 'translate';
var YOUTUBE_FILTER_KEY = 'youtube';
var MOMENT_FILTER_KEY = 'moment';
function registerFilters() {
    // register swig filter to be able to translate in templates
    swig.setFilter(TRANSLATE_FILTER_KEY, lang.translateFilter);
    swig.setFilter(YOUTUBE_FILTER_KEY, youtubeFilter);
    swig.setFilter(MOMENT_FILTER_KEY, momentFilter);
}
exports.registerFilters = registerFilters;
function youtubeFilter(input) {
    var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    var match = input.match(regExp);
    if (match && match[2].length == 11) {
        return match[2];
    }
    else {
        return input;
    }
}
function momentFilter(input, format) {
    if (typeof input === 'number') {
        // In mesh we use unix timestamps
        input = input * 1000;
    }
    return moment(input).format(format);
}
