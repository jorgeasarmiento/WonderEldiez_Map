import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "./schema.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

// In Docker: DB_PATH=/storage/db/db.sqlite via env var
// In development: resolved relative to this file (../../../../storage/db/db.sqlite)
const DB_PATH = process.env.DB_PATH ?? join(__dirname, "../../../../storage/db/db.sqlite");

mkdirSync(dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
