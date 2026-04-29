"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { createInvoiceAction, createExpenseAction, createProjectAction } from "@/app/actions";

type Modal = "invoice" | "expense" | "project" | null;

function Modal({ title, accent, onClose, children }: {
  title: string;
  accent: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div ref={ref} className="bg-[#14181d] border border-[#2a2e34] rounded-[20px] p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold text-white">{title}</p>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-zinc-400">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-[#0b0d10] border border-[#2a2e34] rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors";
const selectCls = inputCls + " cursor-pointer";

function SubmitRow({ pending, onClose, accent }: { pending: boolean; onClose: () => void; accent: string }) {
  return (
    <div className="flex gap-2 justify-end mt-6">
      <button type="button" onClick={onClose} className="text-xs px-4 py-2 rounded-xl border border-[#2a2e34] text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
        Cancel
      </button>
      <button
        type="submit"
        disabled={pending}
        className="text-xs px-4 py-2 rounded-xl font-semibold disabled:opacity-40 transition-colors"
        style={{ background: accent, color: "#000" }}
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

function InvoiceModal({ onClose }: { onClose: () => void }) {
  const [pending, start] = useTransition();
  const today = format(new Date(), "yyyy-MM-dd");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = fd.get("amount") as string;
    start(async () => {
      try {
        await createInvoiceAction({
          "Invoice Number": (fd.get("invoiceNumber") as string) || undefined,
          Amount: amount ? parseFloat(amount) : undefined,
          "Invoice Type": (fd.get("invoiceType") as string) || undefined,
          Status: (fd.get("status") as string) || "Draft",
          "Issue Date": (fd.get("issueDate") as string) || undefined,
          "Due Date": (fd.get("dueDate") as string) || undefined,
          Notes: (fd.get("notes") as string) || undefined,
        });
        toast.success("Invoice created");
        onClose();
      } catch {
        toast.error("Failed to create invoice");
      }
    });
  }

  return (
    <Modal title="New Invoice" accent="#bfff3a" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Invoice Number">
            <input name="invoiceNumber" placeholder="INV-0009" className={inputCls} />
          </Field>
          <Field label="Amount ($)">
            <input name="amount" type="number" min="0" step="0.01" placeholder="0.00" className={inputCls} required />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Type">
            <select name="invoiceType" className={selectCls} defaultValue="">
              <option value="" disabled>Select…</option>
              <option value="deposit">Deposit</option>
              <option value="milestone">Milestone</option>
              <option value="final">Final</option>
              <option value="recurring">Recurring</option>
              <option value="one_off">One-off</option>
            </select>
          </Field>
          <Field label="Status">
            <select name="status" className={selectCls} defaultValue="Draft">
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Void">Void</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Issue Date">
            <input name="issueDate" type="date" defaultValue={today} className={inputCls} />
          </Field>
          <Field label="Due Date">
            <input name="dueDate" type="date" className={inputCls} />
          </Field>
        </div>
        <Field label="Notes">
          <input name="notes" placeholder="Optional" className={inputCls} />
        </Field>
        <SubmitRow pending={pending} onClose={onClose} accent="#bfff3a" />
      </form>
    </Modal>
  );
}

function ExpenseModal({ onClose }: { onClose: () => void }) {
  const [pending, start] = useTransition();
  const today = format(new Date(), "yyyy-MM-dd");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = fd.get("amount") as string;
    start(async () => {
      try {
        await createExpenseAction({
          Name: fd.get("name") as string,
          Category: (fd.get("category") as string) || undefined,
          Amount: amount ? parseFloat(amount) : undefined,
          Date: (fd.get("date") as string) || undefined,
          Recurring: fd.get("recurring") === "on",
          Notes: (fd.get("notes") as string) || undefined,
        });
        toast.success("Expense created");
        onClose();
      } catch {
        toast.error("Failed to create expense");
      }
    });
  }

  return (
    <Modal title="New Expense" accent="#ff4d8b" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Name">
            <input name="name" placeholder="e.g. Figma subscription" className={inputCls} required />
          </Field>
          <Field label="Amount ($)">
            <input name="amount" type="number" min="0" step="0.01" placeholder="0.00" className={inputCls} required />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Category">
            <select name="category" className={selectCls} defaultValue="">
              <option value="" disabled>Select…</option>
              <option value="Software">Software</option>
              <option value="Subcontractors">Subcontractors</option>
              <option value="Hosting">Hosting</option>
              <option value="Hardware">Hardware</option>
              <option value="Marketing">Marketing</option>
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Date">
            <input name="date" type="date" defaultValue={today} className={inputCls} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
          <input name="recurring" type="checkbox" className="w-3.5 h-3.5 accent-[#bfff3a]" />
          Recurring expense
        </label>
        <Field label="Notes">
          <input name="notes" placeholder="Optional" className={inputCls} />
        </Field>
        <SubmitRow pending={pending} onClose={onClose} accent="#ff4d8b" />
      </form>
    </Modal>
  );
}

function ProjectModal({ onClose }: { onClose: () => void }) {
  const [pending, start] = useTransition();
  const today = format(new Date(), "yyyy-MM-dd");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const totalValue = fd.get("totalValue") as string;
    start(async () => {
      try {
        await createProjectAction({
          Name: fd.get("name") as string,
          Status: (fd.get("status") as string) || "Lead",
          "Payment Structure": (fd.get("paymentStructure") as string) || undefined,
          "Total Value": totalValue ? parseFloat(totalValue) : undefined,
          "Start Date": (fd.get("startDate") as string) || undefined,
          Notes: (fd.get("notes") as string) || undefined,
          Owner: (fd.get("owner") as string) || undefined,
          "Service Type": (fd.get("serviceType") as string) || undefined,
        });
        toast.success("Project created");
        onClose();
      } catch {
        toast.error("Failed to create project");
      }
    });
  }

  return (
    <Modal title="New Project" accent="#c44dff" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Project Name">
          <input name="name" placeholder="e.g. Brand redesign for Acme" className={inputCls} required />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Status">
            <select name="status" className={selectCls} defaultValue="Lead">
              <option value="Lead">Lead</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Done">Done</option>
            </select>
          </Field>
          <Field label="Payment Structure">
            <select name="paymentStructure" className={selectCls} defaultValue="">
              <option value="" disabled>Select…</option>
              <option value="one_time">One-time</option>
              <option value="deposit_final">Deposit + Final</option>
              <option value="milestones">Milestones</option>
              <option value="recurring_monthly">Recurring monthly</option>
              <option value="recurring_custom">Recurring custom</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Total Value ($)">
            <input name="totalValue" type="number" min="0" step="0.01" placeholder="0.00" className={inputCls} />
          </Field>
          <Field label="Start Date">
            <input name="startDate" type="date" defaultValue={today} className={inputCls} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Owner">
            <select name="owner" className={selectCls} defaultValue="">
              <option value="">—</option>
              <option value="M">M</option>
              <option value="Partner">Partner</option>
              <option value="Both">Both</option>
            </select>
          </Field>
          <Field label="Service Type">
            <select name="serviceType" className={selectCls} defaultValue="">
              <option value="">—</option>
              <option value="Web Dev">Web Dev</option>
              <option value="AI Automation">AI Automation</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </Field>
        </div>
        <Field label="Notes">
          <input name="notes" placeholder="Optional" className={inputCls} />
        </Field>
        <SubmitRow pending={pending} onClose={onClose} accent="#c44dff" />
      </form>
    </Modal>
  );
}

export function QuickActions() {
  const [open, setOpen] = useState<Modal>(null);

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setOpen("invoice")}
          className="text-xs px-3 py-1.5 bg-[#1a1d22] text-[#bfff3a] border border-[#2a2e34] rounded-full font-medium hover:bg-[#2a2e34] transition-colors"
        >
          + Invoice
        </button>
        <button
          onClick={() => setOpen("expense")}
          className="text-xs px-3 py-1.5 bg-[#1a1d22] text-zinc-400 border border-[#2a2e34] rounded-full hover:text-white hover:bg-[#2a2e34] transition-colors"
        >
          + Expense
        </button>
        <button
          onClick={() => setOpen("project")}
          className="text-xs px-3 py-1.5 bg-[#1a1d22] text-zinc-400 border border-[#2a2e34] rounded-full hover:text-white hover:bg-[#2a2e34] transition-colors"
        >
          + Project
        </button>
      </div>

      {open === "invoice" && <InvoiceModal onClose={() => setOpen(null)} />}
      {open === "expense" && <ExpenseModal onClose={() => setOpen(null)} />}
      {open === "project" && <ProjectModal onClose={() => setOpen(null)} />}
    </>
  );
}
