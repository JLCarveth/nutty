/**
 * Utility class for implementing authentication functionality
 */
const SECRET_KEY = Deno.env.get("SECRET_KEY") || "__NOKEY__";
const KEY = await crypto.subtle.generateKey(
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
} from "https://deno.land/x/djwt@v2.8/mod.ts";

export async function generateToken(payload: Record<string, unknown>) {
  if (SECRET_KEY === "__NOKEY__") {
    console.error("No SECRET_KEY provided, please set SECRET_KEY in .env");
    Deno.exit(1);
  }
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

/**
 * SQLiteService - Service wrapper for sqlite3
 */
import { Database } from "https://deno.land/x/sqlite3@0.9.1/mod.ts";

const DB_NAME = Deno.env.get("DB_NAME") || "users.db";
const db = new Database(DB_NAME);

interface User {
  userid: string;
  email: string;
  password: string;
}
let instance: SQLiteService | null = null;
export class SQLiteService {
  static getInstance() {
    if (!instance) {
      instance = new SQLiteService();
    }
    return instance;
  }

  constructor() {
    try {
      db.exec(
        `CREATE TABLE IF NOT EXISTS users (\
            userid text primary key not null,\
            email text not null,\
            password text not null)`,
      );
    } catch (err) {
      console.error("Error creating table", err);
      Deno.exit(1);
    }
  }

  /**
   * Attempts to login with a given userid and password,
   * comparing to the hash:salt stored in the database.
   */
  login(email: string, password: string) {
    const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
    const user = stmt.get(email) as User | undefined;
    if (!user) {
      throw new Error("Authentication Error");
    }
    const salt = user.password.split(":")[1];
    if (!salt) {
      throw new Error("Error fetching salt from user record");
    }

    if (!compare(password, user.password)) {
      throw new Error("Authentication Error");
    }

    const token = generateToken({
      //Payload
      userid: user.userid,
      email: user.email,
    });

    return token;
  }

  /**
   * Registers a new user account. Generates a UUID to act as userid, and hashes the
   * required password.
   */
  register(email: string, password: string) {
    const hashed = hash(password);
    try {
      const uuid = crypto.randomUUID();
      db.exec("INSERT INTO users (userid, email, password) VALUES (?,?,?)", [
        uuid,
        email,
        hashed,
      ]);
      return uuid;
    } catch (err) {
      throw err;
    }
  }
}
