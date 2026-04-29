# MindeloAI Dashboard

Operational dashboard for **MindeloAI** — a Web Dev + AI Automation studio. Tracks clients, projects, invoices, expenses, recurring revenue, owner attribution, and service-type mix.

**Stack:** Next.js 16 (App Router) · Airtable · Railway · Tailwind · Recharts · @dnd-kit · sonner

## Getting Started

```bash
cp .env.local.example .env.local
# fill in AIRTABLE_API_KEY and AIRTABLE_BASE_ID
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — root redirects to `/dashboard`.

## Environment

Required at runtime (not at build):

- `AIRTABLE_API_KEY` — PAT with `data.records:read`, `data.records:write`, `schema.bases:read`
- `AIRTABLE_BASE_ID` — `app...` from the base URL

Build does **not** touch Airtable. The `/dashboard` route is `force-dynamic` and fetches per request, so Railway can build without secrets and the live page never serves stale snapshots. If env vars are missing at request time the page renders a clear inline error instead of crashing.

## Airtable schema

Tables: `Clients`, `Projects`, `Invoices`, `Expenses`, `Milestones`. See `dashboard-master-plan.md` in the parent directory for full field definitions.

Optional fields the dashboard reads if present (no breakage if missing):

- `Projects.Owner` · `Projects.Service Type` · `Projects.Recurring Amount` · `Projects.Recurring Frequency`
- `Clients.Owner`

## Overdue handling

"Overdue" is **derived** in code, not stored. An invoice is treated as overdue when:

- its stored `Status` is explicitly `Overdue`, or
- its `Status` is `Sent` and its `Due Date` is in the past.

Phase 6 (cron writes `Status = Overdue` back to Airtable) is intentionally not implemented — the derived approach keeps the dashboard, all widgets, and the Mark Paid affordance in agreement without depending on a job. If you later want the value persisted in Airtable, add a daily Railway cron that runs the same `isOverdue` check.

Source of truth: `src/lib/invoices.ts` (`isOverdue`, `effectiveStatus`).

## Deploy

Hosted on Railway with auto-deploy from `main` (`railway.toml`). Push to `main` to deploy.
