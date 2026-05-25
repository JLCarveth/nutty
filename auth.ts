/**
 * Utility class for implementing authentication functionality
 */
const SECRET_KEY = Deno.env.get("SECRET_KEY");
if (!SECRET_KEY) {
  console.error("SECRET_KEY is not set. Set it in your environment or .env file.");
  Deno.exit(1);
}

const encoder = new TextEncoder();
const keyBuf = encoder.encode(SECRET_KEY);

const KEY = await crypto.subtle.importKey(
  "raw",
  keyBuf,
  {
    name: "HMAC",
    hash: "SHA-512",
  },
  true,
  ["sign", "verify"],
);

import { createHmac, randomBytes } from "node:crypto";
import {
  create,
  verify as verifyToken,
} from "@zaubrik/djwt";

export async function generateToken(payload: Record<string, unknown>) {
  return await create({ alg: "HS512", typ: "JWT" }, payload, KEY);
}

export async function verify(token: string) {
  return await verifyToken(token, KEY);
}

export function salt() {
  return randomBytes(32).toString("base64");
}

export function hash(value: string) {
  return saltedHash(value, salt());
}

export function saltedHash(value: string, salt: string) {
  const hash = createHmac("sha512", salt).update(value).digest("base64");
  return `${hash}:${salt}`;
}

/**
 * Compare a plaintext password to a hash:salt
 */
export function compare(password: string, hash: string) {
  const salt = hash.split(":")[1];
  return saltedHash(password, salt) === hash;
}

