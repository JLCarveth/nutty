/**
 * SQLiteService - Service wrapper for sqlite3
 */
import { Database } from "https://deno.land/x/sqlite3@0.9.1/mod.ts";
import { compare, generateToken, hash } from "./auth.ts";

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
            email text unique not null,\
            password text not null)`,
      );

      db.exec(`CREATE TABLE IF NOT EXISTS burn_on_read (\
        uuid text primary key not null)`);
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

  /**
   * Inserts a new UUID into the burn_on_read database table
   */
  createBurnable(uuid: string) {
    try {
      db.exec("INSERT INTO burn_on_read (uuid) VALUES (?)", [uuid]);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Returns true if the burn_on_read table contains the given UUID */
  isBurnable(uuid: string) {
    try {
      const stmt = db.prepare(`SELECT uuid FROM burn_on_read WHERE uuid = ?`);
      const result = stmt.get(uuid);
      stmt.finalize();
      if (result === undefined) return false;
      return true;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Remove a record from the burn_on_read table
   */
  removeBurnable(uuid: string) {
    try {
      db.exec(`DELETE FROM burn_on_read WHERE uuid = ?`, [uuid]);
    } catch (err) {
      throw err;
    }
  }
}
