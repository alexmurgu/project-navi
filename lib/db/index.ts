import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Use a local file for SQLite as requested
const url = process.env.DATABASE_URL || 'file:local.db';

const client = createClient({ 
  url, 
  authToken: process.env.DATABASE_AUTH_TOKEN // Optional for local but kept for compatibility
});

export const db = drizzle(client, { schema });
