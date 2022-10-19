export interface Route {
    path : URLPattern,
    action : string,
    handler : (request : Request, response : Response) => Response
}
