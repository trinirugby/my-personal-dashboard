"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { Invoice } from "@/lib/airtable";

type Props = { invoices: Invoice[] };

const RECURRING_TYPES = new Set(["recurring"]);

export function RevenueSplit({ invoices }: Props) {
  const { recurring, oneOff, total } = useMemo(() => {
    const paid = invoices.filter(i => i.Status === "Paid");
    const rec = paid.filter(i => RECURRING_TYPES.has(i["Invoice Type"] ?? "")).reduce((s, i) => s + (i.Amount ?? 0), 0);
    const one = paid.filter(i => !RECURRING_TYPES.has(i["Invoice Type"] ?? "")).reduce((s, i) => s + (i.Amount ?? 0), 0);
    return { recurring: rec, oneOff: one, total: rec + one };
  }, [invoices]);

  const data = [
    { name: "Recurring", value: recurring, color: "#bfff3a" },
    { name: "One-off", value: oneOff, color: "#3affd1" },
  ];

  const recPct = total === 0 ? 0 : Math.round((recurring / total) * 100);
  const onePct = total === 0 ? 0 : 100 - recPct;

  return (
    <div className="bg-[#14181d] border border-[#2a2e34] rounded-[20px] p-5">
      <p className="text-sm font-medium text-white mb-3">Recurring vs one-off</p>
      <div className="flex justify-center">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={36}
              outerRadius={52}
              dataKey="value"
              strokeWidth={0}
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [`$${Number(v).toLocaleString()}`, ""]}
              contentStyle={{ background: "#14181d", border: "1px solid #2a2e34", borderRadius: 12, fontSize: 11 }}
              itemStyle={{ color: "#fff" }}
              labelStyle={{ display: "none" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-2 mt-1">
        <div className="flex justify-between text-xs">
          <span className="text-[#bfff3a]">● Recurring</span>
          <span className="text-white">${recurring.toLocaleString()} · {recPct}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#3affd1]">● One-off</span>
          <span className="text-white">${oneOff.toLocaleString()} · {onePct}%</span>
        </div>
      </div>
    </div>
  );
}
