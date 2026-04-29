"use client";

import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, parseISO, isBefore, isAfter, startOfYear, subMonths } from "date-fns";
import { useCountUp } from "@/hooks/use-count-up";
import { isOverdue } from "@/lib/invoices";
import type { Invoice, Expense } from "@/lib/airtable";

const YTD_GOAL = 55000;

type Props = { invoices: Invoice[]; expenses: Expense[] };

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 500;
  const h = 60;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 8) - 4}`).join(" ");
  const area = `0,${h} ${points} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 50, marginTop: 14 }}>
      <defs>
        <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#bfff3a" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#bfff3a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sparkFill)" />
      <polyline points={points} fill="none" stroke="#bfff3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.length > 0 && (
        <circle
          cx={(data.length - 1) * step}
          cy={h - ((data[data.length - 1] - min) / range) * (h - 8) - 4}
          r="4"
          fill="#bfff3a"
        />
      )}
    </svg>
  );
}

export function HeroCards({ invoices, expenses }: Props) {
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const lastMonthEnd = endOfMonth(lastMonthStart);
    const ytdStart = startOfYear(now);

    const inRange = (dateStr: string | undefined, start: Date, end: Date) => {
      if (!dateStr) return false;
      const d = parseISO(dateStr);
      return !isBefore(d, start) && !isAfter(d, end);
    };

    const paidThisMonth = invoices.filter(i => i.Status === "Paid" && inRange(i["Paid Date"], thisMonthStart, thisMonthEnd));
    const paidLastMonth = invoices.filter(i => i.Status === "Paid" && inRange(i["Paid Date"], lastMonthStart, lastMonthEnd));
    const expensesThisMonth = expenses.filter(e => inRange(e.Date, thisMonthStart, thisMonthEnd));
    const expensesLastMonth = expenses.filter(e => inRange(e.Date, lastMonthStart, lastMonthEnd));

    const revThis = paidThisMonth.reduce((s, i) => s + (i.Amount ?? 0), 0);
    const expThis = expensesThisMonth.reduce((s, e) => s + (e.Amount ?? 0), 0);
    const netThis = revThis - expThis;

    const revLast = paidLastMonth.reduce((s, i) => s + (i.Amount ?? 0), 0);
    const expLast = expensesLastMonth.reduce((s, e) => s + (e.Amount ?? 0), 0);
    const netLast = revLast - expLast;

    const pctChange = netLast === 0 ? null : Math.round(((netThis - netLast) / Math.abs(netLast)) * 100);

    const outstanding = invoices.filter(i => i.Status === "Sent" || i.Status === "Overdue");
    const overdue = outstanding.filter(i => isOverdue(i, now));
    const sent = outstanding.filter(i => !isOverdue(i, now));

    const ytdRevenue = invoices
      .filter(i => i.Status === "Paid" && inRange(i["Paid Date"], ytdStart, now))
      .reduce((s, i) => s + (i.Amount ?? 0), 0);

    // Sparkline: last 6 months of net profit
    const sparkData = Array.from({ length: 6 }, (_, idx) => {
      const mStart = startOfMonth(subMonths(now, 5 - idx));
      const mEnd = endOfMonth(mStart);
      const rev = invoices.filter(i => i.Status === "Paid" && inRange(i["Paid Date"], mStart, mEnd)).reduce((s, i) => s + (i.Amount ?? 0), 0);
      const exp = expenses.filter(e => inRange(e.Date, mStart, mEnd)).reduce((s, e) => s + (e.Amount ?? 0), 0);
      return rev - exp;
    });

    return { revThis, expThis, netThis, pctChange, outstanding, overdue, sent, ytdRevenue, sparkData, monthName: format(now, "MMMM") };
  }, [invoices, expenses]);

  const ytdPct = Math.min(100, Math.round((stats.ytdRevenue / YTD_GOAL) * 100));
  const monthName = stats.monthName;

  const animatedNet = useCountUp(stats.netThis);
  const animatedComingIn = useCountUp(
    stats.outstanding.reduce((s, i) => s + (i.Amount ?? 0), 0)
  );
  const animatedYtd = useCountUp(stats.ytdRevenue);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Net Profit */}
      <div className="bg-gradient-to-b from-[#14181d] to-[#0f1215] border border-[#2a2e34] rounded-[20px] p-6 hover:-translate-y-0.5 hover:shadow-lg transition-transform">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] text-[#bfff3a] font-medium tracking-wider uppercase">
              Net Profit · {monthName}
            </p>
            <p className={`text-4xl font-bold tracking-tight mt-1.5 tabular-nums ${stats.netThis < 0 ? "text-[#ff4d8b]" : "text-white"}`}>
              ${Math.round(animatedNet).toLocaleString()}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              ${stats.revThis.toLocaleString()} revenue − ${stats.expThis.toLocaleString()} expenses
            </p>
          </div>
          {stats.pctChange !== null && (
            <div className="flex flex-col items-end gap-1">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${stats.pctChange >= 0 ? "bg-[#bfff3a]/12 text-[#bfff3a]" : "bg-[#ff4d8b]/12 text-[#ff4d8b]"}`}>
                {stats.pctChange >= 0 ? "▲" : "▼"} {Math.abs(stats.pctChange)}%
              </span>
              <span className="text-[10px] text-zinc-600">vs last month</span>
            </div>
          )}
        </div>
        <Sparkline data={stats.sparkData} />
      </div>

      {/* Coming In */}
      <div className="bg-[#14181d] border border-[#2a2e34] rounded-[20px] p-5 hover:-translate-y-0.5 hover:shadow-lg transition-transform">
        <p className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">Coming In</p>
        <p className="text-2xl font-bold mt-1 tabular-nums" style={{ color: "#fbbf24" }}>
          ${Math.round(animatedComingIn).toLocaleString()}
        </p>
        <div className="mt-3 space-y-1.5">
          {stats.overdue.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="text-[#ff4d8b]">●</span>
              {stats.overdue.length} overdue · ${stats.overdue.reduce((s, i) => s + (i.Amount ?? 0), 0).toLocaleString()}
            </div>
          )}
          {stats.sent.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="text-[#3affd1]">●</span>
              {stats.sent.length} pending · ${stats.sent.reduce((s, i) => s + (i.Amount ?? 0), 0).toLocaleString()}
            </div>
          )}
          {stats.outstanding.length === 0 && (
            <p className="text-xs text-zinc-600">No outstanding invoices</p>
          )}
        </div>
      </div>

      {/* YTD Goal */}
      <div className="bg-[#14181d] border border-[#2a2e34] rounded-[20px] p-5 hover:-translate-y-0.5 hover:shadow-lg transition-transform">
        <p className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">YTD Goal</p>
        <p className="text-2xl font-bold text-white mt-1 tabular-nums">${Math.round(animatedYtd).toLocaleString()}</p>
        <div className="mt-3 h-1.5 bg-[#1f242a] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#bfff3a] rounded-full transition-all"
            style={{ width: `${ytdPct}%` }}
          />
        </div>
        <p className="text-[10px] text-zinc-500 mt-1.5">
          {ytdPct >= 100 ? `🎯 Goal hit · $${(stats.ytdRevenue - YTD_GOAL).toLocaleString()} over` : `${ytdPct}% of $${(YTD_GOAL / 1000).toFixed(0)}k · ${ytdPct >= 50 ? "on pace" : "behind pace"}`}
        </p>
      </div>
    </div>
  );
}
