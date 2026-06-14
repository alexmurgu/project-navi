import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import os from "node:os";

const getBetterAuthBaseURL = () => {
  if (process.env.NODE_ENV === "production") {
    return process.env.PUBLIC_BETTER_AUTH_URL || process.env.BETTER_AUTH_URL;
  }

  return process.env.BETTER_AUTH_URL;
};

const getTrustedOrigins = () => {
  const origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];

  if (process.env.NODE_ENV !== "production") {
    try {
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
          if (iface.family === "IPv4" || (iface.family as any) === 4) {
            origins.push(`http://${iface.address}:5173`);
            origins.push(`http://${iface.address}:3000`);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to retrieve network interfaces for trusted origins:", e);
    }
  }

  if (process.env.BETTER_AUTH_URL) {
    origins.push(process.env.BETTER_AUTH_URL);
  }
  if (process.env.PUBLIC_BETTER_AUTH_URL) {
    origins.push(process.env.PUBLIC_BETTER_AUTH_URL);
  }

  return Array.from(new Set(origins));
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: getBetterAuthBaseURL(),
  trustedOrigins: getTrustedOrigins(),
});
