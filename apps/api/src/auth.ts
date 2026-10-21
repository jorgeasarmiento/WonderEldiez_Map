import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { randomBytes } from "node:crypto";
import { db } from "./db/connection.ts";

if (!process.env.BETTER_AUTH_SECRET) {
  console.warn(
    "[auth] BETTER_AUTH_SECRET is not set. Using a random secret — sessions will not persist across restarts.",
  );
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? randomBytes(32).toString("hex"),
  database: drizzleAdapter(db, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
  },
});
