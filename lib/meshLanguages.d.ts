import { MeshConfig } from "./config";
import { IMeshRequest } from "./mesh";
/**
 * Read the language files from the configured language folder and populate the langCache object.
 * @param config MeshConfiguration
 */
export declare function readLanguageFiles(config: MeshConfig): void;
/**
 * Get the active language form the MeshRequest.
 * @param req The MeshRequest
 * @returns {string} The current language or default language if none is set.
 */
export declare function getActiveLanguage(req: IMeshRequest): string;
/**
 * Set the active language.
 * @param req The MeshRequest
 * @param lang The language code, that should be set as the current language.
 */
export declare function setActiveLanguage(req: IMeshRequest, lang: string): void;
/**
 * Get the language array sorted for language fallback with the Mesh backend.
 * @param req The MeshRequest.
 * @returns {string[]} The language array, where the current language is the first element.
 */
export declare function getLanguageArray(req: IMeshRequest): Array<string>;
/**
 * Template filter to translate strings.
 * The language will be chosen from previous requests.
 * @param input String that should be translated.
 * @returns {string|any} Translated string or string if no translation is defined.
 */
export declare function translateFilter(input: string): any;
/**
 * Template filter to translate strings.
 * @param input String that should be translated.
 * @param language The language to translate to.
 * @returns {string|any} Translated string or string if no translation is defined.
 */
export declare function translateFilter(input: string, language: string): any;
