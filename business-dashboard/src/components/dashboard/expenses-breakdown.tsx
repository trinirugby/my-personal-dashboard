"use client";

import { useMemo } from "react";
import type { Expense } from "@/lib/airtable";

type Props = { expenses: Expense[] };

const CATEGORY_COLORS: Record<string, string> = {
  Software: "#ff4d8b",
  Subcontractors: "#c44dff",
  Hosting: "#4d9fff",
  Hardware: "#3affd1",
  Marketing: "#bfff3a",
  Other: "#5a5f67",
};

export function ExpensesBreakdown({ expenses }: Props) {
  const { byCategory, total } = useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of expenses) {
      const cat = exp.Category ?? "Other";
      map.set(cat, (map.get(cat) ?? 0) + (exp.Amount ?? 0));
    }
    const sorted = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount]) => ({ name, amount }));
    const total = sorted.reduce((s, c) => s + c.amount, 0);
    return { byCategory: sorted, total };
  }, [expenses]);

  return (
    <div className="bg-[#14181d] border border-[#2a2e34] rounded-[20px] p-5">
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm font-medium text-white">Expenses</p>
        <span className="text-xs text-[#ff4d8b]">${total.toLocaleString()}</span>
      </div>
      <div className="space-y-3">
        {byCategory.length === 0 && (
          <p className="text-xs text-zinc-600">No expenses recorded</p>
        )}
        {byCategory.map(({ name, amount }) => {
          const pct = total === 0 ? 0 : Math.round((amount / total) * 100);
          const color = CATEGORY_COLORS[name] ?? "#5a5f67";
          return (
            <div key={name}>
              <div className="flex justify-between text-xs text-zinc-300 mb-1">
                <span>{name}</span>
                <span>${amount.toLocaleString()}</span>
              </div>
              <div className="h-1.5 bg-[#1f242a] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
