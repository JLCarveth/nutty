/**
 * A Pastebin-like backend using Zippy
 *
 * @author John L. Carveth <jlcarveth@gmail.com>
 * @version 1.0.0
 * @namespace nutty
 *
 * Provides basic authentication via /api/login and /api/register routes.
 * Tokens are provided with the "X-Access-Token" header
 * Post a text file to /api/paste and a UUID is returned on success.
 * GET /api/:uuid to retrieve that text file.
 * GET /api/paste to return the UUIDs of all stored pastes
 */
import { addRoute, get, listen, post } from "./server.ts";
import {
  extname,
  resolve,
  SEP,
} from "https://deno.land/std@0.202.0/path/mod.ts";
import { serveFile } from "https://deno.land/std@0.179.0/http/file_server.ts";
import { template as index } from "./templates/index.ts";
import { template as login } from "./templates/login.ts";
import { SQLiteService as service, verify } from "./auth.ts";

const SQLiteService = service.getInstance();
const TARGET_DIR = Deno.env.get("TARGET_DIR") || "/opt/paste/";
const BASE_URL = Deno.env.get("BASE_URL");
const DOMAIN = Deno.env.get("DOMAIN");
const PUBLIC_PASTES = Deno.env.get("PUBLIC_PASTES") || false;

export const PORT = Number.parseInt(<string> Deno.env.get("PORT") ?? 5335);
export const version = "1.1.2";

function getCookieValue(cookieString, cookieName) {
  let cookies = cookieString.split("; ");
  for (let i = 0; i < cookies.length; i++) {
    let cookieParts = cookies[i].split("=");
    if (cookieParts[0] === cookieName) {
      return cookieParts[1];
    }
  }
  return null;
}

function serveIndex() {
  return new Response(index({ version }), {
    headers: { "Content-Type": "text/html" },
  });
}

/* Serve HTML webpages */
get("/index.html", serveIndex);
get("/", serveIndex);
get("/login", () => {
  return new Response(login({ version }), {
    headers: { "Content-Type": "text/html" },
  });
});

/**
 * Serve static CSS files...
 */
get("/css/*", async (_req, _path, params) => {
  if (!params) return new Response("Bad Request", { status: 400 });

  const filepath = `static/css/${params[0]}`;
  const resolvedPath = resolve(Deno.cwd(), filepath);

  /* Ensure the requested file is contained within the static directory */
  if (!resolvedPath.startsWith(`${Deno.cwd()}${SEP}static${SEP}css`)) {
    return new Response("Bad Request", { status: 400 });
  }

  /* Ensure the file has a .css extension to prevent serving non-css files */
  if (extname(resolvedPath) !== ".css") {
    return new Response("Bad Request", { status: 400 });
  }

  /* Check for existance of params[0] within /static/css/ */
  try {
    await Deno.lstat(filepath);
  } catch (_err) {
    return new Response("File not found.", { status: 400 });
  }

  try {
    const css = await Deno.readTextFile(filepath);
    return new Response(css, { headers: { "Content-Type": "text/css" } });
  } catch (_err) {
    return new Response("Error reading CSS file...", { status: 500 });
  }
});

/**
 * Authenticate with the API to recieve an access token
 * @function
 * @name POST-/api/login
 * @memberof nutty
 * @param {string} uuid - the UUID that was obtained through registration
 * @param {string} password - the valid password for the account
 * @returns {string} a jsonwebtoken on success
 */
post("/api/login", async (req, _path, _params) => {
  let body;
  try {
    body = await req.json();
  } catch (_err) {
    return new Response("Bad Request", { status: 400 });
  }
  const email = body.email;
  const password = body.password;

  if (!email || !password) {
    return new Response("Invalid request. Missing parameters.", {
      status: 400,
    });
  }
  try {
    const token = await SQLiteService.login(email, password);
    return new Response(token, {
      headers: {
        "Set-Cookie":
          `token=${token}; Max-Age=86400; HttpOnly; Domain=${DOMAIN};`,
      },
    });
  } catch (err) {
    return new Response(err.message, { status: 401 });
  }
});

/**
 * Registers a new account
 * @function
 * @name POST-/api/regiser
 * @memberof nutty
 * @param {string} password - the valid password for the account
 * @returns {string} a UUID
 */
post("/api/register", async (req, _path, _params) => {
  const body = await req.json();
  const email = body.email;
  const password = body.password;

  if (!email || !password) {
    return new Response("Missing parameters", { status: 400 });
  }
  const uuid = SQLiteService.register(email, password);
  return new Response(uuid);
});

/**
 * Stores the provided text file on the filesystem, and returns a UUID to the client
 * for later access.
 * @function
 * @name POST-/api/paste
 * @memberof nutty
 * @param {string} text - the text content to be stored
 * @returns {string} a UUID identifying the new paste
 */
post("/api/paste", async (req, _path, _params) => {
  const filename = crypto.randomUUID();
  const cookie = getCookieValue(req.headers.get("Cookie"), "token");
  const token = req.headers.get("X-Access-Token") || cookie;

  const accepts = req.headers.get("Accept");
  const contentType = req.headers.get("Content-Type");
  const html = (accepts !== null) ? accepts.includes("text/html") : false;

  let text;

  if (contentType) {
    if (contentType.includes("application/x-www-form-urlencoded") && html) {
      const formData = await req.formData();
      text = formData.get("text") as string;
    } else {
      text = await req.text();
    }
  }

  const data = (new TextEncoder()).encode(text);

  if (!token) {
    if (!PUBLIC_PASTES) {
      return new Response(
        "Missing or invalid token...",
        {
          status: 401,
        },
      );
    } else {
      await Deno.writeFile(`${TARGET_DIR}/public/${filename}`, data);
      if (accepts !== null && accepts.includes("text/html")) {
        return new Response(null, {
          status: 302,
          headers: { "Location": `/api/${filename}` },
        });
      }
      return new Response(filename);
    }
  }

  let uuid = "";
  try {
    const payload = await verify(token);
    uuid = payload.userid as string;
  } catch (_err) {
    return new Response("Could not verify token", { status: 401 });
  }

  await Deno.mkdir(`${TARGET_DIR}/${uuid}`, { recursive: true });
  await Deno.writeFile(`${TARGET_DIR}/${uuid}/${filename}`, data);

  if (accepts !== null && accepts.includes("text/html")) {
    return new Response(null, {
      status: 302,
      headers: { "Location": `/api/${filename}` },
    });
  }
  return new Response(filename);
});

/**
 * Returns an array of UUIDs of all pastes belonging to the user
 * @function
 * @name GET-/api/paste
 * @memberof nutty
 * @returns {Array} an array of UUIDs associated to pastes
 */
get("/api/paste", async (req, _path, _params) => {
  const token = req.headers.get("X-Access-Token");
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

  const files = [];
  for await (const filename of Deno.readDir(`${TARGET_DIR}/${uuid}`)) {
    files.push(filename.name);
  }
  return new Response(JSON.stringify(files));
});

/**
 * Returns the current version of Nutty
 * @function
 * @name GET-/api/version
 * @memberof nutty
 * @returns {string} the current version of Nutty
 */
get("/api/version", (_req, _path, _params) => {
  return new Response(version);
});

/**
 * Symlinks a paste to the public folder, allowing it to be accessed by anyone
 * without a login token.
 * TODO: Is GET the best method for this route? PUT instead?
 * TODO: What if paste is already public?
 * @function
 * @name GET-/api/share/:uuid
 * @param {string} uuid - the uuid of the paste to be made public
 * @memberof nutty
 * @returns {string} the a URL pointing to the public paste
 */
get("/api/share/:uuid", async (req, _path, params) => {
  const uuid = params?.uuid;
  const token = req.headers.get("X-Access-Token");
  let userid = "";

  if (!token) return new Response("Missing or invalid token.");
  try {
    const payload = await verify(token);
    userid = payload.userid as string;
  } catch (_err) {
    return new Response("Missing or invalid token.");
  }

  // check if file exists
  try {
    await Deno.lstat(`${TARGET_DIR}/${userid}/${uuid}`);
  } catch (_err) {
    return new Response("File not found.");
  }

  //File exists, create symlink
  await Deno.symlink(
    `${TARGET_DIR}/${userid}/${uuid}`,
    `${TARGET_DIR}/public/${uuid}`,
  );
  // Return https://api.jlcarveth.dev/api/:uuid
  return new Response(`${BASE_URL}/${uuid}`);
});

// Dynamic URLs have to be matched last
/**
 * Returns the paste with the given UUID, if the user has access/the paste is public.
 * @function
 * @name GET-/api/:uuid
 * @param {string} uuid - the uuid of the paste to retrieve
 * @memberof nutty
 * @returns {string} the contents of the paste with given UUID
 */
get("/api/:uuid", async (req, _path, params) => {
  const filename = params?.uuid;
  const token = req.headers.get("X-Access-Token");
  let uuid = "";
  // Before checking token, look in TARGET_DIR/public for the uuid
  try {
    await Deno.lstat(`${TARGET_DIR}/public/${filename}`);
    // File does exist, return it.
    return serveFile(req, TARGET_DIR + "/public/" + filename);
  } catch (_err) {
    // File not found in  public/, continue with authentication
  }
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

/**
 * Removes the paste with the given UUID, if the user has access.
 * @function
 * @name DELETE-/api/:uuid
 * @param {string} uuid - the uuid of the paste to remove
 * @memberof nutty
 * @returns {string} OK
 */
addRoute("/api/:uuid", "DELETE", async (req, _path, params) => {
  const token = req.headers.get("X-Access-Token");
  if (!token) return new Response("Invalid or missing token");
  let userID = "";
  try {
    const payload = await verify(token);
    userID = payload.userid as string;
  } catch (_err) {
    return new Response("Invalid or missing token");
  }

  const uuid = params?.uuid;
  // Try to remove public/uuid if it exists
  try {
    await Deno.remove(`${TARGET_DIR}/public/${uuid}`);
  } catch (_err) {
    // Do nothing, symlink not found
  }
  try {
    await Deno.remove(`${TARGET_DIR}/${userID}/${uuid}`);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return new Response("File not found.");
    }
    return new Response("An unexpected error has occurred.", { status: 500 });
  }
  return new Response("OK");
});

listen(PORT);
