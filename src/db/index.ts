import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Credentials live only in .env (see .env.example) — never hard-code a
// fallback here, it ends up in git history.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
}

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
