'use strict';

import u = require('./meshUtil');
import path = require('path');
import fs = require('fs');

import {MeshConfig} from "./config";
import {IMeshRequest} from "./mesh";

/**
 * Cache object, where the language JSONs will be stored.
 * @type {{}}
 */
var langCache : { [key:string]:any; } = {};
// TODO: This is a hack for now, we net to properly access the current language
var actLang : string;
var initialized : boolean = false;

/**
 * Read the language files from the configured language folder and populate the langCache object.
 * @param config MeshConfiguration
 */
export function readLanguageFiles(config : MeshConfig) : void {
    var langFilePath = config.languageDirectory;
    if (u.isDefined(langFilePath) && langFilePath !== '' && (!initialized || config.development)) {
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

/**
 * Get the active language form the MeshRequest.
 * @param req The MeshRequest
 * @returns {string} The current language or default language if none is set.
 */
export function getActiveLanguage(req : IMeshRequest) : string {
    var active : string = req.meshConfig.languages[0];

    if (u.isDefined(req.session) && u.isDefined(req.session['language'])) {
        active = req.session['language'];
    }
    return active;
}

/**
 * Set the active language.
 * @param req The MeshRequest
 * @param lang The language code, that should be set as the current language.
 */
export function setActiveLanguage(req : IMeshRequest, lang : string) : void {
    var configuredLanguages = req.meshConfig.languages;
    if (u.isDefined(req.session) && configuredLanguages.indexOf(lang) > -1) {
        req.session['language'] = lang;
    }
}

/**
 * Get the language array sorted for language fallback with the Mesh backend.
 * @param req The MeshRequest.
 * @returns {string[]} The language array, where the current language is the first element.
 */
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

/**
 * Template filter to translate strings.
 * The language will be chosen from previous requests.
 * @param input String that should be translated.
 * @returns {string|any} Translated string or string if no translation is defined.
 */
export function translateFilter(input: string);
/**
 * Template filter to translate strings.
 * @param input String that should be translated.
 * @param language The language to translate to.
 * @returns {string|any} Translated string or string if no translation is defined.
 */
export function translateFilter(input: string, language: string);
export function translateFilter(input: string, language?: string) : string {
    if (!language) {
        language = actLang;
    }
    var replacement;
    replacement = u.isDefined(input)
        && u.isDefined(langCache[language])
        && u.isDefined(langCache[language][input]) ? langCache[language][input] : input;
    return replacement;
}
