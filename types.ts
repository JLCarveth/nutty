export type RouteHandler = (
  req: Request,
  path: URLPattern,
  params?: Record<string, unknown>,
) => Promise<Response>;

export interface Route {
    path : URLPattern,
    action : string,
    handler : RouteHandler
}

