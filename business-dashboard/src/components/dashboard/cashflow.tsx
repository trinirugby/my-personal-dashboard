"use client";

import { useMemo } from "react";
import { parseISO, isAfter, addDays, format, isBefore } from "date-fns";
import type { Invoice } from "@/lib/airtable";

type Props = { invoices: Invoice[] };

const DOT_COLORS = ["#3affd1", "#bfff3a", "#c44dff", "#ff4d8b", "#4d9fff"];

export function Cashflow({ invoices }: Props) {
  const { upcoming, total } = useMemo(() => {
    const now = new Date();
    const cutoff = addDays(now, 30);
    const upcoming = invoices
      .filter(i => {
        if (i.Status !== "Sent" && i.Status !== "Overdue") return false;
        if (!i["Due Date"]) return false;
        const d = parseISO(i["Due Date"]);
        return !isBefore(d, now) && !isAfter(d, cutoff);
      })
      .sort((a, b) => parseISO(a["Due Date"]!).getTime() - parseISO(b["Due Date"]!).getTime());
    const total = upcoming.reduce((s, i) => s + (i.Amount ?? 0), 0);
    return { upcoming, total };
  }, [invoices]);

  // Build timeline dots
  const now = new Date();
  const timelineDots = upcoming.slice(0, 5).map((inv, idx) => {
    const d = parseISO(inv["Due Date"]!);
    const daysDiff = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const pct = Math.min(95, Math.max(5, (daysDiff / 30) * 100));
    return { inv, pct, color: DOT_COLORS[idx % DOT_COLORS.length] };
  });

  return (
    <div className="bg-[#14181d] border border-[#2a2e34] rounded-[20px] p-5">
      <p className="text-sm font-medium text-white mb-1">Next 30 days</p>
      <p className="text-xs text-zinc-500 mb-3">Expected cash in</p>
      <p className="text-2xl font-medium text-[#bfff3a]">${total.toLocaleString()}</p>

      {/* Timeline */}
      <div className="relative mt-4 mb-2" style={{ height: 60 }}>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-[#2a2e34]" />
        {timelineDots.map(({ inv, pct, color }, idx) => (
          <div key={inv.id} className="absolute" style={{ left: `${pct}%`, bottom: 0, transform: "translateX(-50%)" }}>
            <div className="w-2 h-2 rounded-full mb-1 mx-auto" style={{ background: color }} />
            <div className="h-6 w-px mx-auto" style={{ background: color, opacity: 0.4 }} />
            <p className="text-[8px] text-zinc-500 text-center whitespace-nowrap mt-1">
              {format(parseISO(inv["Due Date"]!), "MMM d")}
            </p>
          </div>
        ))}
      </div>

      {/* List */}
      {upcoming.length === 0 ? (
        <p className="text-xs text-zinc-600 mt-4">No upcoming payments in 30 days</p>
      ) : (
        <div className="mt-4 pt-3 border-t border-[#1f242a] space-y-2">
          {upcoming.slice(0, 4).map((inv, idx) => (
            <div key={inv.id} className="flex justify-between text-xs">
              <span className="text-zinc-400">
                {format(parseISO(inv["Due Date"]!), "MMM d")} · {inv["Invoice Number"] ?? "—"}
              </span>
              <span style={{ color: DOT_COLORS[idx % DOT_COLORS.length] }} className="font-medium">
                ${(inv.Amount ?? 0).toLocaleString()}
              </span>
            </div>
          ))}
          {upcoming.length > 4 && (
            <p className="text-[10px] text-zinc-600">+{upcoming.length - 4} more</p>
          )}
        </div>
      )}
    </div>
  );
}
