import { getInvoices, getProjects, getExpenses, getClients } from "@/lib/airtable";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardPage() {
  let invoices, projects, expenses, clients;
  try {
    [invoices, projects, expenses, clients] = await Promise.all([
      getInvoices(),
      getProjects(),
      getExpenses(),
      getClients(),
    ]);
  } catch {
    return (
      <div className="p-10 text-center text-[#ff4d8b] text-sm">
        Failed to load dashboard data. Check your Airtable credentials.
      </div>
    );
  }

  return (
    <DashboardShell
      clients={clients}
      projects={projects}
      invoices={invoices}
      expenses={expenses}
    />
  );
}
