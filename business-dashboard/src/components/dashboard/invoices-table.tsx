"use client";

import { useState, useTransition, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { markInvoicePaid, updateInvoiceAction } from "@/app/actions";
import type { Invoice } from "@/lib/airtable";

type Props = { invoices: Invoice[] };
type Filter = "All" | "Sent" | "Overdue" | "Paid" | "Draft";

const STATUS_STYLES: Record<string, string> = {
  Paid: "bg-[#bfff3a]/10 text-[#bfff3a] border-[#bfff3a]/20",
  Sent: "bg-[#3affd1]/10 text-[#3affd1] border-[#3affd1]/20",
  Overdue: "bg-[#ff4d8b]/10 text-[#ff4d8b] border-[#ff4d8b]/20",
  Draft: "bg-zinc-800 text-zinc-400 border-zinc-700",
  Void: "bg-[#c44dff]/10 text-[#c44dff] border-[#c44dff]/20",
};

const TYPE_LABELS: Record<string, string> = {
  deposit: "Deposit",
  milestone: "Milestone",
  final: "Final",
  recurring: "Recurring",
  one_off: "One-off",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[status] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
      {status}
    </span>
  );
}

function MarkPaidButton({ invoiceId }: { invoiceId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);
  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        disabled={pending}
        onClick={(e) => {
          e.stopPropagation();
          setError(false);
          startTransition(async () => {
            try {
              await markInvoicePaid(invoiceId);
            } catch {
              setError(true);
            }
          });
        }}
        className="text-xs px-2.5 py-1 rounded-lg bg-[#bfff3a]/10 text-[#bfff3a] border border-[#bfff3a]/20 hover:bg-[#bfff3a]/20 disabled:opacity-40 transition-colors"
      >
        {pending ? "Saving…" : "Mark paid"}
      </button>
      {error && <span className="text-[10px] text-[#ff4d8b]">Failed</span>}
    </div>
  );
}

const inputCls = "w-full bg-[#0b0d10] border border-[#2a2e34] rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors";
const selectCls = inputCls + " cursor-pointer";

function EditInvoiceModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = fd.get("amount") as string;
    setError(false);
    start(async () => {
      try {
        await updateInvoiceAction(invoice.id, {
          "Invoice Number": (fd.get("invoiceNumber") as string) || undefined,
          Amount: amount ? parseFloat(amount) : undefined,
          "Invoice Type": (fd.get("invoiceType") as string) || undefined,
          Status: (fd.get("status") as string) || undefined,
          "Issue Date": (fd.get("issueDate") as string) || undefined,
          "Due Date": (fd.get("dueDate") as string) || undefined,
          Notes: (fd.get("notes") as string) || undefined,
        });
        onClose();
      } catch {
        setError(true);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-[#14181d] border border-[#2a2e34] rounded-[20px] p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold text-white">Edit Invoice</p>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400">Invoice Number</label>
              <input name="invoiceNumber" defaultValue={invoice["Invoice Number"] ?? ""} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400">Amount ($)</label>
              <input name="amount" type="number" min="0" step="0.01" defaultValue={invoice.Amount ?? ""} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400">Type</label>
              <select name="invoiceType" defaultValue={invoice["Invoice Type"] ?? ""} className={selectCls}>
                <option value="">—</option>
                <option value="deposit">Deposit</option>
                <option value="milestone">Milestone</option>
                <option value="final">Final</option>
                <option value="recurring">Recurring</option>
                <option value="one_off">One-off</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400">Status</label>
              <select name="status" defaultValue={invoice.Status ?? "Draft"} className={selectCls}>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
                <option value="Void">Void</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400">Issue Date</label>
              <input name="issueDate" type="date" defaultValue={invoice["Issue Date"] ?? ""} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400">Due Date</label>
              <input name="dueDate" type="date" defaultValue={invoice["Due Date"] ?? ""} className={inputCls} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400">Notes</label>
            <input name="notes" defaultValue={invoice.Notes ?? ""} placeholder="Optional" className={inputCls} />
          </div>
          {error && <p className="text-xs text-[#ff4d8b]">Failed to save. Try again.</p>}
          <div className="flex gap-2 justify-end mt-2">
            <button type="button" onClick={onClose} className="text-xs px-4 py-2 rounded-xl border border-[#2a2e34] text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="text-xs px-4 py-2 rounded-xl font-semibold bg-[#bfff3a] text-black disabled:opacity-40 transition-colors hover:bg-[#bfff3a]/80">
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function InvoicesTable({ invoices }: Props) {
  const [filter, setFilter] = useState<Filter>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const filtered = invoices
    .filter((inv) => filter === "All" ? true : inv.Status === filter)
    .sort((a, b) => {
      const dateA = a["Issue Date"] ?? a["Due Date"] ?? "";
      const dateB = b["Issue Date"] ?? b["Due Date"] ?? "";
      return dateB.localeCompare(dateA);
    });

  const filters: Filter[] = ["All", "Sent", "Overdue", "Paid", "Draft"];

  return (
    <div className="bg-[#14181d] border border-[#2a2e34] rounded-[20px] p-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">Invoices</p>
        <div className="flex flex-wrap gap-1 bg-[#0b0d10] rounded-xl p-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-[#bfff3a] text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-[#2a2e34]">
              <th className="text-left pb-3 font-medium">Invoice</th>
              <th className="text-left pb-3 font-medium">Type</th>
              <th className="text-right pb-3 font-medium">Amount</th>
              <th className="text-left pb-3 font-medium pl-6">Due</th>
              <th className="text-left pb-3 font-medium">Status</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2e34]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-zinc-600 text-sm">
                  No invoices
                </td>
              </tr>
            ) : (
              filtered.map((inv) => {
                const isExpanded = expandedId === inv.id;
                return (
                  <>
                    <tr
                      key={inv.id}
                      onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <td className="py-3 font-mono text-zinc-300 text-xs font-semibold">
                        {inv["Invoice Number"] ?? "—"}
                      </td>
                      <td className="py-3 text-zinc-400">
                        {TYPE_LABELS[inv["Invoice Type"] ?? ""] ?? inv["Invoice Type"] ?? "—"}
                      </td>
                      <td className="py-3 text-right font-semibold text-white">
                        ${(inv.Amount ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3 pl-6 text-zinc-400">
                        {inv["Due Date"] ? format(parseISO(inv["Due Date"]), "MMM d") : "—"}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={inv.Status ?? "Draft"} />
                      </td>
                      <td className="py-3 text-right">
                        {(inv.Status === "Sent" || inv.Status === "Overdue") && (
                          <MarkPaidButton invoiceId={inv.id} />
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${inv.id}-detail`} className="bg-[#0b0d10]/60">
                        <td colSpan={6} className="px-2 pb-3 pt-1">
                          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-xs text-zinc-400">
                            {inv["Issue Date"] && (
                              <span><span className="text-zinc-600 mr-1">Issued</span>{format(parseISO(inv["Issue Date"]), "MMM d, yyyy")}</span>
                            )}
                            {inv["Payment Method"] && (
                              <span><span className="text-zinc-600 mr-1">Via</span>{inv["Payment Method"]}</span>
                            )}
                            {inv["Paid Date"] && (
                              <span><span className="text-zinc-600 mr-1">Paid</span>{format(parseISO(inv["Paid Date"]), "MMM d, yyyy")}</span>
                            )}
                            {inv.Notes ? (
                              <span className="text-zinc-300"><span className="text-zinc-600 mr-1">Notes</span>{inv.Notes}</span>
                            ) : (
                              <span className="text-zinc-600 italic">No notes</span>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingInvoice(inv); }}
                              className="ml-auto text-xs px-2.5 py-1 rounded-lg border border-[#2a2e34] text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {editingInvoice && <EditInvoiceModal invoice={editingInvoice} onClose={() => setEditingInvoice(null)} />}
    </div>
  );
}
