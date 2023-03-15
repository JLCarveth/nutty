/**
 * A Pastebin-like backend using Zippy
 *
 * @author John L. Carveth <jlcarveth@gmail.com>
 * @version 0.1.0
 *
 * 2023-03-10
 */
import { get, listen, post } from "./server.ts";
import { serveFile } from "https://deno.land/std@0.179.0/http/file_server.ts";

const PORT = Number.parseInt(<string> Deno.env.get("PORT") ?? 5335);
const SECRET_KEY = Deno.env.get("SECRET_KEY") || "__NOKEY__";
const TARGET_DIR = Deno.env.get("TARGET_DIR") || "/opt/paste/";

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
  if (!token || token !== SECRET_KEY) {
    return new Response(
      "Missing or invalid secret key..." + token,
      {
        status: 401,
      },
    );
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  await Deno.writeFile(`${TARGET_DIR}/${filename}`, data);
  return new Response(filename);
});

get("/api/:uuid", async (req, _path, params) => {
  const filename = params?.uuid;
  try {
    await Deno.lstat(`${TARGET_DIR}/${filename}`);
  } catch (_err) {
    // File doesn't exist
    return new Response("File not found.", { status: 404 });
  }
  return serveFile(req, TARGET_DIR + "/" + filename);
});

listen(PORT);
