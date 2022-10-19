/**
 * Zippy - A dead-simple HTTP server similar to Express.js for the
 * Deno runtime.
 *
 * TODOs:
 *  - Worker Support
 *  - Support GET, POST, PUT, DELETE, HEAD
 *  - Debug logging
 *  - HTML rendering
 *
 * 
 * @author John L. Carveth <jlcarveth@gmail.com>
 * @version 0.1.0
 *
*/
const DEBUG = Deno.env.get('DEBUG') ?? false;
const PORT = Number.parseInt(<string>Deno.env.get('PORT')) ?? 1998;
const server = Deno.listen({ port: PORT });

import { Route } from "./route.ts";

/* Routes registered on the server. */
const routes: Route[] = [];
/* The route currently being processed by the server */
let currentRoute: Route;

/**
 * Assigns a new GET Route
 * @param path The path the route responds to
 * @param handler
 */
export function get(
  path: string,
  handler: (request: Request, response: Response) => Response
) {
  const urlPattern = new URLPattern({ pathname: path });
  routes.push({ path: urlPattern, action: "GET", handler: handler });
}

/**
 *  An example of a GET request w/ params
 */
get("/users/:id", (req, res): Response => {
  const match = currentRoute.path.exec(req.url);
  const id = match?.pathname.groups.id;
  return new Response(`User #${id}`, { status: 200 });
});

/**
 * Proof that routes do not overwrite eachother, even with the same root url 
 */
get("/users/:id/posts", (req, res): Response => {
  const match = currentRoute.path.exec(req.url);
  const id = match?.pathname.groups.id;
  return new Response(`User #${id}/posts`);
});

/**
 *  An example of serving HTML to a GET request
 */
get("/", (req, res) => {
  const content =
      "<html><head><title>Hello World!</title></head><body><p>Hello World, from <b>Zippy!</b></p></body></html>";
  let headers = new Headers();
  headers.append("Content-Type", "text/html");
  return new Response(content, {'headers' : headers});
});

for await (const conn of server) {
  serveHttp(conn);
}

async function serveHttp(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);

  for await (const requestEvent of httpConn) {
    const method = requestEvent.request.method;
    const path = requestEvent.request.url;

    for (const route of routes) {
      console.log(route, path);
      if (route.action === method && route.path.test(path)) {
        currentRoute = route;
        const response = route.handler(requestEvent.request, new Response());
        requestEvent.respondWith(
          // handler returns a Response obj
          response
        );
        continue;
      }
    }
  }
}
