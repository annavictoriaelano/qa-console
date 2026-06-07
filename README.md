# QA Console

> AI-augmented test case management. A solo portfolio project by [Anna Elano](https://github.com/annavictoriaelano).

**Live demo:** [qa-console.vercel.app](https://qa-console.vercel.app) *(password-gated — request access via the GitHub profile if you want a peek)*

---

## What this is

A web app I designed and built to manage the test cases I write at work, with a focus on the parts that off-the-shelf TCMS tools (Zephyr, TestRail, Xray, AIO) get right and the parts they don't.

It currently houses **530 manually-curated test cases** across 7 modules of a SaaS product (HazardCo's Hub web app, where I work as QA), with module filtering, search, pagination, inline editing, and bulk operations. The roadmap layers on purpose-built views (regression run builder, automation coverage matrix, last-run triage) and an MCP server so Claude can drive the app externally.

This is a single-builder project, public on purpose: I want the codebase and the decisions behind it to be inspectable as part of my portfolio.

## Why I built it

I'm a QA engineer who spends release weeks juggling spreadsheets and three different TCMS tools, none of which compose well. The premise: a TCMS that's **AI-native from day one** (Claude can read and write it via MCP), **purpose-fit for the workflows I actually do** (regression set composition, automation coverage tracking, last-run triage), and **architected as I'd architect a SaaS** (clean schema, server actions, no client-side state where it doesn't belong).

This is also Stream B' of my self-directed [test automation upskill plan](#) — replacing an originally-planned Zephyr Scale instance.

## Stack

| Layer | Tech | Notes |
| --- | --- | --- |
| Framework | Next.js 16.2.7 (App Router, Turbopack) | Server Components + Server Actions throughout |
| Language | TypeScript 5 (strict) | |
| Styling | Tailwind v4 | |
| Database | Neon serverless Postgres (free tier) | Pooled URL at runtime, direct URL for migrations |
| ORM | Drizzle 0.45 + drizzle-kit 0.31 | |
| Auth | `jose` JWT in HttpOnly cookie + `bcryptjs` | Single shared password for now; upgrade path to NextAuth/Clerk on the roadmap |
| Routing protection | Next.js 16 `proxy.ts` (renamed from `middleware.ts`) | Node.js runtime |
| Hosting | Vercel (Hobby tier) | Production at qa-console.vercel.app |

## What's built today

- **Test Case Library** with module tree (M01-M15), drawer-based detail + inline edit, full-text search on title, paginated table (20/50/100 per page), test-suite filter
- **Bulk operations**: multi-select rows → mark reviewed / mark unreviewed / add tag
- **Single-password auth** gating every route except `/login`
- **530 seeded test cases** from real product modules, imported from internal Google Sheets via Python scripts
- **URL-driven state**: drawer open/closed, edit mode, search, pagination, filters — all bookmarkable

## What's coming

Per the [TODO](https://github.com/annavictoriaelano/qa-console/issues) (private, vault-tracked), in priority order:

1. **Regression Run Builder** — durable test sets that compose into release runs (Xray Test Sets pattern)
2. **Saved Filters + extended Bulk Ops** — PractiTest filter-first navigation
3. **Automation Coverage Matrix** — module × automation_status pivot, stacked-bar visualization
4. **Last Run Triage view** — FAILED/BLOCKED filtered dashboard
5. **Schema redesign decision: Cases vs Runs split** — separate execution history from case definitions
6. **Traceability view** — TC ↔ Jira ticket coverage report
7. **MCP server wrap** — Claude can list, read, create, generate TCs via MCP tools
8. **AI requirements-to-TC generator** *(parked; resumes after view work)*

## Running locally

```bash
git clone https://github.com/annavictoriaelano/qa-console.git
cd qa-console
npm install
cp .env.example .env.local
# fill in DATABASE_URL, DIRECT_URL, AUTH_PASSWORD_HASH, AUTH_SESSION_SECRET
npm run db:migrate
npm run dev
```

`.env.example` documents the env vars and includes the dotenv `$`-escaping gotcha that bit me on first deploy (bcrypt hashes contain `$` chars; `@next/env` uses `dotenv-expand` which expands `$VAR` refs regardless of quoting — escape with `\$`).

## License

No license yet — this is a personal portfolio project, not a library. Code is public for inspection; please don't reuse the test case content (it describes a third-party product).

## Contact

[github.com/annavictoriaelano](https://github.com/annavictoriaelano) · [LinkedIn](https://www.linkedin.com/in/annavictoriaelano/) *(if applicable)*
