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
 * Configration base. Can be used to create a mesh configuration.
 */
export interface IMeshConfigBase {
    languageDirectory?: string;
    viewDirectory?: string;
    backendUrl?: string;
    base?: string;
    webroot?: string;
    navroot?: string;
    project?: string;
    auth?: string;
    checkPublished?: boolean;
    apiToken?: string;
    index?: string;
    defaultErrorView?: string;
    defaultView?: string;
    languages?: Array<string>;
    development?: boolean;
    logging?: LoggingConfig;
}
/**
 * The configuration class for the Mesh API
 */
export declare class MeshConfig {
    /**
     * Create a mesh config object from an object containing the configuration.
     * @param conf Configuration Object.
     */
    constructor(conf: IMeshConfigBase);
    /**
     * Factory funciton to create a simple configuration.
     * @param project name of the project.
     * @param viewDirectory directory where the templates are stored.
     * @param languageDirectory directory where translation files are stored.
     */
    static createSimpleConfiguration(project: string, viewDirectory?: string, languageDirectory?: string): MeshConfig;
    languageDirectory: string;
    viewDirectory: string;
    backendUrl: string;
    base: string;
    webroot: string;
    navroot: string;
    project: string;
    auth: string;
    checkPublished: boolean;
    apiToken: string;
    index: string;
    defaultErrorView: string;
    defaultView: string;
    languages: Array<string>;
    development: boolean;
    logging: LoggingConfig;
}
