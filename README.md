# DËBRAIN AI Template

A starting point for building web apps with AI assistance. Everything is pre-configured so you can focus on building, not setup.

---

## What's included

| Layer      | Technology             |
| ---------- | ---------------------- |
| Frontend   | Vue 3 + TailwindCSS    |
| Backend    | Express 5              |
| Database   | SQLite via Drizzle ORM |
| Auth       | better-auth            |
| Runtime    | Node.js 24+            |
| Containers | Docker                 |

---

## Before you start

Make sure you have these installed on your machine:

- **Node.js 24 or higher** — [nodejs.org](https://nodejs.org)
- **Vite+** — run this once in your terminal:

  ```bash
  # macOS / Linux
  curl -fsSL https://vite.plus | bash

  # Windows
  irm https://vite.plus/ps1 | iex
  ```

  Then open a new terminal and verify it works: `vp help`

- **An AI agent** — Claude Code or any agent you prefer

---

## Getting started

**1. Install dependencies**

```bash
vp install
```

**2. Clean the boilerplate (recommended for new projects)**

Remove the demo homepage and start with a blank slate:

```bash
vp run cleanup
```

This will:

- Delete example components and demo assets (favicon, images)
- Replace `App.vue` with a minimal blank template
- Ask for confirmation before proceeding (type `yes` to confirm)

⚠️ **Skip this step if you want to keep the demo homepage as a reference.**

**3. Start the development servers**

```bash
vp run dev
```

This starts both the frontend (`http://localhost:5173`) and the backend (`http://localhost:3001`) at the same time.

**4. Open your AI agent in this folder and start building**

Open Claude Code (or any AI coding agent) in this project folder and start describing what you want to build:

- _"Create a services page with a grid of cards"_
- _"Add a contact form that saves to the database"_
- _"Add user authentication with email and password"_
- _"Create a dashboard with a table of users"_

The agent will generate the code, create files, update the database schema, and wire everything up.

---

## Common tasks

### Working with your AI agent

**Be specific with your prompts**

Instead of: _"add a form"_  
Say: _"add a contact form with name, email, and message fields that saves to the database and sends an email notification"_

**Use the inbox/ folder**

Drop any files (logos, images, fonts, PDFs) into the `inbox/` folder. Then tell your agent:  
_"Use the logo in inbox/ for the header"_

### Database changes

**Add a new table**

1. Tell your AI agent: _"add a [name] table with fields [...]"_
2. The agent will update `apps/api/src/db/schema.ts`
3. Generate and apply the migration:

```bash
vp run db:generate
vp run db:migrate
```

**View your database**

```bash
vp run db:studio
```

This opens Drizzle Studio in your browser where you can inspect and edit your data.

### Deployment

**Deploy with Docker**

```bash
docker compose up --build
```

This builds everything and starts the app on `http://localhost:3001`. Your database and uploaded files are stored in the `storage/` folder and survive container restarts.

**Deploy to production (Coolify, Railway, etc.)**

Use the **Docker Compose** deployment type. The project includes:

- `Dockerfile` — Multi-stage build for production
- `docker-compose.yml` — Container orchestration
- `nixpacks.toml` — Coolify configuration

---

## Project structure

```
apps/
  website/        ← Vue.js frontend
  api/            ← Express backend
packages/
  utils/          ← Shared utilities
storage/
  db/             ← SQLite database (do not delete)
  uploads/        ← User file uploads
inbox/            ← Drop your assets here (images, fonts, PDFs...)
```

### The `inbox/` folder

This is your workspace. Drop any files here that you want your AI agent to work with — logos, images, fonts, PDFs, spreadsheets, whatever. The agent will read from this folder and use those files as raw material when you ask it to.

---

## Need help?

Contact **José Daniel** at [jose@hellodebrain.com](mailto:jose@hellodebrain.com)
