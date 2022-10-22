export interface Route {
    path : URLPattern,
    action : string,
    handler : (request : Request, path : URLPattern, params? : Record<string, unknown>) => Response
}

