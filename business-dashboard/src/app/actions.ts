"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import {
  updateInvoice,
  updateProject,
  updateExpense,
  createInvoice,
  createExpense,
  createProject,
  type InvoiceWrite,
  type ProjectWrite,
  type ExpenseWrite,
} from "@/lib/airtable";

export async function markInvoicePaid(invoiceId: string) {
  await updateInvoice(invoiceId, {
    Status: "Paid",
    "Paid Date": format(new Date(), "yyyy-MM-dd"),
  });
  revalidatePath("/dashboard");
}

export async function updateProjectStatus(
  projectId: string,
  status: "Lead" | "In Progress" | "Review" | "Done" | "Cancelled",
) {
  await updateProject(projectId, { Status: status });
  revalidatePath("/dashboard");
}

export async function createInvoiceAction(data: InvoiceWrite) {
  await createInvoice(data);
  revalidatePath("/dashboard");
}

export async function createExpenseAction(data: ExpenseWrite) {
  await createExpense(data);
  revalidatePath("/dashboard");
}

export async function createProjectAction(data: ProjectWrite) {
  await createProject(data);
  revalidatePath("/dashboard");
}

export async function updateExpenseAction(id: string, data: ExpenseWrite) {
  await updateExpense(id, data);
  revalidatePath("/dashboard");
}

export async function updateInvoiceAction(id: string, data: InvoiceWrite) {
  await updateInvoice(id, data);
  revalidatePath("/dashboard");
}

export async function updateProjectAction(id: string, data: ProjectWrite) {
  await updateProject(id, data);
  revalidatePath("/dashboard");
}
