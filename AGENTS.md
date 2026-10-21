<!--VITE PLUS START-->

# Vite+ — Unified Toolchain

Vite+ wraps Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task under a single CLI: `vp`. Run `vp help` or `vp <command> --help` for details.

## Commands

| Group        | Commands                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------ |
| Start        | `create`, `migrate`, `config`, `staged`, `install` (`i`), `env`                                              |
| Develop      | `dev`, `check`, `lint`, `fmt`, `test`                                                                        |
| Execute      | `run`, `exec`, `dlx`, `cache`                                                                                |
| Build        | `build`, `pack`, `preview`                                                                                   |
| Dependencies | `add`, `remove`/`rm`, `update`/`up`, `dedupe`, `outdated`, `list`/`ls`, `why`, `info`, `link`/`unlink`, `pm` |
| Maintain     | `upgrade`                                                                                                    |

## Pitfalls

- **No direct pnpm/npm/Yarn** — use `vp` for all package operations
- **No `vp vitest` or `vp oxlint`** — use `vp test` and `vp lint`
- **Custom scripts sharing a built-in name** — use `vp run <script>`, not `vp <script>` (e.g. `vp run dev` not `vp dev`)
- **Don't install Vitest, Oxlint, Oxfmt, or tsdown** — they're bundled in Vite+
- **Use `vp dlx`** instead of `npx`/`pnpm dlx`
- **Import from `vite-plus`**, not `vite` or `vitest` — e.g. `import { defineConfig } from 'vite-plus'`; `import { expect, test } from 'vite-plus/test'`
- **Type-aware linting:** `vp lint --type-aware` works out of the box — no extra packages needed

## CI (GitHub Actions)

```yaml
- uses: voidzero-dev/setup-vp@v1
  with:
    cache: true
- run: vp check
- run: vp test
```

## Agent Checklist

- [ ] `vp install` after pulling remote changes
- [ ] `vp check` and `vp test` before finishing

<!--VITE PLUS END-->

---

# Project: debrain-ai-template

Monorepo starter for DEBRAIN. Stack: Vue.js frontend, Express backend, Lit web components, SQLite via Drizzle ORM, Docker.

## Workspace Structure

```
apps/
  website/   — Vue 3 + TailwindCSS v4 + Vite+
  api/       — Express 5, Node.js 24, TypeScript, ESM
packages/
  utils/     — Shared TypeScript utilities (ESM library)
storage/
  db/        — SQLite database (Docker volume)
  uploads/   — User uploads (Docker volume)
inbox/       — READ ONLY: raw assets (fonts, images, PDFs). Never import from code.
```

## Key Commands

```bash
vp run cleanup           # clean boilerplate (destructive — asks for confirmation)
vp run dev               # frontend :5173 + backend :3001
vp run website#dev       # frontend only
vp run api#dev           # backend only

vp run db:generate       # generate migration from schema changes
vp run db:migrate        # apply pending migrations
vp run db:push           # push schema directly (dev only)
vp run db:studio         # Drizzle Studio

vp run api#check         # format + lint + types
vp run api#build         # tsc --noEmit
vp run utils#build       # build utils library
vp run website#build     # build frontend

docker compose up --build  # production: single container on :3001
```

## Backend (apps/api)

- Express 5 + `helmet`; Node.js 24 native TypeScript (no compile step)
- DB: better-sqlite3 + Drizzle ORM, WAL mode; path `storage/db/db.sqlite` (`DB_PATH` env overrides)
- Uploads: `storage/uploads/` (`UPLOADS_PATH` env overrides)
- Migrations: auto-applied on startup via `drizzle-orm/better-sqlite3/migrator`
- Schema: `apps/api/src/db/schema.ts` → run `vp run db:generate` after changes
- ESM: use `.ts` extensions in imports; `import.meta.url` instead of `__filename`
- Auth: better-auth at `/api/auth/{*path}` — config in `apps/api/src/auth.ts`

## Frontend (apps/website)

- Vue 3 + TailwindCSS v4; auth client at `apps/website/src/lib/auth-client.ts`
- Web components via Lit
- **First time setup:** Run `vp run cleanup` to remove boilerplate content and start with a clean slate
  - Removes demo homepage, example counter, boilerplate favicon, and decorative assets
  - Replaces `App.vue` with a minimal blank template
  - ⚠️ Destructive operation — prompts for confirmation before proceeding

## Docker

- `Dockerfile` — multi-stage Alpine; Vue frontend + API in one container
- `docker-compose.yml` — volumes `db_data`, `uploads_data`; healthcheck at `/api/health`
- `docker-compose.override.yml` — bind mounts `./storage/` locally
- `nixpacks.toml` — Coolify deployment (use Docker Compose deployment type)
- Container envs set automatically: `DB_PATH=/storage/db/db.sqlite`, `UPLOADS_PATH=/storage/uploads`

## Constraints

- Never use pnpm/npm directly — always `vp`
- `better-sqlite3` requires `pnpm.onlyBuiltDependencies` in root `package.json` — don't remove it
- `storage/db/db.sqlite` — don't move it; reference uploads via `process.env.UPLOADS_PATH`
- `inbox/` is read-only — copy assets out before using them in code
- Node ≥24.0.0 required
- `vp run build -r` doesn't work — build each package individually
- After updating `pnpm-lock.yaml`, rebuild Docker (lockfile is copied into image)

---

## Agent Guardrails — Non-Negotiable

If a request conflicts with these rules, explain the project standard and use the correct alternative.

### Development Server Execution

**Never start development servers automatically** — they leave long-running processes that can become zombies.

- Don't execute `vp run dev`, `vp run api#dev`, `vp run website#dev`, or `docker compose up` without asking
- Always prompt the user: "Ready to test? Please run: `vp run dev`" or similar
- Don't restart servers automatically — ask the user to do it manually
- Other commands (`vp check`, `vp test`, `vp install`, `vp build`, etc.) can be executed normally

### Fixed Stack

| Area          | Use                  | Never use                                    |
| ------------- | -------------------- | -------------------------------------------- |
| Auth          | `better-auth`        | JWT manual, Passport, Auth0, Clerk, NextAuth |
| CSS/UI        | `TailwindCSS`        | Bootstrap, Vuetify, Quasar, UnoCSS           |
| Validation    | `Zod`                | Joi, Yup, class-validator, Valibot           |
| State         | `Pinia`              | Vuex, custom stores, global useState         |
| Rate limiting | `express-rate-limit` | any alternative                              |
| Logging       | `console`            | winston, pino, bunyan                        |
| Database      | Drizzle ORM + SQLite | raw SQL, PostgreSQL, MongoDB, Prisma         |

```bash
vp add better-auth express-rate-limit zod pinia tailwindcss
```

### Database

- Always Drizzle ORM — no raw SQL
- Never modify existing migrations in `src/db/migrations/` — only add new ones
- After schema changes: `vp run db:generate && vp run db:migrate`

**Production deploy with schema changes:**

```bash
cp /storage/db/db.sqlite /storage/db/db.sqlite.bak
docker compose up --build -d
curl http://localhost:3001/api/health   # verify healthy
rm /storage/db/db.sqlite.bak           # only after confirmed healthy
# rollback: cp /storage/db/db.sqlite.bak /storage/db/db.sqlite
```

### Security

- No hardcoded secrets — use `process.env.VARIABLE`
- Document every new env var in `.env.example`
- CORS: no `origin: "*"` in production — use explicit origins
- Apply `express-rate-limit` on all endpoints accepting user input

### Architecture

- `apps/api/src/index.ts` — server setup only; business logic in separate files
- Routes in `apps/api/src/routes/<name>.ts`, one file per resource
- Shared types in `packages/utils/src/`
- Don't add Docker services unless explicitly requested

### API Response Format

```typescript
res.json({ data: result })                                              // success
res.status(4xx).json({ error: { message: "...", code: "CODE" } })     // error
```

Never return passwords, tokens, or sensitive data.

### Component Organization

**Pages must be decomposed into components — never a single monolithic file.**

- Each component in its own file, named after the component (`UserCard.vue`)
- Group by feature/domain: `components/users/`, `components/orders/`
- Pages (`views/`/`pages/`) contain only layout and composition — no inline business logic
- Feature composables/stores go alongside their components
- Adding to a page? Extract a new component instead of appending to the page file

### Done Checklist

- [ ] `vp run api#check` (or `website#check`) passes
- [ ] Schema changes: migrations generated and applied
- [ ] New env vars documented in `.env.example`
- [ ] Rate limiting on new public endpoints

**Ask the user to test:** "Ready to test? Please run `vp run dev` and verify the changes."
