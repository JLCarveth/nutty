/**
 * This test file is meant to be run by the bash script runtests.sh,
 * it is not meant to be run standalone using `deno test`, since these
 * are end-to-end tests and require the paste.ts service to be running.
 *
 * @author John L. Carveth <jlcarveth@gmail.com>
 * @date 2023-12-14
 */
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.209.0/assert/mod.ts";
import { verify } from "./auth.ts";

const baseURL = Deno.env.get("BASE_URL");

const uuidRegex =
  /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

let token = "";

/**
 * Test #1 - Simple Registration
 */
Deno.test("Simple Registration", async () => {
  const body = {
    email: "test@mail.com",
    password: "password",
  };

  const resp = await fetch(`${baseURL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    throw Error(
      `Error making registration request. ${resp.status} ${resp.statusText}`,
    );
  }

  /* Response should be a UUID */
  const uuid = await resp.text();
  assert(uuidRegex.test(uuid), `Returned value ${uuid} is not a valid UUIDv4`);
});

/**
 * Test #2 - Registration with an already-used email address
 */
Deno.test("Registration with taken email address", async () => {
  const body = {
    email: "test@mail.com",
    password: "password",
  };

  const resp = await fetch(`${baseURL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  /* Must consume the response body */
  const _text = await resp.text();

  if (!resp.ok) {
    return assertEquals(
      resp.statusText,
      "Conflict",
      `Unexpected response from the server. Expected 'Conflict', recieved ${resp.statusText}`,
    );
  }

  throw new Error(`Unexpected Response. ${resp.statusText}`);
});

/**
 * Test #3 - Simple Login test
 */
Deno.test("Simple login request", async () => {
  const body = {
    email: "test@mail.com",
    password: "password",
  };

  const resp = await fetch(`${baseURL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    throw new Error(`Unexpected Response: ${resp.status} ${resp.statusText}`);
  }

  token = await resp.text();
  assert(await verify(token), "Token could not be verified.");
});

/**
 * Test #4 - Test an invalid login
 */
Deno.test("Invalid login credentials", async () => {
  const body = {
    email: "bad@mail.com",
    password: "password",
  };

  const resp = await fetch(`${baseURL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await resp.text();
  if (!resp.ok) {
    assertEquals(
      resp.status,
      401,
      `Unexpected response status code. Expected 401, received ${resp.status}`,
    );
    assertEquals(
      text,
      "Unauthorized",
      `Unexpected response text. Expected 'Unauthorized', received ${text}`,
    );

    return;
  }
});

/**
 * Test #5 - Making a public paste
 */
Deno.test("Making a public paste", async () => {
  const PUBLIC = Deno.env.get("PUBLIC_PASTES");
  const body = "Hello, World!";

  const response = await fetch(`${baseURL}/paste`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: body,
  });

  if (!response.ok) {
    if (!PUBLIC) {
      assertEquals(
        response.status,
        401,
        `Unexpected HTTP status, expected 401, recieved ${response.status}`,
      );
      return;
    }

    throw new Error(`Unexpected Error: ${response.status} ${response.statusText}`);
  }

  const uuid = await response.text();
  assert(uuidRegex.test(uuid), `Returned value ${uuid} is not a valid UUIDv4`);
});

Deno.test("Validating a token", async () => {
  const resp = await fetch(`${baseURL}/auth/status`, {
    headers: { "X-Access-Token" : token },
  });

  if (!resp.ok) {
    throw new Error(`Couldn't verify token.`);
  }

  const text = await resp.text();
  assertEquals(text, "OK", `Unexpected response, expected 'OK', recieved ${text}`);
});
