import { getInvoices, getProjects, getExpenses, getClients } from "@/lib/airtable";
import { HeroCards } from "@/components/dashboard/hero-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { BusinessCounters } from "@/components/dashboard/business-counters";
import { ExpensesBreakdown } from "@/components/dashboard/expenses-breakdown";
import { ProjectBoard } from "@/components/dashboard/project-board";
import { InvoicesTable } from "@/components/dashboard/invoices-table";
import { Cashflow } from "@/components/dashboard/cashflow";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ExpensesList } from "@/components/dashboard/expenses-list";
import { format } from "date-fns";

export default async function DashboardPage() {
  let invoices, projects, expenses, clients;
  try {
    [invoices, projects, expenses, clients] = await Promise.all([
      getInvoices(),
      getProjects(),
      getExpenses(),
      getClients(),
    ]);
  } catch (err) {
    return (
      <div className="p-10 text-center text-[#ff4d8b] text-sm">
        Failed to load dashboard data. Check your Airtable credentials.
      </div>
    );
  }

  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <div className="p-5 max-w-[1400px] mx-auto space-y-3">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-1">
        <div>
          <p className="text-xl font-bold text-[#f5f5f5]">Michael&apos;s Dashboard</p>
          <p className="text-xs text-zinc-500 mt-0.5">{today}</p>
        </div>
        <QuickActions />
      </div>

      {/* Row 1: Hero cards */}
      <HeroCards invoices={invoices} expenses={expenses} />

      {/* Row 2: Revenue chart + counters + expenses */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <RevenueChart invoices={invoices} expenses={expenses} />
        <BusinessCounters clients={clients} projects={projects} invoices={invoices} />
        <ExpensesBreakdown expenses={expenses} />
      </div>

      {/* Row 3: Project board */}
      <ProjectBoard projects={projects} />

      {/* Row 4: Invoices + cashflow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InvoicesTable invoices={invoices} />
        <Cashflow invoices={invoices} />
      </div>

      {/* Row 5: Expenses list */}
      <ExpensesList expenses={expenses} />

    </div>
  );
}
