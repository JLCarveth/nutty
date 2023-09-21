export type RouteHandler = (
  req: Request,
  path: URLPattern,
  params?: Record<string, string | undefined>,
) => Promise<Response> | Response;

export interface Route {
  path: URLPattern;
  action: string;
  handler: RouteHandler;
}
