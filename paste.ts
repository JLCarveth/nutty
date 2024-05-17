/**
 * A Pastebin-like backend using Zippy
 *
 * @author John L. Carveth <jlcarveth@gmail.com>
 * @version 1.12.1
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
import { verify } from "./auth.ts";
import { SQLiteService as service } from "./db.ts";
import { highlightText } from "https://deno.land/x/speed_highlight_js@v1.2.6/dist/index.js";
import { detectLanguage } from "https://deno.land/x/speed_highlight_js@v1.2.6/dist/detect.js";

import { Layout, LayoutData } from "./templates/layout.ts";
import { Index } from "./templates/index.ts";
import { Login } from "./templates/login.ts";
import { Register } from "./templates/register.ts";
import { _404 } from "./templates/404.ts";
import { Burn } from "./templates/burn.ts";
import { About } from "./templates/about.ts";

const SQLiteService = service.getInstance();
const TARGET_DIR = Deno.env.get("TARGET_DIR") || "/opt/paste/";
const BASE_URL = Deno.env.get("BASE_URL");
const PUBLIC_PASTES = Deno.env.get("PUBLIC_PASTES") || false;
const MAX_SIZE = Number(Deno.env.get("MAX_SIZE")) || 1e6;
const DOMAIN = Deno.env.get("DOMAIN");

export const PORT = Number.parseInt(<string> Deno.env.get("PORT") ?? 5335);
export const version = "1.12.1";

function getCookieValue(cookieString: string, cookieName: string) {
  const cookies = cookieString.split("; ");
  for (let i = 0; i < cookies.length; i++) {
    const cookieParts = cookies[i].split("=");
    if (cookieParts[0] === cookieName) {
      return cookieParts[1];
    }
  }
  return null;
}

function serveIndex() {
  const data: LayoutData = {
    title: "Paste.ts",
    content: Index(),
    version,
    scripts: [
      `<script src="/js/login-check.js" type="module"></script>`,
      `<script src="/js/recent-posts.js" type="module"></script>`,
    ],
  };
  return new Response(Layout(data), {
    headers: { "Content-Type": "text/html" },
  });
}

function serveAbout() {
  const data: LayoutData = {
    title: "About Paste.ts",
    content: About(),
    version,
    stylesheets: [`<link rel="stylesheet" href="/css/about.css"/>`],
    scripts: [
      `<script src="/js/login-check.js" type="module"></script>`,
    ],
  };

  return new Response(Layout(data), {
    headers: { "Content-Type": "text/html" },
  });
}

/* Serve HTML webpages */
get("/index.html", serveIndex);
get("/", serveIndex);
get("/about", serveAbout);
get("/login", () => {
  const data: LayoutData = {
    title: "Paste.ts",
    content: Login(),
    version,
  };
  return new Response(Layout(data), {
    headers: { "Content-Type": "text/html" },
  });
});
get("/register", () => {
  const data: LayoutData = {
    title: "Paste.ts",
    content: Register(),
    version,
  };

  return new Response(Layout(data), {
    headers: { "Content-Type": "text/html" },
  });
});

get("/burn/:uuid", (req, _path, params) => {
  const filename = params?.uuid;
  if (!filename) return new Response("Bad Request", { status: 400 });

  const data: LayoutData = {
    title: "Paste.ts",
    version,
    content: Burn(`${DOMAIN}/paste/${filename}`),
    scripts: [
      '<script src="/js/login-check.js" type="module"></script>',
      '<script src="/js/burnable-clip.js" type="module"></script>',
    ],
  };

  return new Response(Layout(data), {
    headers: { "Content-Type": "text/html" },
  });
});

get("/paste/:uuid", async (req, _path, params) => {
  const filename = params?.uuid;
  const cookie = getCookieValue(req.headers.get("Cookie") ?? "", "token");
  const token = req.headers.get("X-Access-Token") || cookie;

  if (!filename) return new Response("Bad Request", { status: 400 });

  /* Before checking token, see if a public paste w/ this UUID exists */
  if (PUBLIC_PASTES) {
    try {
      await Deno.lstat(`${TARGET_DIR}/public/${filename}`);
      const text = await Deno.readTextFile(`${TARGET_DIR}/public/${filename}`);
      const language = detectLanguage(text);
      const highlighted = await highlightText(text, language, false);

      const data: LayoutData = {
        title: "Paste.ts",
        content:
          `<div class="code-block" id="code-block"><pre><code>${highlighted}</code></pre><button class="copy" id="copy"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-copy" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"></path>
</svg></button></div>`,
        version,
        stylesheets: ['<link rel="stylesheet" href="/css/highlight.css"/>'],
        scripts: [
          '<script src="/js/login-check.js" type="module"></script>',
          '<script src="/js/clipboard.js" type="module"></script>',
        ],
      };

      /* Check if burnable, delete file if so */
      if (SQLiteService.isBurnable(filename)) {
        await Deno.remove(`${TARGET_DIR}/public/${filename}`);
        SQLiteService.removeBurnable(filename);
      }

      return new Response(Layout(data), {
        headers: { "Content-Type": "text/html" },
      });
    } catch (_err) {
      /* Public paste not found, continue checking authentication */
    }
  }

  if (!token) {
    /* No token provided, PUBLIC_PASTES is either false or no public paste was found */
    return new Response("Unauthorized", { status: 401 });
  }

  let uuid = "";
  try {
    const payload = await verify(token);
    uuid = payload.userid as string;
  } catch (_err) {
    /* Invalid / Expired token was provided */
    return new Response("Unauthorized", { status: 401 });
  }

  /* Check that the directory exists */
  try {
    await Deno.lstat(`${TARGET_DIR}/${uuid}/${filename}`);
    const text = await Deno.readTextFile(`${TARGET_DIR}/${uuid}/${filename}`);
    const language = detectLanguage(text);
    const highlighted = await highlightText(text, language, false);

    const data: LayoutData = {
      title: "Paste.ts",
      content:
        `<div class="code-block"><pre><code>${highlighted}</code></pre><button class="copy">Copy to Clipboard</button></div>`,
      version,
      stylesheets: ['<link rel="stylesheet" href="/css/highlight.css"/>'],
      scripts: ['<script src="/js/login-check.js" type="module"></script>'],
    };
    /* Check if burnable, delete file if so */
    if (SQLiteService.isBurnable(filename)) {
      await Deno.remove(`${TARGET_DIR}/${uuid}/${filename}`);
      SQLiteService.removeBurnable(filename);
    }

    return new Response(Layout(data), {
      headers: { "Content-Type": "text/html" },
    });
  } catch (_err) {
    return new Response("Not Found", { status: 404 });
  }
});

/**
 * Serve static CSS files
 * @function
 * @name GET-/css/*
 * @memberof nutty
 * @returns the requested CSS file, or an HTTP error
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

  /* Check for existence of params[0] within /static/css/ */
  try {
    await Deno.lstat(filepath);
  } catch (_err) {
    return new Response("Not found.", { status: 404 });
  }

  try {
    const css = await Deno.readTextFile(filepath);
    return new Response(css, { headers: { "Content-Type": "text/css" } });
  } catch (_err) {
    return new Response("Server Error", { status: 500 });
  }
});

/**
 * Serve static JS files
 * @function
 * @name GET-/js/*
 * @memberof nutty
 * @returns the requested file, or an HTTP error
 */
get("/js/*", async (_req, _path, params) => {
  if (!params) return new Response("Bad Request", { status: 400 });

  const filepath = `static/js/${params[0]}`;
  const resolvedPath = resolve(Deno.cwd(), filepath);

  /* Ensure the requested file is contained within the static directory */
  if (!resolvedPath.startsWith(`${Deno.cwd()}${SEP}static${SEP}js`)) {
    return new Response("Bad Request", { status: 400 });
  }

  /* Check for existence of params[0] within static/js */
  try {
    await Deno.lstat(filepath);
  } catch (_err) {
    return new Response("Not Found", { status: 404 });
  }

  /* Finally, serve the file */
  try {
    const js = await Deno.readTextFile(filepath);
    return new Response(js, { headers: { "Content-Type": "text/javascript" } });
  } catch (_err) {
    return new Response("Server Error", { status: 500 });
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
  if (req.headers.get("Content-Type")?.includes("x-www-form-urlencoded")) {
    const query = await req.text();
    const params = new URLSearchParams(query);
    body = {
      email: params.get("email"),
      password: params.get("password"),
    };
  } else {
    body = await req.json();
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
    const headers = {
      "Set-Cookie": `token=${token}; Max-Age=86400; Path=/`,
    };

    if (req.headers.get("Accept")?.includes("text/html")) {
      headers["Location"] = `/`;
      return new Response(token, { headers, status: 302 });
    }
    return new Response(token, { headers });
  } catch (_err) {
    if (req.headers.get("Content-Type")?.includes("x-www-form-urlencoded")) {
      const headers = { "Location": "/login#failed" };
      return new Response(null, { headers, status: 302 });
    }
    return new Response("Unauthorized", { status: 401 });
  }
});

/**
 * Removes any existing tokens stored as a cookie
 * @function
 * @name POST-/api/logout
 * @memberof nutty
 * @returns A 302 redirect
 */
post("/api/logout", (_req, _path, _params) => {
  const headers = {
    "Set-Cookie": `token=""; Max-Age=0; Path=/`,
    "Location": "/",
  };

  return new Response(null, { status: 302, headers });
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
  let body;
  if (req.headers.get("Content-Type")?.includes("x-www-form-urlencoded")) {
    const query = await req.text();
    const params = new URLSearchParams(query);
    body = {
      email: params.get("email"),
      password: params.get("password"),
    };
  } else {
    body = await req.json();
  }

  const email = body.email;
  const password = body.password;

  if (!email || !password) {
    return new Response("Missing parameters", { status: 400 });
  }

  try {
    const uuid = SQLiteService.register(email, password);

    if (req.headers.get("Accept")?.includes("text/html")) {
      const headers = { "Location": "/login" };
      return new Response(null, { headers, status: 302 });
    }

    return new Response(uuid);
  } catch (err) {
    if (err.message === "UNIQUE constraint failed: users.email") {
      return new Response("Conflict", { status: 409 });
    }
    return new Response("Server Error", { status: 500 });
  }
});

/**
 * Allows the client to check the validity of their login token
 * @function
 * @name GET-/api/auth/status
 * @memberof nutty
 * @returns {string} 200 OK if the token is valid, 401 Unauthorized if not.
 */
get("/api/auth/status", async (req, _path, _params) => {
  const cookie = getCookieValue(req.headers.get("Cookie") ?? "", "token");
  const token = req.headers.get("X-Access-Token") || cookie;

  if (!token) return new Response("Unauthorized", { status: 401 });
  try {
    // verify() throws an error if token is invalid
    await verify(token);
    return new Response("OK", { status: 200 });
  } catch (_err) {
    return new Response("Unauthorized", { status: 401 });
  }
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
  const contentLength = req.headers.get("Content-Length");

  if (contentLength && Number(contentLength) > MAX_SIZE) {
    return new Response("Payload too large.", { status: 413 });
  }
  const filename = crypto.randomUUID();
  const cookie = getCookieValue(req.headers.get("Cookie") ?? "", "token");
  const token = req.headers.get("X-Access-Token") || cookie;

  const accepts = req.headers.get("Accept");
  const contentType = req.headers.get("Content-Type");
  const html = (accepts !== null) ? accepts.includes("text/html") : false;

  let text;

  /* Add the UUID to the burn_on_read table if param set */
  let burn;

  if (contentType) {
    if (contentType.includes("application/x-www-form-urlencoded") && html) {
      const formData = await req.formData();
      text = formData.get("text") as string;
      burn = formData.get("burn") as string;
    } else {
      text = await req.text();
      const queryParams = new URL(req.url).searchParams;
      burn = queryParams.get("burn");
    }
  }
  if (burn) {
    console.log(`BURN`);
    SQLiteService.createBurnable(filename);
  }

  const data = (new TextEncoder()).encode(text);

  if (!token) {
    if (!PUBLIC_PASTES) {
      return new Response(
        "Unauthorized",
        {
          status: 401,
        },
      );
    } else {
      await Deno.writeFile(`${TARGET_DIR}/public/${filename}`, data);
      if (accepts !== null && accepts.includes("text/html")) {
        return new Response(null, {
          status: 302,
          headers: {
            "Location": (burn ? `/burn/${filename}` : `/paste/${filename}`),
          },
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
    return new Response("Unauthorized", { status: 401 });
  }

  await Deno.mkdir(`${TARGET_DIR}/${uuid}`, { recursive: true });
  await Deno.writeFile(`${TARGET_DIR}/${uuid}/${filename}`, data);

  if (accepts !== null && accepts.includes("text/html")) {
    return new Response(null, {
      status: 302,
      headers: {
        "Location": (burn ? `/burn/${filename}` : `/paste/${filename}`),
      },
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
  const cookie = getCookieValue(req.headers.get("Cookie") ?? "", "token");
  const token = req.headers.get("X-Access-Token") || cookie;

  if (token) {
    let uuid = "";
    try {
      const payload = await verify(token);
      uuid = payload.userid as string;
    } catch (_err) {
      return new Response("Unauthorized", { status: 401 });
    }

    /* Check that directory exists */
    try {
      await Deno.lstat(`${TARGET_DIR}/${uuid}`);
    } catch (_err) {
      return new Response(JSON.stringify([]));
    }

    const files = [];
    for await (const filename of Deno.readDir(`${TARGET_DIR}/${uuid}`)) {
      files.push(filename.name);
    }
    return new Response(JSON.stringify(files));
  } else {
    /* Return top 5 most recent public pastes, if PUBLIC_PASTES=1 */
    if (!PUBLIC_PASTES) {
      return new Response("Unauthorized", { status: 401 });
    }

    const publicFiles = [];
    let recentFiles = [];
    try {
      const publicDir = `${TARGET_DIR}/public`;

      for await (const dirEntry of Deno.readDir(publicDir)) {
        const file = await Deno.stat(`${publicDir}/${dirEntry.name}`);
        file.name = dirEntry.name;
        publicFiles.push(file);
      }

      recentFiles = publicFiles.sort((a, b) => {
        return b.mtime!.getTime() - a.mtime!.getTime();
      }).slice(0, 5);
    } catch (_err) {
      return new Response("Server Error", { status: 500 });
    }
    return new Response(JSON.stringify(recentFiles.map((item) => item.name)));
  }
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
  const cookie = getCookieValue(req.headers.get("Cookie") ?? "", "token");
  const token = req.headers.get("X-Access-Token") || cookie;
  let userid = "";

  if (!token) return new Response("Unauthorized");
  try {
    const payload = await verify(token);
    userid = payload.userid as string;
  } catch (_err) {
    return new Response("Unauthorized");
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
  const cookie = getCookieValue(req.headers.get("Cookie") ?? "", "token");
  const token = req.headers.get("X-Access-Token") || cookie;

  if (!filename) return new Response("Bad Request", { status: 400 });

  let uuid = "";
  // Before checking token, look in TARGET_DIR/public for the uuid
  try {
    await Deno.lstat(`${TARGET_DIR}/public/${filename}`);
    const response = await serveFile(req, TARGET_DIR + "/public/" + filename);

    /* Check if burnable, delete file if so */
    if (SQLiteService.isBurnable(filename)) {
      await Deno.remove(`${TARGET_DIR}/public/${filename}`);
      SQLiteService.removeBurnable(filename);
    }
    return response;
  } catch (_err) {
    // File not found in  public/, continue with authentication
  }
  if (!token) return new Response("Unauthorized", { status: 401 });
  try {
    const payload = await verify(token);
    uuid = payload.userid as string;
  } catch (_err) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await Deno.lstat(`${TARGET_DIR}/${uuid}/${filename}`);
  } catch (_err) {
    return new Response("Not Found", { status: 404 });
  }
  const response = serveFile(req, TARGET_DIR + "/" + uuid + "/" + filename);
  /* Check if burnable, delete file if so */
  if (SQLiteService.isBurnable(filename)) {
    await Deno.remove(`${TARGET_DIR}/${uuid}/${filename}`);
    SQLiteService.removeBurnable(filename);
  }

  return response;
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
  const cookie = getCookieValue(req.headers.get("Cookie") ?? "", "token");
  const token = req.headers.get("X-Access-Token") || cookie;
  if (!token) return new Response("Unauthorized", { status: 401 });
  let userID = "";
  try {
    const payload = await verify(token);
    userID = payload.userid as string;
  } catch (_err) {
    return new Response("Unauthorized", { status: 401 });
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
      return new Response("Not Found", { status: 404 });
    }
    return new Response("An unexpected error has occurred.", { status: 500 });
  }
  return new Response("OK");
});

/* A catch-all 404 page if no other route matches. */
get("*", () => {
  const data: LayoutData = {
    title: "Not Found",
    content: _404(),
    version,
  };
  return new Response(Layout(data), {
    headers: { "Content-Type": "text/html" },
  });
});

listen(PORT);
