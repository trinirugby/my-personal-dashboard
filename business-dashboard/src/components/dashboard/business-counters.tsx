"use client";

import type { Client, Project, Invoice } from "@/lib/airtable";

type Props = { clients: Client[]; projects: Project[]; invoices: Invoice[] };

export function BusinessCounters({ clients, projects, invoices }: Props) {
  const activeClients = clients.filter(c => c.Status === "Active" || !c.Status).length;
  const activeProjects = projects.filter(p => p.Status === "In Progress" || p.Status === "Review").length;
  const leads = projects.filter(p => p.Status === "Lead").length;
  const doneProjects = projects.filter(p => p.Status === "Done").length;

  const overdueInvoices = invoices.filter(i => i.Status === "Overdue");
  const overdueCount = overdueInvoices.length;
  const overdueAmount = overdueInvoices.reduce((s, i) => s + (i.Amount ?? 0), 0);

  const pipelineValue = projects
    .filter(p => p.Status === "Lead" || p.Status === "In Progress" || p.Status === "Review")
    .reduce((s, p) => s + (p["Total Value"] ?? 0), 0);

  const winRate = (() => {
    const closed = projects.filter(p => p.Status === "Done" || p.Status === "Cancelled").length;
    if (closed === 0) return null;
    return Math.round((doneProjects / closed) * 100);
  })();

  return (
    <div className="bg-[#14181d] border border-[#2a2e34] rounded-[20px] p-5 flex flex-col gap-4">
      <p className="text-sm font-semibold text-white">At a glance</p>

      {/* Counts */}
      <div className="flex flex-col gap-2.5">
        {[
          { label: "Clients", value: String(activeClients), color: "#3affd1" },
          { label: "Active projects", value: String(activeProjects), color: "#bfff3a" },
          { label: "Leads", value: String(leads), color: "#c44dff" },
          { label: "Completed", value: String(doneProjects), color: "#4d9fff" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-xs text-zinc-400">{label}</span>
            </div>
            <span className="text-sm font-semibold text-white tabular-nums">{value}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-[#2a2e34]" />

      {/* Values */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">Pipeline value</span>
          <span className="text-sm font-semibold text-white">${pipelineValue.toLocaleString()}</span>
        </div>
        {winRate !== null && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Win rate</span>
            <span className="text-sm font-semibold text-white">{winRate}%</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {overdueCount > 0 && <div className="w-1.5 h-1.5 rounded-full bg-[#ff4d8b] animate-pulse shrink-0" />}
            <span className="text-xs text-zinc-400">Overdue invoices</span>
          </div>
          <span className="text-sm font-semibold tabular-nums" style={{ color: overdueCount > 0 ? "#ff4d8b" : "#52525b" }}>
            {overdueCount > 0 ? `${overdueCount} · $${overdueAmount.toLocaleString()}` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
