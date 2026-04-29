"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { HeroCards } from "@/components/dashboard/hero-cards";
import { MrrCard } from "@/components/dashboard/mrr-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { BusinessCounters } from "@/components/dashboard/business-counters";
import { ServiceTypeSplit } from "@/components/dashboard/service-type-split";
import { ExpensesBreakdown } from "@/components/dashboard/expenses-breakdown";
import { ProjectBoard } from "@/components/dashboard/project-board";
import { InvoicesTable, type InvoiceStatusFilter } from "@/components/dashboard/invoices-table";
import { Cashflow } from "@/components/dashboard/cashflow";
import { TopClients } from "@/components/dashboard/top-clients";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ExpensesList } from "@/components/dashboard/expenses-list";
import type { Client, Project, Invoice, Expense } from "@/lib/airtable";

type Props = {
  clients: Client[];
  projects: Project[];
  invoices: Invoice[];
  expenses: Expense[];
};

export function DashboardShell({ clients, projects, invoices, expenses }: Props) {
  const [expenseCategory, setExpenseCategory] = useState<string | null>(null);
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatusFilter>("All");
  const [invoiceClient, setInvoiceClient] = useState<string | null>(null);

  const today = format(new Date(), "EEEE, MMMM d");

  const jumpToOverdue = useCallback(() => {
    setInvoiceStatus("Overdue");
    requestAnimationFrame(() => {
      document.getElementById("invoices")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const selectedClient = invoiceClient ? clients.find((c) => c.id === invoiceClient) : null;
  const selectedClientName = selectedClient?.Company || selectedClient?.Name || null;

  return (
    <div className="p-5 max-w-[1400px] mx-auto space-y-3 dashboard-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-1">
        <div>
          <p className="text-xl font-bold text-[#f5f5f5]">MindeloAI Dashboard</p>
          <p className="text-xs text-zinc-500 mt-0.5">{today}</p>
        </div>
        <QuickActions clients={clients} projects={projects} />
      </div>

      {/* Row 1: Hero cards */}
      <HeroCards invoices={invoices} expenses={expenses} />

      {/* Row 2: Revenue chart + counters + service mix + MRR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <RevenueChart invoices={invoices} expenses={expenses} />
        <BusinessCounters clients={clients} projects={projects} invoices={invoices} onJumpToOverdue={jumpToOverdue} />
        <div className="grid grid-cols-1 gap-3">
          <MrrCard projects={projects} invoices={invoices} />
          <ServiceTypeSplit projects={projects} invoices={invoices} />
        </div>
      </div>

      {/* Row 3: Project board */}
      <ProjectBoard projects={projects} clients={clients} />

      {/* Row 4: Invoices + cashflow + top clients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <InvoicesTable
            invoices={invoices}
            projects={projects}
            statusFilter={invoiceStatus}
            onStatusFilterChange={setInvoiceStatus}
            clientFilter={invoiceClient}
            onClearClientFilter={() => setInvoiceClient(null)}
            clientName={selectedClientName}
          />
        </div>
        <div className="grid grid-cols-1 gap-3">
          <Cashflow invoices={invoices} projects={projects} />
          <TopClients
            clients={clients}
            invoices={invoices}
            projects={projects}
            selectedClientId={invoiceClient}
            onSelectClient={setInvoiceClient}
          />
        </div>
      </div>

      {/* Row 5: Expenses breakdown + list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <ExpensesBreakdown
          expenses={expenses}
          selectedCategory={expenseCategory}
          onSelectCategory={setExpenseCategory}
        />
        <div className="lg:col-span-2">
          <ExpensesList
            expenses={expenses}
            categoryFilter={expenseCategory}
            onClearCategoryFilter={() => setExpenseCategory(null)}
          />
        </div>
      </div>
    </div>
  );
}
