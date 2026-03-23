"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Calculator,
  CreditCard,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { formatCurrency } from "@/lib/utils";
import type { DashboardData, DayRevenue, PaymentBreakdown } from "@/types";

// ── Donut Chart ────────────────────────────────────────────────────────────────
const MODES = [
  { key: "cash",       label: "Cash",       color: "#10b981", light: "#d1fae5" },
  { key: "card",       label: "Card",       color: "#3b82f6", light: "#dbeafe" },
  { key: "online",     label: "Online",     color: "#8b5cf6", light: "#ede9fe" },
  { key: "membership", label: "Membership", color: "#f59e0b", light: "#fef3c7" },
];

function DonutChart({ breakdown }: { breakdown: PaymentBreakdown }) {
  const segments = MODES.map((m) => ({
    ...m,
    value: breakdown[m.key as keyof PaymentBreakdown],
  }));
  const total = segments.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-[13px] text-slate-400">
        No transactions yet
      </div>
    );
  }

  const r = 38;
  const cx = 52;
  const cy = 52;
  const circ = 2 * Math.PI * r;
  let cumPct = 0;

  return (
    <div className="flex items-center gap-5">
      {/* SVG Donut */}
      <svg viewBox="0 0 104 104" className="w-[100px] h-[100px] flex-shrink-0 -rotate-90">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={18} />
        {segments.filter((s) => s.value > 0).map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circ;
          const gap = circ - dash;
          const offset = -(cumPct * circ);
          cumPct += pct;
          return (
            <motion.circle
              key={seg.key}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={18}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              initial={{ strokeDasharray: `0 ${circ}` }}
              animate={{ strokeDasharray: `${dash} ${gap}` }}
              transition={{ duration: 0.8, delay: i * 0.12, ease: "easeOut" }}
            />
          );
        })}
        {/* Hole */}
        <circle cx={cx} cy={cy} r={26} fill="white" />
      </svg>

      {/* Legend */}
      <div className="flex-1 space-y-2">
        {segments.map((seg) => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <div key={seg.key} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: seg.color }} />
                <span className="text-[12px] text-slate-500 truncate">{seg.label}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[11px] text-slate-400">{pct}%</span>
                <span className="text-[12px] font-semibold text-slate-700">{formatCurrency(seg.value)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 7-Day Bar Chart ────────────────────────────────────────────────────────────
function WeekBars({ days }: { days: DayRevenue[] }) {
  const max = Math.max(...days.map((d) => d.income), 1);
  const BAR_H = 72;

  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height: BAR_H + 20 }}>
        {days.map((day, i) => {
          const pct = day.income / max;
          const isToday = i === days.length - 1;
          const barH = Math.max(pct * BAR_H, day.income > 0 ? 4 : 2);
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
              {day.income > 0 && (
                <span className="text-[9px] font-semibold text-slate-400 leading-none">
                  {day.income >= 1000 ? `${(day.income / 1000).toFixed(1)}k` : day.income}
                </span>
              )}
              <div
                className="w-full flex items-end rounded-t-md overflow-hidden"
                style={{ height: BAR_H }}
              >
                <motion.div
                  className="w-full rounded-t-md"
                  initial={{ height: 0 }}
                  animate={{ height: barH }}
                  transition={{ duration: 0.6, delay: i * 0.07, ease: "easeOut" }}
                  style={{
                    background: isToday
                      ? "linear-gradient(180deg, #6366f1, #818cf8)"
                      : day.income > 0
                      ? "linear-gradient(180deg, #c7d2fe, #e0e7ff)"
                      : "#f1f5f9",
                  }}
                />
              </div>
              <span
                className="text-[10px] font-medium"
                style={{ color: isToday ? "#6366f1" : "#94a3b8" }}
              >
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Income vs Expense Bar ──────────────────────────────────────────────────────
function IncomeExpenseBar({ income, expenses }: { income: number; expenses: number }) {
  const total = income + expenses || 1;
  const incomePct = (income / total) * 100;
  const expPct = (expenses / total) * 100;
  const profit = income - expenses;
  const margin = income > 0 ? Math.round((profit / income) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden bg-slate-100 flex">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${incomePct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full bg-emerald-400 rounded-l-full"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${expPct}%` }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="h-full bg-rose-400 rounded-r-full"
        />
      </div>
      {/* Labels */}
      <div className="flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-slate-500">Income</span>
          <span className="font-semibold text-slate-700">{formatCurrency(income)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <span className="text-slate-500">Exp</span>
          <span className="font-semibold text-slate-700">{formatCurrency(expenses)}</span>
        </div>
      </div>
      {/* Profit margin pill */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-400">Net Profit</span>
        <span
          className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${
            profit >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {formatCurrency(profit)}
        </span>
        <span className="text-[11px] text-slate-400">({margin}% margin)</span>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export function DashboardClient({ data }: { data: DashboardData }) {
  const [activeTab, setActiveTab] = useState<"today" | "monthly">("today");
  const [profitStart, setProfitStart] = useState("");
  const [profitEnd, setProfitEnd] = useState("");
  const [profitResult, setProfitResult] = useState<{
    income: number;
    expenses: number;
    profit: number;
  } | null>(null);
  const [calculatingProfit, setCalculatingProfit] = useState(false);

  const periodData = activeTab === "today" ? data.today : data.monthly;
  const breakdown = activeTab === "today" ? data.todayBreakdown : data.monthlyBreakdown;
  const sortedLabour = [...data.labourIncome].sort((a, b) => b.totalIncome - a.totalIncome);
  const maxRevenue = sortedLabour[0]?.totalIncome || 1;

  async function handleCalculateProfit() {
    if (!profitStart || !profitEnd) { toast.error("Please select both dates"); return; }
    if (new Date(profitStart) > new Date(profitEnd)) { toast.error("Start date must be before end date"); return; }
    setCalculatingProfit(true);
    setProfitResult(null);
    try {
      const res = await fetch(`/api/dashboard/profit?start_date=${profitStart}&end_date=${profitEnd}`);
      if (!res.ok) throw new Error("Failed");
      setProfitResult(await res.json());
    } catch {
      toast.error("Failed to calculate profit");
    } finally {
      setCalculatingProfit(false);
    }
  }

  return (
    <PageTransition>
      <div className="space-y-5">

        {/* ── Tab Switcher ── */}
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 w-fit shadow-sm border border-slate-100">
          {(["today", "monthly"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              suppressHydrationWarning
              onClick={() => setActiveTab(tab)}
              className="relative px-5 py-1.5 text-[13px] font-medium rounded-lg transition-colors duration-150 focus-visible:outline-none"
              style={{ color: activeTab === tab ? "#4f46e5" : "#64748b" }}
            >
              {activeTab === tab && (
                <motion.span
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-lg bg-indigo-50"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab === "today" ? "Today" : "This Month"}</span>
            </button>
          ))}
        </div>

        {/* ── KPI Cards ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <MetricCard label={activeTab === "today" ? "Today's Income" : "Monthly Income"}
              value={periodData.income} icon={<TrendingUp size={18} />} color="income" delay={0} />
            <MetricCard label={activeTab === "today" ? "Today's Expenses" : "Monthly Expenses"}
              value={periodData.expenses} icon={<TrendingDown size={18} />} color="expense" delay={0.08} />
            <MetricCard label={activeTab === "today" ? "Today's Profit" : "Monthly Profit"}
              value={periodData.profit} icon={<DollarSign size={18} />}
              color={periodData.profit < 0 ? "expense" : "profit"} delay={0.16} />
          </motion.div>
        </AnimatePresence>

        {/* ── Charts Row ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`charts-${activeTab}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Income vs Expenses + 7-day trend */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  {activeTab === "today" ? "Today's" : "This Month's"} Breakdown
                </p>
                <IncomeExpenseBar income={periodData.income} expenses={periodData.expenses} />
              </div>
              <div className="h-px bg-slate-100" />
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Last 7 Days Revenue
                </p>
                <WeekBars days={data.last7Days} />
              </div>
            </div>

            {/* Payment mode donut */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                Payment Mode — {activeTab === "today" ? "Today" : "This Month"}
              </p>
              <DonutChart breakdown={breakdown} />

              {/* Total */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[12px] text-slate-500">Total Collected</span>
                <span className="text-[15px] font-bold text-slate-800">
                  {formatCurrency(
                    breakdown.cash + breakdown.card + breakdown.online + breakdown.membership,
                  )}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Overall Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <MetricCard label="Overall Income" value={data.overall.income}
            icon={<TrendingUp size={18} />} color="income" delay={0} />
          <MetricCard label="Overall Expenses" value={data.overall.expenses}
            icon={<TrendingDown size={18} />} color="expense" delay={0.05} />
          <MetricCard label="Overall Profit" value={data.overall.profit}
            icon={<DollarSign size={18} />}
            color={data.overall.profit < 0 ? "expense" : "profit"} delay={0.1} />
          <MetricCard label="Total Customers" value={data.totalCustomers}
            icon={<Users size={18} />} color="info" isCurrency={false} delay={0.15} />
        </div>

        {/* ── Staff Performance + Membership Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* Staff Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={15} className="text-amber-500" />
              <h2 className="text-[14px] font-semibold text-slate-700">Staff Performance</h2>
            </div>
            {sortedLabour.length > 0 && (
              <span className="text-[11px] text-slate-400">{sortedLabour.length} staff</span>
            )}
          </div>
          {sortedLabour.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
                <Trophy size={20} className="text-slate-300" />
              </div>
              <p className="text-[13px] text-slate-400">No employee data available</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {/* Top performer card */}
              {sortedLabour[0] && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-xl bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border border-amber-100 p-4 mb-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-full bg-amber-400 flex items-center justify-center text-[15px] font-bold text-white shadow-sm">
                        {sortedLabour[0].employeeName.charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute -top-1.5 -right-1 text-[14px] leading-none">👑</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-bold text-amber-800 truncate">
                          {sortedLabour[0].employeeName}
                        </p>
                        <span className="text-[9px] font-extrabold bg-amber-400 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">
                          Top
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-600 mt-0.5">
                        {sortedLabour[0].totalServices} services completed
                      </p>
                    </div>
                    <span className="text-[15px] font-bold text-amber-700 flex-shrink-0">
                      {formatCurrency(sortedLabour[0].totalIncome)}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                    />
                  </div>
                </motion.div>
              )}

              {/* Rest of the employees */}
              {(() => {
                const palette = [
                  { avatar: "bg-indigo-100 text-indigo-600", bar: "bg-indigo-400" },
                  { avatar: "bg-emerald-100 text-emerald-600", bar: "bg-emerald-400" },
                  { avatar: "bg-violet-100 text-violet-600", bar: "bg-violet-400" },
                  { avatar: "bg-rose-100 text-rose-600", bar: "bg-rose-400" },
                  { avatar: "bg-cyan-100 text-cyan-600", bar: "bg-cyan-400" },
                ];
                return sortedLabour.slice(1).map((emp, idx) => {
                  const pct = Math.round((emp.totalIncome / maxRevenue) * 100);
                  const c = palette[idx % palette.length];
                  return (
                    <motion.div
                      key={emp.employeeId}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: (idx + 1) * 0.06 }}
                      className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-[11px] font-bold w-5 text-center flex-shrink-0 text-slate-400">
                        #{idx + 2}
                      </span>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${c.avatar}`}>
                        {emp.employeeName.charAt(0).toUpperCase()}
                      </div>
                      <div className="w-24 flex-shrink-0">
                        <p className="text-[13px] font-semibold text-slate-700 truncate">{emp.employeeName}</p>
                        <p className="text-[10px] text-slate-400">{emp.totalServices} services</p>
                      </div>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: (idx + 1) * 0.08 + 0.2, ease: "easeOut" }}
                          className={`h-full rounded-full ${c.bar}`}
                        />
                      </div>
                      <span className="text-[13px] font-bold text-emerald-600 w-20 text-right flex-shrink-0">
                        {formatCurrency(emp.totalIncome)}
                      </span>
                    </motion.div>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* ── Membership Activity ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <CreditCard size={15} className="text-indigo-500" />
            <h2 className="text-[14px] font-semibold text-slate-700">Today's Membership Activity</h2>
            {data.todayMembershipActivity.length > 0 && (
              <span className="ml-auto text-[11px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                {data.todayMembershipActivity.length} visits
              </span>
            )}
          </div>
          {data.todayMembershipActivity.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
                <CreditCard size={20} className="text-slate-300" />
              </div>
              <p className="text-[13px] text-slate-400">No membership visits today</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {data.todayMembershipActivity.map((activity, idx) => {
                const avatarColors = [
                  "bg-indigo-500", "bg-violet-500", "bg-emerald-500",
                  "bg-rose-500", "bg-amber-500", "bg-cyan-500",
                ];
                const bg = avatarColors[idx % avatarColors.length];
                return (
                  <motion.div
                    key={`${activity.customerName}-${idx}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                  >
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0 ${bg}`}>
                      {activity.customerName.charAt(0).toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-semibold text-slate-800">{activity.customerName}</p>
                        <span className="text-[9px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          {activity.planName}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {activity.servicesUsed.map((svc, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {svc}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Service count */}
                    <span className="text-[11px] font-semibold text-indigo-400 flex-shrink-0">
                      {activity.servicesUsed.length} svc
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        </div>{/* end grid */}

        {/* ── Profit Calculator ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Calculator size={15} className="text-indigo-500" />
            <h2 className="text-[14px] font-semibold text-slate-700">Profit Calculator</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">From</label>
                <input
                  suppressHydrationWarning
                  type="date" value={profitStart} onChange={(e) => setProfitStart(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">To</label>
                <input
                  suppressHydrationWarning
                  type="date" value={profitEnd} onChange={(e) => setProfitEnd(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                />
              </div>
              <Button variant="primary" size="md" loading={calculatingProfit} onClick={handleCalculateProfit}>
                Calculate
              </Button>
            </div>
            <AnimatePresence>
              {profitResult && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="space-y-3"
                >
                  {/* Visual bar */}
                  <IncomeExpenseBar income={profitResult.income} expenses={profitResult.expenses} />
                  {/* Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Income",     value: profitResult.income,   bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
                      { label: "Expenses",   value: profitResult.expenses, bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-700" },
                      { label: "Net Profit", value: profitResult.profit,
                        bg:     profitResult.profit >= 0 ? "bg-blue-50"  : "bg-rose-50",
                        border: profitResult.profit >= 0 ? "border-blue-200" : "border-rose-200",
                        text:   profitResult.profit >= 0 ? "text-blue-700" : "text-rose-700" },
                    ].map((item) => (
                      <div key={item.label} className={`rounded-xl border p-3.5 ${item.bg} ${item.border}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60 ${item.text}`}>{item.label}</p>
                        <p className={`text-[18px] font-bold ${item.text}`}>{formatCurrency(item.value)}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </PageTransition>
  );
}
