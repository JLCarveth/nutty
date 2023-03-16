/**
 * A Pastebin-like backend using Zippy
 *
 * @author John L. Carveth <jlcarveth@gmail.com>
 * @version 0.2.0
 *
 * 2023-03-10
 */
import { get, listen, post } from "./server.ts";
import { serveFile } from "https://deno.land/std@0.179.0/http/file_server.ts";
import { SQLiteService as service, verify } from "./auth.ts";
const SQLiteService = service.getInstance();
const PORT = Number.parseInt(<string> Deno.env.get("PORT") ?? 5335);
const TARGET_DIR = Deno.env.get("TARGET_DIR") || "/opt/paste/";

/**
 * POST /api/login
 * Expects `uuid` and `password` fields in the post body.
 * Returns a jsonwebtoken on success
 */
post("/api/login", async (req, _path, _params) => {
  const body = await req.json();
  const uuid = body.userid;
  const password = body.password;

  if (!uuid || !password) {
    return new Response("Invalid request. Missing parameters.", {
      status: 400,
    });
  }
  try {
    const token = await SQLiteService.login(uuid, password);
    return new Response(token);
  } catch (err) {
    return new Response(err.message, { status: 401 });
  }
});
/**
 * POST /register - Register for a new account with the given password.
 * A UUID is generated and returned upoon success, and is used to subsequently login.
 */
post("/api/register", async (req, _path, _params) => {
  const body = await req.json();
  const password = body.password;

  if (!password) return new Response("Missing parameters", { status: 400 });
  const uuid = SQLiteService.register(password);
  return new Response(uuid);
});

/**
 * POST /api/paste
 * Expects the SECRET_KEY to be provided via X-Access-Token header.
 * Creates a new file on the filesystem, writes the POST body to the file,
 * and returns a UUID filename on success.
 */
post("/api/paste", async (req, _path, _params) => {
  const filename = crypto.randomUUID();
  const token = req.headers.get("X-Access-Token");
  const text = await req.text();
  if (!token) {
    return new Response(
      "Missing or invalid secret key...",
      {
        status: 401,
      },
    );
  }
  let uuid = "";
  try {
    const payload = await verify(token);
    uuid = payload.userid as string;
  } catch (_err) {
    return new Response("Could not verify token", { status: 401 });
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  await Deno.mkdir(`${TARGET_DIR}/${uuid}`, { recursive: true });
  await Deno.writeFile(`${TARGET_DIR}/${uuid}/${filename}`, data);
  return new Response(filename);
});

get("/api/:uuid", async (req, _path, params) => {
  const filename = params?.uuid;
  const token = req.headers.get("X-Access-Token");
  let uuid = "";
  if (!token) return new Response("Invalid or missing token");
  try {
    const payload = await verify(token);
    uuid = payload.userid as string;
  } catch (_err) {
    return new Response("Invalid or missing token.");
  }
  try {
    await Deno.lstat(`${TARGET_DIR}/${uuid}/${filename}`);
  } catch (_err) {
    // File doesn't exist
    return new Response("File not found.", { status: 404 });
  }
  return serveFile(req, TARGET_DIR + "/" + uuid + "/" + filename);
});

listen(PORT);
