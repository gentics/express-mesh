'use strict';
/**
 * Mesh user configuration.
 * This user will be used per default for all requests to Mesh.
 */
var MeshAuthUser = (function () {
    function MeshAuthUser() {
        this.username = 'admin';
        this.password = 'admin';
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
     * Create a mesh config object from an object containing the configuration.
     * @param conf Configuration Object.
     */
    function MeshConfig(conf) {
        this.viewDirectory = 'public';
        this.backendUrl = 'http://localhost:8080';
        this.base = '/api/v1/';
        this.webroot = '/webroot';
        this.navroot = '/navroot';
        this.project = 'demo';
        this.auth = 'basic';
        this.checkPublished = false;
        this.apiToken = "";
        this.index = '/index.html';
        this.defaultErrorView = 'error';
        this.defaultView = 'default';
        this.languages = ['de', 'en'];
        this.development = true;
        this.logging = new LoggingConfig();
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
    MeshConfig.createSimpleConfiguration = function (project, viewDirectory, languageDirectory) {
        if (viewDirectory === void 0) { viewDirectory = 'views'; }
        return new MeshConfig({
            project: project,
            viewDirectory: viewDirectory,
            languageDirectory: languageDirectory
        });
    };
    return MeshConfig;
})();
exports.MeshConfig = MeshConfig;
