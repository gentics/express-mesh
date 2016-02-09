import { IMeshRequest } from "./mesh";
import { IMeshNode } from "./mesh";
import { IMeshResponse } from "./mesh";
import { IMeshErrorHandler } from "./meshHandlerStore";
import { IMeshViewHandler } from "./meshHandlerStore";
import { IMeshSchemaHandler } from "./meshHandlerStore";
export declare class RenderInformation {
    activeLanguage: string;
    availableLanguages: Array<string>;
    languageURLs: {
        [key: string]: string;
    };
    username: string;
    loggedin: boolean;
    constructor(req: IMeshRequest, node?: IMeshNode<any>);
}
export declare class RenderData {
    node: IMeshNode<any>;
    nodes: Array<IMeshNode<any>>;
    renderInformation: RenderInformation;
    meta: any;
    constructor();
}
export declare class MeshRenderer {
    private viewDir;
    static TEMPLATE_EXTENSION: string;
    private schemaHandlerStore;
    private errorHandlerStore;
    private viewHandlerStore;
    constructor(viewDir: string);
    registerSchemaHandler<T>(schema: string, handler: IMeshSchemaHandler<T>): void;
    registerErrorHandler(status: number, handler: IMeshErrorHandler): void;
    registerViewRenderHandler(handler: IMeshViewHandler): void;
    renderMeshNode<T>(node: IMeshNode<T>, req: IMeshRequest, res: IMeshResponse): void;
    renderError(status: number, req: IMeshRequest, res: IMeshResponse, err?: any): void;
    private viewExists(name);
    renderView(name: string, data: RenderData, req: IMeshRequest, res: IMeshResponse): void;
    private handleMicroNodeFields<T>(node);
    private resolveField(field);
    private meshNodeToString<T>(node);
    private getSchemaKey<T>(node);
    private renderTemplate(name, data);
    getRenderData<T>(node: IMeshNode<T>, req: IMeshRequest): RenderData;
}
