import express from "express";
import helmet from "helmet";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { toNodeHandler } from "better-auth/node";
import { db } from "./db/connection.ts";
import { auth } from "./auth.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT ?? 3001);

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

// Auth routes (better-auth handles all /api/auth/* endpoints)
app.all("/api/auth/{*path}", toNodeHandler(auth));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Run pending migrations
migrate(db, { migrationsFolder: join(__dirname, "db/migrations") });

// Serve frontend in production (single container deployment)
const frontendDist = join(__dirname, "../../../apps/website/dist");
if (process.env.NODE_ENV === "production" && existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(join(frontendDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
