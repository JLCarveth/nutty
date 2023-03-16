/**
 * A barebones example of using Zippy
 */
const DEBUG = Deno.env.get("DEBUG") ?? false;
const PORT = Number.parseInt(<string> Deno.env.get("PORT")) ?? 1998;
const VERSION = "0.10.9c";
import { get, listen } from "./server.ts";

// First, we will register routes
get("/users/:id", (req, _path, params) => {
  if (DEBUG) {
    console.log(
      JSON.stringify({
        "path": "/users/:id",
        "action": req.method,
        "params": JSON.stringify(params),
      }),
    );
  }
  const id = params?.id;
  return new Response(`User ${id}`);
});

get("/api/version", () => {
  return new Response(VERSION);
});

/**
 * Serving HTML is trivial
 */
get("/", () => {
  const content =
    "<html><head><title>Hello World!</title></head><body><p>Hello World, from <b>Zippy!</b></p></body></html>";
  const headers = new Headers();
  headers.append("Content-Type", "text/html");
  return new Response(content, { "headers": headers });
});

// Then, we will listen for incoming connections (start the server)
listen(PORT);