/**
 * Interface for the FilterRegisterFunction. You can pass such a function to register the mesh filters to your
 * template engine.
 */
export interface IFilterRegisterFunction {
    (engine: any, key: string, filterfunction: Function): void;
}
/**
 * Register default template filters.
 * Out of the box we support registering filters with swig and handlebars. If you have a different template engine
 * please pass a register function to register the filters with your template engine. This function will then be called
 * for each of the mesh filters.
 * @param engine Your template engine.
 * @param registerfunction [optional] register function that will be called for each of the mesh filters.
 **/
export declare function registerFilters(engine: any, registerfunction?: IFilterRegisterFunction): void;
