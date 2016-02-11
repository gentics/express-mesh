import Q = require('q');
/**
 * Check if a file exists.
 * @param path Path of the file to check.
 * @returns {Promise<boolean>} A promise that will be resolved if the check finished and will be rejected if the check fails.
 */
export declare function fileExists(path: string): Q.Promise<boolean>;
/**
 * Short hand to check if a variable is defined and not null.
 * @param obj Variable to check.
 * @returns {boolean} true if it is defined and not null, false otherwise.
 */
export declare function isDefined(obj: any): boolean;
/**
 * Short hand to check if a variable is a function.
 * @param obj Variable to check
 * @returns {boolean} true if it is a function, false otherwise.
 */
export declare function isFunction(obj: any): boolean;
/**
 * Get the path from an URL.
 * @param url URL to convert to a path.
 * @returns {string} The path part of a URL.
 */
export declare function getPath(url: string): string;
/**
 * A loop that iterates over a series of functions returning promises in sequence.
 * @param items Array of function to iterate over.
 * @param doLoopBody
 * @returns {Promise<void>}
 */
export declare function asyncLoop(items: any, doLoopBody: any): Q.Promise<void>;
export declare var STATUS_ERROR: number;
