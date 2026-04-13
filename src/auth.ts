import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

const getBetterAuthBaseURL = () => {
    if (process.env.NODE_ENV === "production") {
        return process.env.PUBLIC_BETTER_AUTH_URL || process.env.BETTER_AUTH_URL;
    }

    return process.env.BETTER_AUTH_URL;
};

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite",
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
        }
    }),
    emailAndPassword: {
        enabled: true
    },
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: getBetterAuthBaseURL()
});
