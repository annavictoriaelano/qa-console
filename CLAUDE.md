@AGENTS.md

# qa-web-app — Claude Working Doc (Anna)

> Solo portfolio project. This file is **strictly Anna's working doc** — not for recruiters, not for the friend collaborating on frontend later. README is the public face.

---

## What this repo is

Anna's AI-augmented QA webapp. Replaces the killed Zephyr Scale plan. Stream B' in the upskill plan (`Obsidian Vaults/HazardCo QA Team/xannavictoriaelano/test-automation-upskill/notes/webapp-mvp-plan.md`).

**MVP scope (locked):**
1. TC storage in Neon Postgres
2. AI requirements-to-TC generator (port of `anna-test-case-creation` skill)
3. Coverage dashboard
4. MCP server wrap (Claude drives the webapp externally)

**Ownership:** Anna owns schema + backend + MCP wrap (load-bearing). Informal dev friend owns frontend + theming (replaceable; MVP ships even if friend goes quiet).

---

## Glossary

Domain terms used throughout this repo:

- **TC** = Test Case. The atomic unit stored in `test_cases` table. The thing the AI generator produces.
- **MCP** = Model Context Protocol. The wrap layer (Stream B' MVP item 4) that lets Claude drive this webapp externally.
- **M01, M02, ...** = Hub module identifiers (e.g. M01 = "Site Setup"). See `xannavictoriaelano/test-automation-upskill/notes/hub-module-hierarchy.md` in the vault.
- **Hub** = HazardCo's web app (the system under test). Distinct from the mobile app. This webapp catalogues TCs *for the Hub*.
- **HazardCo** = Anna's employer. Construction safety SaaS. Mobile app (React Native) + Hub (web).
- **Stream B'** = the upskill plan stream that owns this webapp. Master plan: `xannavictoriaelano/test-automation-upskill/00-plan.md`.

---

## Stack (what's actually installed vs planned)

**Installed and locked:**

- Next.js **16.2.7** (App Router). Note: breaking changes from training data — see `AGENTS.md`. Read `node_modules/next/dist/docs/` before writing Next.js code. Heed deprecation notices.
- React 19.2.4
- TypeScript 5 (strict via `tsconfig.json`)
- Tailwind v4 + `@tailwindcss/postcss`
- ESLint 9 + `eslint-config-next`
- `@neondatabase/serverless` 1.1.0
- Drizzle ORM 0.45.2 + drizzle-kit 0.31.10 (dialect: postgresql)
- `dotenv`, `tsx`

**Planned, NOT installed yet** — do NOT add without confirming with Anna first:

- NextAuth (auth — pending decision, may switch to Clerk/Auth0)
- shadcn/ui
- `@anthropic-ai/sdk` (AI generator)
- `@modelcontextprotocol/sdk` (MCP server wrap)

**Storage layout:**

- Pooled URL → runtime queries (server components, route handlers). `DATABASE_URL` in `.env.local`.
- Direct URL → drizzle-kit migrations only. `DIRECT_URL` in `.env.local`.
- `.env.local` is **gitignored, machine-specific** — never modify it as part of a task. Update `.env.example` if a new var is added.

---

## Project structure

```
src/
  app/              # Next.js App Router (layout, page, globals.css)
  db/
    schema.ts       # Drizzle schema (test_cases table + enums)
    index.ts        # Drizzle client (Neon serverless driver)
    migrations/     # drizzle-kit generated SQL + meta journal
scripts/
  fetch-m01.py      # Pull M01 TC data from the Hub_M0X_* Gsheet
  inspect-gsheet.py
  inspect-sections.py
  seed-m01.ts       # Seed test_cases from data/m01.json
data/
  m01.json          # Gitignored — local Gsheet export
```

NPM scripts: `dev`, `build`, `start`, `lint`, `db:generate`, `db:migrate`, `db:studio`.

---

## How to work with me (project-specific deltas)

> Base working-style rules live in `~/.claude/CLAUDE.md` (be concise, short paced steps, no em-dashes, ask before assuming, don't rush me to a conclusion, "if you ask a question, STOP", etc.). Read those too. Below are the additions that only apply to this project.

- **Don't say you can't do it without double-checking.** If you initially think a thing is blocked (missing MCP, missing tool, missing skill), look for a simple workaround first and confirm with me before declaring blocked.
- **Confidence is a stop sign, not a green light.** When you feel you have enough info to write a query, an API route, a schema change: that feeling is the trigger to verify, not to proceed. Source code is not the running app. Read the schema, run the query in `db:studio`, hit the route in `curl`, *then* write.
- **When stuck, escalate.** Stop, report what's blocking you, suggest what to do, and ask which direction. Do not pick a direction yourself.

---

## When things go wrong (project-specific delta)

> Base rules in `~/.claude/CLAUDE.md` (never panic, no shortcuts, never violate skills/memory, slower correct path beats fast wrong path, one thing at a time). Project additions; these also override task completion.

1. **`AGENTS.md` is in scope alongside skills/CLAUDE.md/memory.** It documents Next.js 16 breaking changes; violating it produces fabricated APIs.
2. **Database errors are not retried blindly.** If `db:migrate` errors or a query crashes, STOP. Check the migration state, check the connection, check the schema. Never re-run a migration without understanding what the failure was.

---

## Database rules (MANDATORY)

- **Never run `db:migrate` or `db:generate` without confirming with me first.** Show me the diff or the planned generation, wait for approval, then run.
- **Never push to production Neon branch without explicit confirmation.** Default branch in Neon is `main` — that's the prod store for the free tier; treat any write as if it were prod.
- **Never create Neon branches without asking.** Free tier caps at 10. Branches eat quota.
- **Never modify `.env.local`.** It's gitignored and machine-specific. New env vars go to `.env.example` first.
- **Schema changes are reviewed before generated.** Show me the schema diff, wait for OK, *then* run `db:generate`. Don't generate-then-show.
- **`db:studio` is read-only for diagnostics.** Don't use it to manually mutate data unless I tell you to.

---

## Next.js 16 rules (MANDATORY)

- **Read `node_modules/next/dist/docs/` for the relevant feature before writing Next.js code.** Per `AGENTS.md` — this version has breaking changes from your training data.
- **Heed deprecation notices** in the docs. If a pattern is deprecated, find the current one before writing.
- **Do not invent APIs from memory.** Verify in `node_modules/next/dist/docs/` first if you're not 100% sure the API exists in 16.2.7.

---

## API + AI generator rules

- **Anthropic API costs run hot.** Set per-request token caps. Default to Claude Haiku for cheap TC generation; escalate to Sonnet only when Haiku quality is insufficient. Do not call Opus from server code by default.
- **Never call the Anthropic API in a tight loop without confirming.** Batch operations (e.g. "generate TCs for all 30 features") must be paced and approved.
- **MCP server tools are wrappers over the REST endpoints.** Don't duplicate logic in the MCP layer — wrap, don't fork.

---

## Background task rules (project-specific delta)

> Base rules in `~/.claude/CLAUDE.md` (stop on blocker, one active command, no `run_in_background` for external-state commands, no batch loops in a single Bash call, multi-agent dependency rule, intervention invalidates prior in-flight work). Project additions:

- **"External state" in this project means:** Neon (DB), Anthropic API, Vercel, GitHub. Foreground only with explicit timeout for any command touching these.
- **`npm run dev` is the exception.** Long-running dev server is fine in background, but only one instance at a time and report the port.

---

## Git rules (MANDATORY)

- **Public portfolio repo.** Public on Anna's personal GitHub. Anything pushed is permanent and visible.
- **Always ask before any git operation** — commit, push, branch creation, branch deletion, force-push, rebase, reset.
- **Never push secrets.** `.env*` is gitignored (except `.env.example`). Verify before any commit.
- **Branch off `main` for features.** Anna confirms branch names. No auto-created branches.
- **Commits Anna writes herself unless she asks for help drafting a message.** Even then: show the message, wait for OK, then commit.

---

## Vercel rules

- **Never deploy without explicit ask.** Including preview deploys: they consume free-tier minutes.
- **Free tier limits matter.** ~100 GB bandwidth, 100 GB-hrs serverless. Watch usage.
- **Production deploy = explicit confirmation per deploy.** No "auto-promote" assumptions.
- **`vercel env pull` is the source of truth for env vars when the project is Vercel-linked.** If `.env.local` and the Vercel env list diverge, ask before reconciling. Never push secrets up via `vercel env add` without confirming.
- **Use the relevant Vercel skill before writing Vercel-aware code.** `vercel:nextjs` for App Router, `vercel:next-cache-components` for caching/PPR, `vercel:vercel-storage` for Neon/Vercel storage integration, `vercel:env-vars` for env management. Next.js 16 and Vercel platform features have evolved past your training cutoff; the skills are the corrective.

---

## Obsidian vault

My second brain. Path:

```
/Users/annaelano/Documents/ase-workspace/Obsidian Vaults/HazardCo QA Team
```

This webapp's plan + progress live at:

- Master plan: `xannavictoriaelano/test-automation-upskill/00-plan.md` (Stream B')
- Webapp MVP detail: `xannavictoriaelano/test-automation-upskill/notes/webapp-mvp-plan.md`
- Module hierarchy: `xannavictoriaelano/test-automation-upskill/notes/hub-module-hierarchy.md`
- Schema draft (to be created): `xannavictoriaelano/test-automation-upskill/notes/neon-schema-draft.md`
- Progress: `xannavictoriaelano/test-automation-upskill/01-progress.md`
- Session logs: `xannavictoriaelano/test-automation-upskill/claude-sessions/`

**Canonical conventions:** `_conventions.md` at vault root. Read it before any vault write.

### Available skills

Check available skills before improvising. The session loader lists what's loaded; common ones for this repo:

- **`obsidian-vault`**: vault writes (triggers below)
- **`vercel:nextjs`**: Next.js App Router; required reading before writing App Router code given v16 breaking changes
- **`vercel:next-cache-components`**: PPR, `use cache`, `cacheTag`, `updateTag`; Next.js 16 specific
- **`vercel:vercel-storage`**: Neon Postgres on Vercel
- **`vercel:ai-sdk`** / **`vercel:ai-gateway`**: when wiring the AI generator
- **`vercel:env-vars`**: env management; `vercel env pull` is source of truth
- **`claude-api`**: Anthropic SDK usage; relevant for the AI generator
- **`simplify`**, **`review`**, **`security-review`**: code quality passes

### Skill: obsidian-vault

Owns all writes to the vault (session log, TODO, progress, patterns, bugs). Universal: works for this repo too. Trigger phrases:

- `"start session"` / `"session-start"`: load continuity
- `"closeout"` / `"log session"` / `"wrap up"`: end-of-session write
- `"add todo"` / `"close todo"`: TODO triage
- `"extract pattern"`: write a discovered pattern (Next.js, Drizzle, MCP, etc.)
- `"log bug"`: new bug note
- `"update progress"`: update `01-progress.md` after a milestone

**Skill-driven writes go direct.** No preview needed, Anna reviews in Obsidian.
**Ad-hoc writes outside skill context.** Preview full content first, wait for approval.
**Never delete.** Move to `Tracker/_archive/` or equivalent.

### Memory vs vault

- **Memory** (`~/.claude/projects/.../memory/`) = behavioural rules, preferences. Loaded every session.
- **Vault** = knowledge artifacts (session logs, plans, patterns). Searchable, cross-linked.
- Don't duplicate. Memory may point INTO vault. Don't copy content.

---

## Guardrails

- **IMPORTANT: Never hardcode** the `DATABASE_URL` or `DIRECT_URL` — read from `process.env`.
- **IMPORTANT: Never commit** `.env.local`, `data/m01.json`, or any file containing real Neon credentials or Anthropic keys.
- **Never push to PROD branch** without an explicit ask.
- **Never modify `.env.local`.**
- **Always use** `dotenv.config({ path: ".env.local" })` for scripts that need DB access (see `drizzle.config.ts`, `scripts/seed-m01.ts`).
- **Flag immediately** if any source file appears to contain hardcoded credentials. Don't proceed.

---

## Reference

### AGENTS.md: @AGENTS.md
**Read when:** Writing or modifying any Next.js code.

### package.json: @package.json
**Read when:** Verifying installed versions before suggesting an API. Source of truth for what's installed vs planned.

### tsconfig.json: @tsconfig.json
**Read when:** Understanding strict-mode settings, path aliases, or TS compiler behavior.

### Drizzle schema: @src/db/schema.ts
**Read when:** Looking up table fields, enums, types. Source of truth for the TC shape.

### Drizzle config: @drizzle.config.ts
**Read when:** Running migrations, understanding the DIRECT vs POOLED URL split.

### Webapp MVP plan: @../../ase-workspace/Obsidian Vaults/HazardCo QA Team/xannavictoriaelano/repositories/qa-web-app/webapp-mvp-plan.md
**Read when:** Anna asks about scope, sequence, deferred features, ownership split, or "what comes next."

### Webapp vault folder: `xannavictoriaelano/repositories/qa-web-app/`
**Contains:** `webapp-mvp-plan.md`, `TO-DO-qa-web-app.md`, `claude-sessions/`. This is the canonical home for qa-web-app planning, TODOs, and session logs. Hub QA automation TODOs stay in `xannavictoriaelano/test-automation-upskill/TO-DO-hub.md`.
