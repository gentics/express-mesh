'use strict';

/**
 * Mesh user configuration.
 * This user will be used per default for all requests to Mesh.
 */
export class MeshAuthUser {
    public username : string = 'public';
    public password : string = 'public';
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
 * The configuration class for the Mesh API
 */
export class MeshConfig {
    /**
     * Constructor for the default configuration.
     * @param project name of the project.
     * @param viewDirectory directory where the templates are stored.
     * @param languageDirectory directory where translation files are stored.
     */
    constructor(project : string, viewDirectory : string, languageDirectory : string) {
        this.meshProject = project;
        this.viewDirectory = viewDirectory;
        this.languageDirectory = languageDirectory;
    }
    public languageDirectory : string;
    public viewDirectory : string = 'public';
    public meshUrl : string =        'http://localhost:8080';
    public meshBase : string =       '/api/v1/';
    public meshWebroot : string =    '/webroot';
    public meshNavroot : string =    '/navroot';
    public meshProject : string =    'Demo';
    public meshAuth : string =       'basic';
    public meshCheckPublished : boolean = true;
    public meshPublicUser : MeshAuthUser = new MeshAuthUser();
    public meshIndex : string =      '/index.html';
    public defaultErrorView : string  = 'error';
    public defaultView : string  = 'default';
    public languages : Array<string>  = ['de', 'en'];
    public development : boolean  = true;
    public logging : LoggingConfig = new LoggingConfig();
}
