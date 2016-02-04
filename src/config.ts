'use strict';

export class MeshAuthUser {
    public username : string = 'public';
    public password : string = 'public';
}

export class LoggingConfig {
    public data : boolean = false;
    public timing : boolean = true;
    public renderdata : boolean = false;
}

export class MeshConfig {
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
