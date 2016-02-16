'use strict';

/**
 * Mesh user configuration.
 * This user will be used per default for all requests to Mesh.
 */
export class MeshAuthUser {
    public username : string = 'admin';
    public password : string = 'admin';
}

/**
 * Configuration for logging output.
 * data => logging for the JSON, that is returned from mesh
 * timing => duration for requests to mesh
 * renderdata => data that is being passed to the templates when rendering
 */
export class LoggingConfig {
    public data : boolean = false;
    public timing : boolean = true;
    public renderdata : boolean = false;
}

/**
 * Configration base. Can be used to create a mesh configuration.
 */
export interface IMeshConfigBase {
    languageDirectory? : string;
    viewDirectory? : string;
    backendUrl? : string;
    base? : string;
    webroot? : string;
    navroot? : string;
    project? : string;
    auth? : string;
    checkPublished? : boolean;
    publicUser? : MeshAuthUser;
    index? : string;
    defaultErrorView? : string;
    defaultView? : string;
    languages? : Array<string>;
    development? : boolean;
    logging? : LoggingConfig;
}

/**
 * The configuration class for the Mesh API
 */
export class MeshConfig {

    /**
     * Create a mesh config object from an object containing the configuration.
     * @param conf Configuration Object.
     */
    constructor(conf : IMeshConfigBase) {
        for (var key in conf) {
            this[key] = conf[key];
        }
    }

    /**
     * Factory funciton to create a simple configuration.
     * @param project name of the project.
     * @param viewDirectory directory where the templates are stored.
     * @param languageDirectory directory where translation files are stored.
     */
    public static createSimpleConfiguration(project : string,
                                            viewDirectory : string = 'views',
                                            languageDirectory? : string) : MeshConfig {
        return new MeshConfig({
            project : project,
            viewDirectory : viewDirectory,
            languageDirectory : languageDirectory
        });
    }

    public languageDirectory : string;
    public viewDirectory : string = 'public';
    public backendUrl : string =        'http://localhost:8080';
    public base : string =       '/api/v1/';
    public webroot : string =    '/webroot';
    public navroot : string =    '/navroot';
    public project : string =    'demo';
    public auth : string =       'basic';
    public checkPublished : boolean = false;
    public publicUser : MeshAuthUser = new MeshAuthUser();
    public index : string =      '/index.html';
    public defaultErrorView : string  = 'error';
    public defaultView : string  = 'default';
    public languages : Array<string>  = ['de', 'en'];
    public development : boolean  = true;
    public logging : LoggingConfig = new LoggingConfig();
}
