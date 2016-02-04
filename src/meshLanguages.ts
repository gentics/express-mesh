import {MeshConfig} from "./config";
'use strict';

import u = require('./meshUtil');
import path = require('path');
import fs = require('fs');

import {IMeshRequest} from "./index";

var langCache : { [key:string]:any; } = {};
// TODO: This is a hack for now, we net to properly access the current language
var actLang : string;
var initialized : boolean = false;

export function readLanguageFiles(config : MeshConfig) : void {
    var langFilePath = config.languageDirectory;
    if (!initialized || config.development) {
        langCache = {};
        config.languages.forEach((lang : string) => {
            var parsedLang;
            try {
                parsedLang = JSON.parse(fs.readFileSync(path.join(langFilePath, 'lang-' + lang + '.json'), 'utf8'));
                if (u.isDefined(parsedLang)) {
                    langCache[lang] = parsedLang;
                }
            } catch (e) {
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

export function getActiveLanguage(req : IMeshRequest) : string {
    var active : string = req.meshConfig.languages[0];

    if (u.isDefined(req.session) && u.isDefined(req.session['language'])) {
        active = req.session['language'];
    }
    return active;
}

export function setActiveLanguage(req : IMeshRequest, lang : string) : void {
    var configuredLanguages = req.meshConfig.languages;
    if (u.isDefined(req.session) && configuredLanguages.indexOf(lang) > -1) {
        req.session['language'] = lang;
    }
}

export function getLanguageArray(req : IMeshRequest) : Array<string> {
    var configuredLanguages = req.meshConfig.languages,
        activeLanguage = getActiveLanguage(req);
    actLang = activeLanguage;
    return configuredLanguages.sort((a : string, b : string) => {
        if (a === activeLanguage) {
            return -1;
        } else if (b === activeLanguage) {
            return 1;
        } else {
            return 0;
        }
    });
}

export function translateFilter(input : string) : string {
    var replacement;
    replacement = u.isDefined(input)
        && u.isDefined(langCache[actLang])
        && u.isDefined(langCache[actLang][input]) ? langCache[actLang][input] : input;
    return replacement;
}
