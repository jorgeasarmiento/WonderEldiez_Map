import { defineConfig } from "drizzle-kit";

// When run from apps/api/, ../../storage/db/db.sqlite resolves to storage/db at monorepo root
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DB_PATH ?? "../../storage/db/db.sqlite",
  },
});
