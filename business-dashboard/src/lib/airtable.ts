import Airtable from "airtable";
import { z } from "zod";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
);

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const ClientSchema = z.object({
  id: z.string(),
  Name: z.string(),
  Company: z.string().optional(),
  Email: z.string().optional(),
  Phone: z.string().optional(),
  Status: z.enum(["Active", "Inactive", "Lead"]).optional(),
  Notes: z.string().optional(),
  Created: z.string().optional(),
});
export type Client = z.infer<typeof ClientSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  Name: z.string(),
  Client: z.array(z.string()).optional(),
  Status: z
    .enum(["Lead", "In Progress", "Review", "Done", "Cancelled"])
    .optional(),
  "Payment Structure": z
    .enum([
      "one_time",
      "deposit_final",
      "milestones",
      "recurring_monthly",
      "recurring_custom",
    ])
    .optional(),
  "Total Value": z.number().optional(),
  "Recurring Amount": z.number().optional(),
  "Recurring Frequency": z.enum(["monthly", "quarterly", "yearly"]).optional(),
  "Deposit Percentage": z.number().optional(),
  "Start Date": z.string().optional(),
  "End Date": z.string().optional(),
  "Paid To Date": z.number().optional(),
  "Balance Remaining": z.number().optional(),
  Notes: z.string().optional(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const InvoiceSchema = z.object({
  id: z.string(),
  "Invoice Number": z.string().optional(),
  Project: z.array(z.string()).optional(),
  Client: z.array(z.string()).optional(),
  Amount: z.number().optional(),
  "Invoice Type": z
    .enum(["deposit", "milestone", "final", "recurring", "one_off"])
    .optional(),
  Status: z
    .enum(["Draft", "Sent", "Paid", "Overdue", "Void"])
    .optional(),
  "Issue Date": z.string().optional(),
  "Due Date": z.string().optional(),
  "Paid Date": z.string().optional(),
  "Payment Method": z
    .enum(["Bank", "PayPal", "Stripe", "Cash", "Other"])
    .optional(),
  "PDF URL": z.string().optional(),
  Notes: z.string().optional(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

export const ExpenseSchema = z.object({
  id: z.string(),
  Name: z.string(),
  Category: z
    .enum([
      "Software",
      "Subcontractors",
      "Hosting",
      "Hardware",
      "Marketing",
      "Other",
    ])
    .optional(),
  Amount: z.number().optional(),
  Date: z.string().optional(),
  Recurring: z.boolean().optional(),
  Notes: z.string().optional(),
});
export type Expense = z.infer<typeof ExpenseSchema>;

export const MilestoneSchema = z.object({
  id: z.string(),
  Name: z.string(),
  Project: z.array(z.string()).optional(),
  Amount: z.number().optional(),
  Order: z.number().optional(),
  Status: z.enum(["Pending", "Triggered", "Invoiced"]).optional(),
  "Triggered Date": z.string().optional(),
});
export type Milestone = z.infer<typeof MilestoneSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseRecord<T>(
  record: Airtable.Record<Airtable.FieldSet>,
  schema: z.ZodType<T>
): T | null {
  try {
    return schema.parse({ id: record.id, ...record.fields });
  } catch {
    return null;
  }
}

async function fetchAll<T>(
  table: string,
  schema: z.ZodType<T>,
  opts: Airtable.SelectOptions<Airtable.FieldSet> = {}
): Promise<T[]> {
  const records = await base(table).select(opts).all();
  return records.map((r) => parseRecord(r, schema)).filter((r): r is T => r !== null);
}

// ─── Read functions ───────────────────────────────────────────────────────────

export const getClients = (opts?: Airtable.SelectOptions<Airtable.FieldSet>) =>
  fetchAll("Clients", ClientSchema, opts);

export const getProjects = (opts?: Airtable.SelectOptions<Airtable.FieldSet>) =>
  fetchAll("Projects", ProjectSchema, opts);

export const getInvoices = (opts?: Airtable.SelectOptions<Airtable.FieldSet>) =>
  fetchAll("Invoices", InvoiceSchema, opts);

export const getExpenses = (opts?: Airtable.SelectOptions<Airtable.FieldSet>) =>
  fetchAll("Expenses", ExpenseSchema, opts);

export const getMilestones = (
  opts?: Airtable.SelectOptions<Airtable.FieldSet>
) => fetchAll("Milestones", MilestoneSchema, opts);

// ─── Write functions ──────────────────────────────────────────────────────────

type Fields = Record<string, unknown>;

async function create<T>(
  table: string,
  schema: z.ZodType<T>,
  fields: Fields
): Promise<T> {
  const record = await base(table).create(fields as Airtable.FieldSet);
  const parsed = parseRecord(record, schema);
  if (!parsed) throw new Error(`Failed to parse created ${table} record`);
  return parsed;
}

async function update<T>(
  table: string,
  schema: z.ZodType<T>,
  id: string,
  fields: Fields
): Promise<T> {
  const record = await base(table).update(id, fields as Airtable.FieldSet);
  const parsed = parseRecord(record, schema);
  if (!parsed) throw new Error(`Failed to parse updated ${table} record`);
  return parsed;
}

export const createClient = (fields: Omit<Fields, "id">) =>
  create("Clients", ClientSchema, fields);

export const createProject = (fields: Omit<Fields, "id">) =>
  create("Projects", ProjectSchema, fields);

export const createInvoice = (fields: Omit<Fields, "id">) =>
  create("Invoices", InvoiceSchema, fields);

export const createExpense = (fields: Omit<Fields, "id">) =>
  create("Expenses", ExpenseSchema, fields);

export const updateInvoice = (id: string, fields: Omit<Fields, "id">) =>
  update("Invoices", InvoiceSchema, id, fields);

export const updateProject = (id: string, fields: Omit<Fields, "id">) =>
  update("Projects", ProjectSchema, id, fields);

export const updateExpense = (id: string, fields: Omit<Fields, "id">) =>
  update("Expenses", ExpenseSchema, id, fields);
