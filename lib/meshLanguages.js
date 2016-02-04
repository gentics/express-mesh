'use strict';
var u = require('./meshUtil');
var path = require('path');
var fs = require('fs');
var langCache = {};
// TODO: This is a hack for now, we net to properly access the current language
var actLang;
var initialized = false;
function readLanguageFiles(config) {
    var langFilePath = config.languageDirectory;
    if (!initialized || config.development) {
        langCache = {};
        config.languages.forEach(function (lang) {
            var parsedLang;
            try {
                parsedLang = JSON.parse(fs.readFileSync(path.join(langFilePath, 'lang-' + lang + '.json'), 'utf8'));
                if (u.isDefined(parsedLang)) {
                    langCache[lang] = parsedLang;
                }
            }
            catch (e) {
                console.error('Could not read language', lang, e);
            }
        });
        initialized = true;
    }
    if (!u.isDefined(actLang)) {
        // set default for actLang
        actLang = config.languages[0];
    }
}
exports.readLanguageFiles = readLanguageFiles;
function getActiveLanguage(req) {
    var active = req.meshConfig.languages[0];
    if (u.isDefined(req.session) && u.isDefined(req.session['language'])) {
        active = req.session['language'];
    }
    return active;
}
exports.getActiveLanguage = getActiveLanguage;
function setActiveLanguage(req, lang) {
    var configuredLanguages = req.meshConfig.languages;
    if (u.isDefined(req.session) && configuredLanguages.indexOf(lang) > -1) {
        req.session['language'] = lang;
    }
}
exports.setActiveLanguage = setActiveLanguage;
function getLanguageArray(req) {
    var configuredLanguages = req.meshConfig.languages, activeLanguage = getActiveLanguage(req);
    actLang = activeLanguage;
    return configuredLanguages.sort(function (a, b) {
        if (a === activeLanguage) {
            return -1;
        }
        else if (b === activeLanguage) {
            return 1;
        }
        else {
            return 0;
        }
    });
}
exports.getLanguageArray = getLanguageArray;
function translateFilter(input) {
    var replacement;
    replacement = u.isDefined(input)
        && u.isDefined(langCache[actLang])
        && u.isDefined(langCache[actLang][input]) ? langCache[actLang][input] : input;
    return replacement;
}
exports.translateFilter = translateFilter;
