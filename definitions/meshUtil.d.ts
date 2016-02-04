import Q = require('q');
export declare function fileExists(path: string): Q.Promise<boolean>;
export declare function isDefined(obj: any): boolean;
export declare function getPath(url: string): string;
export declare function asyncLoop(items: any, doLoopBody: any): Q.Promise<void>;
export declare var STATUS_ERROR: number;
