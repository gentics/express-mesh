'use strict';
var lang = require('./meshLanguages');
var u = require('./meshUtil');
var moment = require('moment');
var TRANSLATE_FILTER_KEY = 'translate';
var YOUTUBE_FILTER_KEY = 'youtube';
var MOMENT_FILTER_KEY = 'moment';
/**
 * Register default template filters.
 * Out of the box we support registering filters with swig and handlebars. If you have a different template engine
 * please pass a register function to register the filters with your template engine. This function will then be called
 * for each of the mesh filters.
 * @param engine Your template engine.
 * @param registerfunction [optional] register function that will be called for each of the mesh filters.
 **/
function registerFilters(engine, registerfunction) {
    if (u.isDefined(engine) && u.isFunction(engine.setFilter)) {
        engine.setFilter(TRANSLATE_FILTER_KEY, lang.translateFilter);
        engine.setFilter(YOUTUBE_FILTER_KEY, youtubeFilter);
        engine.setFilter(MOMENT_FILTER_KEY, momentFilter);
    }
    else if (u.isDefined(engine) && u.isFunction(engine.registerHelper)) {
        engine.registerHelper(TRANSLATE_FILTER_KEY, lang.translateFilter);
        engine.registerHelper(YOUTUBE_FILTER_KEY, youtubeFilter);
        engine.registerHelper(MOMENT_FILTER_KEY, momentFilter);
    }
    else if (u.isDefined(registerfunction) && u.isFunction(registerfunction)) {
        registerfunction(engine, TRANSLATE_FILTER_KEY, lang.translateFilter);
        registerfunction(engine, YOUTUBE_FILTER_KEY, youtubeFilter);
        registerfunction(engine, MOMENT_FILTER_KEY, momentFilter);
    }
    else {
        throw 'Registering filters failed. Either use a supported engine, or pass a custom register function.';
    }
}
exports.registerFilters = registerFilters;
/**
 * Simple youtube filter, that extracts the video id out of a youtube link.
 **/
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
/**
 * Simple moment filter, that can be used to render mesh dates/timestamps with a formatstring.
 * @param input unix timestamp that should be rendered
 * @param format format string (check momentjs website)
 * @returns {string} formated date.
 */
function momentFilter(input, format) {
    if (typeof input === 'number') {
        // In mesh we use unix timestamps
        input = input * 1000;
    }
    return moment(input).format(format);
}
