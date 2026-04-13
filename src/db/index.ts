import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import path from "node:path";

// Use an env override when present, otherwise resolve the root local.db
const url = process.env.DATABASE_URL || `file:${path.resolve(process.cwd(), "local.db")}`;

const client = createClient({
  url,
  authToken: process.env.DATABASE_AUTH_TOKEN, // Optional for local but kept for compatibility
});

export const db = drizzle(client, { schema });
