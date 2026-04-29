# MindeloAI Dashboard

Operational dashboard for **MindeloAI** — a Web Dev + AI Automation studio. Tracks clients, projects, invoices, expenses, recurring revenue, owner attribution, and service-type mix.

**Stack:** Next.js 16 (App Router) · Airtable · Railway · Tailwind · Recharts · @dnd-kit · sonner · react-pdf · Resend · Clerk

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — root redirects to `/dashboard`.

## Environment

Required env vars (see `.env.local.example`):

- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `RESEND_API_KEY`

## Airtable schema

Tables: `Clients`, `Projects`, `Invoices`, `Expenses`, `Milestones`. See `dashboard-master-plan.md` in the parent directory for full field definitions.

Optional fields the dashboard reads if present (no breakage if missing):

- `Projects.Owner` · `Projects.Service Type`
- `Clients.Owner`

## Deploy

Hosted on Railway with auto-deploy from `main` (config: `railway.toml`). Push to deploy.
