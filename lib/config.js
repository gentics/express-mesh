'use strict';
/**
 * Mesh user configuration.
 * This user will be used per default for all requests to Mesh.
 */
var MeshAuthUser = (function () {
    function MeshAuthUser() {
        this.username = 'public';
        this.password = 'public';
    }
    return MeshAuthUser;
})();
exports.MeshAuthUser = MeshAuthUser;
/**
 * Configuration for logging output.
 * data => logging for the JSON, that is returned from mesh
 * timing => duration for requests to mesh
 * renderdata => data that is being passed to the templates when rendering
 */
var LoggingConfig = (function () {
    function LoggingConfig() {
        this.data = false;
        this.timing = true;
        this.renderdata = false;
    }
    return LoggingConfig;
})();
exports.LoggingConfig = LoggingConfig;
/**
 * The configuration class for the Mesh API
 */
var MeshConfig = (function () {
    /**
     * Constructor for the default configuration.
     * @param project name of the project.
     * @param viewDirectory directory where the templates are stored.
     * @param languageDirectory directory where translation files are stored.
     */
    function MeshConfig(project, viewDirectory, languageDirectory) {
        this.viewDirectory = 'public';
        this.meshUrl = 'http://localhost:8080';
        this.meshBase = '/api/v1/';
        this.meshWebroot = '/webroot';
        this.meshNavroot = '/navroot';
        this.meshProject = 'Demo';
        this.meshAuth = 'basic';
        this.meshCheckPublished = true;
        this.meshPublicUser = new MeshAuthUser();
        this.meshIndex = '/index.html';
        this.defaultErrorView = 'error';
        this.defaultView = 'default';
        this.languages = ['de', 'en'];
        this.development = true;
        this.logging = new LoggingConfig();
        this.meshProject = project;
        this.viewDirectory = viewDirectory;
        this.languageDirectory = languageDirectory;
    }
    return MeshConfig;
})();
exports.MeshConfig = MeshConfig;
