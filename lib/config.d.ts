export declare class MeshAuthUser {
    username: string;
    password: string;
}
export declare class LoggingConfig {
    data: boolean;
    timing: boolean;
    renderdata: boolean;
}
export declare class MeshConfig {
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
