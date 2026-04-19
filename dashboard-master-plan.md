# Personal Business Dashboard — Master Build Plan

**Stack:** Next.js 15 (App Router) · Airtable (backend) · Railway (hosting) · Tailwind + shadcn/ui · Recharts · Clerk (auth) · Resend (email) · react-pdf (invoices)

**Style:** Dark mode with neon accents, playful rounded cards, packed with functionality

---

## Phase 0 — Before You Start (30 min)

Do these once, when you feel ready. You only need to do this phase once ever.

- Create an Airtable account (free tier is fine to start)
- Create a Railway account
- Create a Clerk account (free tier)
- Create a Resend account (free tier, 3k emails/mo)
- Install Node.js 20+ and Claude Code on your machine
- Install GitHub CLI (`gh`) and create a new private repo for the project
- Buy a domain if you want a custom URL (optional)

**Env vars you'll collect along the way:**
`AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `RESEND_API_KEY`

---

## Phase 1 — Airtable Base Setup (1–2 hours)

**Goal:** a fully-structured, test-data-seeded Airtable base before you write a line of code.

### Step 1.1 — Create the base

- New base called `Business Dashboard`
- Delete the default table

### Step 1.2 — Build tables in this order

Create them in this order because each one links to the previous.

**Table 1: `Clients`**
| Field | Type | Notes |
|---|---|---|
| Name | Single line text | Primary field |
| Company | Single line text | |
| Email | Email | |
| Phone | Phone | |
| Status | Single select | Active / Inactive / Lead |
| Notes | Long text | |
| Created | Created time | Auto |

**Table 2: `Projects`**
| Field | Type | Notes |
|---|---|---|
| Name | Single line text | Primary field |
| Client | Link to Clients | Single record |
| Status | Single select | Lead / In Progress / Review / Done / Cancelled |
| Payment Structure | Single select | one_time / deposit_final / milestones / recurring_monthly / recurring_custom |
| Total Value | Currency | |
| Recurring Amount | Currency | Only used if recurring |
| Recurring Frequency | Single select | monthly / quarterly / yearly |
| Deposit Percentage | Number | Only used if deposit_final (e.g. 50) |
| Start Date | Date | |
| End Date | Date | |
| Paid To Date | Rollup | From Invoices where Status = Paid, sum of Amount |
| Balance Remaining | Formula | `{Total Value} - {Paid To Date}` |
| Notes | Long text | |

**Table 3: `Invoices`**
| Field | Type | Notes |
|---|---|---|
| Invoice Number | Autonumber | Primary field, format as `INV-0001` via formula field if you want |
| Project | Link to Projects | |
| Client | Lookup from Project | |
| Amount | Currency | |
| Invoice Type | Single select | deposit / milestone / final / recurring / one_off |
| Status | Single select | Draft / Sent / Paid / Overdue / Void |
| Issue Date | Date | |
| Due Date | Date | |
| Paid Date | Date | |
| Payment Method | Single select | Bank / PayPal / Stripe / Cash / Other |
| PDF URL | URL | Where the generated PDF lives |
| Notes | Long text | |

**Table 4: `Expenses`**
| Field | Type | Notes |
|---|---|---|
| Name | Single line text | Primary field |
| Category | Single select | Software / Subcontractors / Hosting / Hardware / Marketing / Other |
| Amount | Currency | |
| Date | Date | |
| Recurring | Checkbox | |
| Notes | Long text | |

**Table 5: `Milestones`** (only if you do milestone billing — can add later)
| Field | Type | Notes |
|---|---|---|
| Name | Single line text | |
| Project | Link to Projects | |
| Amount | Currency | |
| Order | Number | |
| Status | Single select | Pending / Triggered / Invoiced |
| Triggered Date | Date | |

### Step 1.3 — Seed test data

Add real-looking test data covering **every payment type**:
- 1 one-time project (paid)
- 1 deposit_final project (deposit paid, final sent)
- 1 recurring_monthly project (3 months of invoices)
- 1 milestones project (2 milestones complete, 1 pending)
- 5–10 expenses across categories

This test data is critical. When you build the dashboard, you'll see all edge cases immediately instead of discovering them months in.

### Step 1.4 — Get your credentials

- Go to https://airtable.com/create/tokens
- Create a Personal Access Token with scopes: `data.records:read`, `data.records:write`, `schema.bases:read`
- Grant it access to your `Business Dashboard` base
- Save the token as `AIRTABLE_API_KEY`
- Find your base ID at https://airtable.com/api — it starts with `app...` — save as `AIRTABLE_BASE_ID`

---

## Phase 2 — Project Scaffold (1 hour)

**Goal:** a running Next.js app on Railway with auth and a working Airtable connection. No dashboard yet.

### Step 2.1 — Initialize

```bash
npx create-next-app@latest business-dashboard --typescript --tailwind --app --src-dir --eslint
cd business-dashboard
git init && gh repo create business-dashboard --private --source=. --remote=origin
```

### Step 2.2 — Install dependencies

```bash
npm install airtable @clerk/nextjs zod react-hook-form @hookform/resolvers recharts lucide-react date-fns
npm install @react-pdf/renderer resend
npx shadcn@latest init
npx shadcn@latest add button card input select dialog form label toast badge
```

### Step 2.3 — First Claude Code prompt

Open Claude Code in the project and paste this:

> I'm building a personal business dashboard. The backend is Airtable. I've already created the base with 5 tables: Clients, Projects, Invoices, Expenses, Milestones. [Paste the schema from Phase 1 here]
>
> For this session, do ONLY the following:
>
> 1. Create a typed Airtable client wrapper at `src/lib/airtable.ts` that exports functions: `getClients()`, `getProjects()`, `getInvoices()`, `getExpenses()`, `createClient()`, `createProject()`, `createInvoice()`, `createExpense()`, `updateInvoice()`, `updateProject()`. Use Zod schemas for each table.
>
> 2. Set up Clerk auth wrapping the app, with a sign-in page and protected routes so the dashboard requires login.
>
> 3. Create a single test page at `/dashboard` that server-side fetches one record from each table and displays raw JSON. This is to prove the connection works.
>
> 4. Set up folder structure: `src/app/(dashboard)/` for protected routes, `src/components/ui/` for shadcn, `src/components/dashboard/` for dashboard widgets, `src/lib/` for utilities.
>
> Do NOT build any charts, forms, or UI yet. Just prove the data plumbing works end-to-end.

### Step 2.4 — Deploy to Railway

- Create new Railway project → deploy from GitHub repo
- Add all environment variables
- Optional: add Redis service for caching later
- Verify the deployed app loads and shows your Airtable data

**End of Phase 2 checkpoint:** deployed app on Railway, you can log in, `/dashboard` shows raw JSON from Airtable.

---

## Phase 3 — Data Entry Forms (3–4 hours)

**Goal:** every way of adding/editing data works before any visualizations. This is the most important phase.

### Step 3.1 — Build these forms as modal dialogs

- **New Client** (simple — name, company, email, phone, status)
- **New Expense** (name, category, amount, date, recurring toggle)
- **New Project** (this one is complex, see below)
- **New Invoice** (link to project, type, amount, dates, status)
- **Edit** versions of each of the above
- **Mark invoice as paid** quick action

### Step 3.2 — The dynamic project form

This is where the payment structure logic lives. When the user picks a payment structure in the dropdown, different fields appear:

- `one_time` → just total value
- `deposit_final` → total value + deposit percentage, auto-creates 2 invoices on save
- `recurring_monthly` → monthly amount + frequency + start date
- `milestones` → total value + dynamic milestone builder (add/remove rows with name + amount)

### Step 3.3 — Claude Code prompt for this phase

> Building data entry forms for the dashboard. Use shadcn Dialog + Form + react-hook-form + Zod.
>
> 1. Create a reusable `DataEntryModal` component that takes a trigger button and form content as children.
>
> 2. Build `NewClientForm`, `NewExpenseForm`, `NewProjectForm`, `NewInvoiceForm`. Each calls the respective `create*` function from `src/lib/airtable.ts` via a server action, then refreshes the page.
>
> 3. For `NewProjectForm`, the form is conditional based on payment_structure dropdown — use react-hook-form's `watch()` to show/hide fields. On submit:
>    - `deposit_final` → create project + 2 draft invoices (deposit and final)
>    - `recurring_monthly` → create project + first month's invoice
>    - `milestones` → create project + milestone records (no invoices until triggered)
>    - `one_time` → create project + one draft invoice
>
> 4. Add a floating action button in the dashboard corner that opens a "quick add" menu with all four form options.
>
> 5. Use optimistic updates where possible. Toast on success/error.
>
> Do NOT style the dashboard layout yet — just a plain page with buttons to open each form. Testing that forms work correctly is the whole goal of this session.

**End of Phase 3 checkpoint:** you can add and edit all data types from the dashboard. Airtable fills up correctly.

---

## Phase 4 — Dashboard Sections (one per session, 1–2 hours each)

Build each section as its own Claude Code session. Reference the neon playful mockup style throughout. Each section is a self-contained server component.

### Session 4.1 — Hero cards row

Net profit (revenue − expenses), Coming In (outstanding invoices), YTD Goal (progress bar). Month selector at top.

### Session 4.2 — Revenue chart

12-month bar chart with toggle for 6M / YTD / ALL. Use Recharts. Source data: payments received, grouped by month.

### Session 4.3 — Recurring vs one-off donut + expenses breakdown

Two side-by-side cards. Donut shows MRR-ish split. Bars show expenses by category.

### Session 4.4 — Project board (kanban)

Four columns: Lead / In Progress / Review / Done. Draggable cards (use `@dnd-kit`) that update project status on drop. Each card shows client, deadline, value, and paid-to-date progress bar.

### Session 4.5 — Invoices table

Filterable table (All / Sent / Overdue / Paid / Draft). Status badges with neon colors. Inline "mark as paid" action. Click to expand for invoice details.

### Session 4.6 — Cash flow 30 days

Timeline visualization of expected incoming payments in the next 30 days, including projected recurring invoices that haven't been created yet.

**Standard prompt template for each session:**

> Adding the [SECTION NAME] to the dashboard. Style reference: dark mode with neon accents — backgrounds #0b0d10 / #14181d, borders #2a2e34, neon green #bfff3a for primary highlights, teal #3affd1 secondary, pink #ff4d8b for warnings/overdue, purple #c44dff for accents. Rounded corners (20px cards). Sans-serif. Compact spacing.
>
> 1. Create `src/components/dashboard/[section-name].tsx` as a server component
> 2. Fetch data via the Airtable wrapper functions
> 3. Do all aggregation/calculation server-side before rendering
> 4. Use Recharts for charts, shadcn for any interactive bits
> 5. Mount it on the dashboard page in the appropriate grid position
>
> [Paste relevant mockup screenshot]

---

## Phase 5 — Invoice PDF Generation + Email (2 hours)

### Step 5.1 — PDF template

Use `@react-pdf/renderer` to build an invoice template component. Include your logo/name, client info, line items (pulled from project), totals, payment terms, bank details.

### Step 5.2 — Send invoice flow

Button on invoice row → server action → generates PDF → uploads to Railway volume or S3 → sends via Resend to client email → updates invoice status to "Sent" and records `pdf_url` in Airtable.

**Claude Code prompt:**

> Building invoice PDF generation and email sending.
>
> 1. Create `src/components/invoice-pdf.tsx` with a `@react-pdf/renderer` template that takes an invoice object and renders a professional invoice.
>
> 2. Create a server action `sendInvoice(invoiceId)` that: fetches invoice + project + client, generates the PDF, sends via Resend to the client email with the PDF attached, updates invoice status to "Sent", writes the PDF URL back to Airtable.
>
> 3. Add a "Send Invoice" button to draft invoices in the dashboard.
>
> 4. Add a "Download PDF" button to all invoices.

---

## Phase 6 — Automations (1–2 hours)

### Step 6.1 — Recurring invoice generator

Cron job that runs on the 1st of each month. Finds all projects where `status = In Progress` and `payment_structure = recurring_monthly`. Creates a new invoice for each. Use Railway cron or Vercel cron if you move later.

### Step 6.2 — Overdue detection

Daily job that finds invoices where `due_date < today` and `status = Sent`. Updates their status to `Overdue`. Optionally sends you an alert.

### Step 6.3 — Tax set-aside tracker (optional)

Every time an invoice is paid, auto-create an expense record tagged "Tax reserve" for your tax percentage. Gives you a running total of what you should have set aside.

---

## Phase 7 — Polish (ongoing)

Things to add as you live with the dashboard:

- Keyboard shortcuts (`n` → new invoice, `e` → new expense)
- Dark/light mode toggle (you picked dark, but nice to have)
- Export to CSV for tax time
- Client leaderboard / revenue by client
- Time tracking integration (Toggl or manual)
- Goals editor (set YTD target in UI instead of hardcoded)
- Mobile-responsive layout for quick entries on your phone
- Weekly/monthly email digest sent to yourself

---

## Recovery / Resume Notes

If you pause for weeks and come back confused, here's how to restart:

1. Check which phase you finished last (look at your commit log)
2. Open the next phase, read the goal
3. Paste the prompt into Claude Code
4. If something broke in between, run `npm install` and check env vars first

---

## Rough Time Budget

| Phase | Time | Can do in sitting? |
|---|---|---|
| Phase 0 | 30 min | Yes |
| Phase 1 | 1–2 hrs | Yes |
| Phase 2 | 1 hr | Yes |
| Phase 3 | 3–4 hrs | Split over 2 sittings |
| Phase 4 | 6–12 hrs total | One session per subsection |
| Phase 5 | 2 hrs | Yes |
| Phase 6 | 1–2 hrs | Yes |
| Phase 7 | Ongoing | As you feel |

**Total minimum viable dashboard: ~15 hours of focused work, spread however you want.**

Ship Phase 4.1 + 4.5 first (hero cards + invoices table) and you already have a useful tool. Everything else is upgrades.
