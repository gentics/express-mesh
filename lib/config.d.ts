/**
 * Mesh user configuration.
 * This user will be used per default for all requests to Mesh.
 */
export declare class MeshAuthUser {
    username: string;
    password: string;
}
/**
 * Configuration for logging output.
 * data => logging for the JSON, that is returned from mesh
 * timing => duration for requests to mesh
 * renderdata => data that is being passed to the templates when rendering
 */
export declare class LoggingConfig {
    data: boolean;
    timing: boolean;
    renderdata: boolean;
}
/**
 * The configuration class for the Mesh API
 */
export declare class MeshConfig {
    /**
     * Constructor for the default configuration.
     * @param project name of the project.
     * @param viewDirectory directory where the templates are stored.
     * @param languageDirectory directory where translation files are stored.
     */
    constructor(project: string, viewDirectory: string, languageDirectory: string);
    languageDirectory: string;
    viewDirectory: string;
    meshUrl: string;
    meshBase: string;
    meshWebroot: string;
    meshNavroot: string;
    meshProject: string;
    meshAuth: string;
    meshCheckPublished: boolean;
    meshPublicUser: MeshAuthUser;
    meshIndex: string;
    defaultErrorView: string;
    defaultView: string;
    languages: Array<string>;
    development: boolean;
    logging: LoggingConfig;
}
