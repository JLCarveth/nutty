/**
 * Zippy - Minimal Web Server
 *
 *  This was made for fun, should probably not be used for serious production workloads.
 *  - John L. Carveth
 */
import { Route, RouteHandler } from "./types.ts";

const routes: Route[] = [];
const DEBUG = Deno.env.get("DEBUG") === "true";


/**
 * Handles incoming HTTP requests
 */
async function serveHttp(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);

  for await (const requestEvent of httpConn) {
    const method = requestEvent.request.method;
    const path = requestEvent.request.url;

    if (DEBUG) {
      console.log(`${method}-${path}`);
    }

    /* Iterate through registered routes for a match */
    for (const route of routes) {
      if (route.action === method && route.path.test(path)) {
        const match = route.path.exec(requestEvent.request.url);
        const params = match?.pathname.groups;
        /* Pass off the request info, params to the registered handler */
        const response = route.handler(
          requestEvent.request,
          route.path,
          params,
        );
        requestEvent.respondWith(response);
        break;
      }
    }
  }
}

/**
 * Assigns a new GET route to the web server.
 */
export function get(path: string, handler: RouteHandler) {
  const urlPattern = new URLPattern({ pathname: path });
  routes.push({ path: urlPattern, action: "GET", handler: handler });
}

/**
 *  Assigns a new POST route to the web server.
 */
export function post(path: string, handler: RouteHandler) {
  const urlPattern = new URLPattern({ pathname: path });
  routes.push({ path: urlPattern, action: "POST", handler: handler });
}

/** 
 * Assign a new route to the web server.
 */
export function addRoute(path: string, action: string, handler: RouteHandler) {
  const urlPattern = new URLPattern({ pathname: path });
  routes.push({ path: urlPattern, action: action, handler: handler });
}

/**
 * Call this function to start the server.
 * @param port The port the server will listen to
 */
export async function listen(port: number) {
  const listener = Deno.listen({ port: port });
  if (DEBUG) console.log(`Now listening on localhost:${port}/`);
  for await (const conn of listener) {
    serveHttp(conn);
  }
}
