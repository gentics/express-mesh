import { MeshConfig } from "./config";
import { IMeshRequest } from "./index";
export declare function readLanguageFiles(config: MeshConfig): void;
export declare function getActiveLanguage(req: IMeshRequest): string;
export declare function setActiveLanguage(req: IMeshRequest, lang: string): void;
export declare function getLanguageArray(req: IMeshRequest): Array<string>;
export declare function translateFilter(input: string): string;
