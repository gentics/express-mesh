import express = require('express');
import { IMeshRequest } from "./mesh";
import { IMeshNode } from "./mesh";
import { IMeshResponse } from "./mesh";
import { IMeshErrorHandler } from "./meshHandlerStore";
import { IMeshViewHandler } from "./meshHandlerStore";
import { IMeshSchemaHandler } from "./meshHandlerStore";
/**
 * Render information that will be passed to the rendered template in the RenderData.
 */
export declare class RenderInformation {
    activeLanguage: string;
    availableLanguages: Array<string>;
    languageURLs: {
        [key: string]: string;
    };
    username: string;
    loggedin: boolean;
    /**
     * Constructor that initializes the render information.
     * @param req The MeshRequest.
     * @param node The MeshNode that should be rendered.
     */
    constructor(req: IMeshRequest, node?: IMeshNode<any>);
}
/**
 * Render data that is passed to the rendered template and contains the data that should be rendered.
 */
export declare class RenderData {
    node: IMeshNode<any>;
    nodes: Array<IMeshNode<any>>;
    renderInformation: RenderInformation;
    meta: any;
    constructor();
}
/**
 * The MeshRenderer is responsible for rendering templates.
 */
export declare class MeshRenderer {
    private app;
    private viewDir;
    static TEMPLATE_EXTENSION: string;
    private schemaHandlerStore;
    private errorHandlerStore;
    private viewHandlerStore;
    /**
     * Initialize the renderer.
     * @param app Express app.
     * @param viewDir Directory that contains the templates.
     */
    constructor(app: express.Express, viewDir: string);
    registerSchemaHandler<T>(schema: string, handler: IMeshSchemaHandler<T>): void;
    registerErrorHandler(status: number, handler: IMeshErrorHandler): void;
    registerViewRenderHandler(handler: IMeshViewHandler): void;
    renderMeshNode<T>(node: IMeshNode<T>, req: IMeshRequest, res: IMeshResponse): void;
    renderError(status: number, req: IMeshRequest, res: IMeshResponse, err?: any): void;
    private viewExists(name);
    renderView(name: string, data: RenderData, req: IMeshRequest, res: IMeshResponse): void;
    private handleMicroNodeFields<T>(node, req, res);
    private resolveField(field, req, res);
    private meshNodeToString<T>(node, req, res);
    private getSchemaKey<T>(node);
    private renderTemplate(name, data);
    getRenderData<T>(node: IMeshNode<T>, req: IMeshRequest): RenderData;
}
