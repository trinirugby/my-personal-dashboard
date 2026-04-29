"use server";

import { revalidatePath } from "next/cache";
import { updateInvoice, updateProject, updateExpense, createInvoice, createExpense, createProject } from "@/lib/airtable";
import { format } from "date-fns";

export async function markInvoicePaid(invoiceId: string) {
  await updateInvoice(invoiceId, {
    Status: "Paid",
    "Paid Date": format(new Date(), "yyyy-MM-dd"),
  });
  revalidatePath("/dashboard");
}

export async function updateProjectStatus(projectId: string, status: "Lead" | "In Progress" | "Review" | "Done" | "Cancelled") {
  await updateProject(projectId, { Status: status });
  revalidatePath("/dashboard");
}

export async function createInvoiceAction(data: {
  "Invoice Number"?: string;
  Amount?: number;
  "Invoice Type"?: string;
  Status?: string;
  "Issue Date"?: string;
  "Due Date"?: string;
  Notes?: string;
}) {
  await createInvoice(data);
  revalidatePath("/dashboard");
}

export async function createExpenseAction(data: {
  Name: string;
  Category?: string;
  Amount?: number;
  Date?: string;
  Recurring?: boolean;
  Notes?: string;
}) {
  await createExpense(data);
  revalidatePath("/dashboard");
}

export async function createProjectAction(data: {
  Name: string;
  Status?: string;
  "Payment Structure"?: string;
  "Total Value"?: number;
  "Start Date"?: string;
  Notes?: string;
  Owner?: string;
  "Service Type"?: string;
}) {
  await createProject(data);
  revalidatePath("/dashboard");
}

export async function updateExpenseAction(id: string, data: {
  Name?: string;
  Category?: string;
  Amount?: number;
  Date?: string;
  Recurring?: boolean;
  Notes?: string;
}) {
  await updateExpense(id, data);
  revalidatePath("/dashboard");
}

export async function updateInvoiceAction(id: string, data: {
  "Invoice Number"?: string;
  Amount?: number;
  "Invoice Type"?: string;
  Status?: string;
  "Issue Date"?: string;
  "Due Date"?: string;
  "Paid Date"?: string;
  Notes?: string;
}) {
  await updateInvoice(id, data);
  revalidatePath("/dashboard");
}

export async function updateProjectAction(id: string, data: {
  Name?: string;
  Status?: string;
  "Payment Structure"?: string;
  "Total Value"?: number;
  "Start Date"?: string;
  "End Date"?: string;
  Notes?: string;
  Owner?: string;
  "Service Type"?: string;
}) {
  await updateProject(id, data);
  revalidatePath("/dashboard");
}
