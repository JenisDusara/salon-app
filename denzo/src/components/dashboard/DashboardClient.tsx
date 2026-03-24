"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart2, Calculator,
  ChevronDown, CreditCard, Download, Scissors,
  TrendingDown, TrendingUp, Trophy, Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";
import { formatCurrency } from "@/lib/utils";
import type { DashboardData, DayRevenue, PaymentBreakdown } from "@/types";

// ─────────────────────────────────────────────────────────────
// Payment donut
// ─────────────────────────────────────────────────────────────
const PAY_MODES = [
  { key: "cash",       label: "Cash",       color: "#10b981", light: "#d1fae5" },
  { key: "card",       label: "Card",       color: "#3b82f6", light: "#dbeafe" },
  { key: "online",     label: "Online",     color: "#8b5cf6", light: "#ede9fe" },
  { key: "membership", label: "Membership", color: "#f59e0b", light: "#fef3c7" },
];

function DonutChart({ breakdown }: { breakdown: PaymentBreakdown }) {
  const segs = PAY_MODES.map((m) => ({ ...m, value: breakdown[m.key as keyof PaymentBreakdown] }));
  const total = segs.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[180px] gap-2">
        <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center">
          <CreditCard size={20} className="text-slate-300" />
        </div>
        <p className="text-[12px] text-slate-400">No transactions yet</p>
      </div>
    );
  }

  const r = 44; const cx = 56; const cy = 56; const circ = 2 * Math.PI * r;
  let cum = 0;

  return (
    <div className="flex items-center gap-5">
      {/* Donut */}
      <div className="relative flex-shrink-0">
        <svg viewBox="0 0 112 112" className="w-[120px] h-[120px] -rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={18} />
          {segs.filter((s) => s.value > 0).map((seg, i) => {
            const pct = seg.value / total;
            const dash = pct * circ;
            const offset = -(cum * circ);
            cum += pct;
            return (
              <motion.circle key={seg.key}
                cx={cx} cy={cy} r={r} fill="none"
                stroke={seg.color} strokeWidth={18} strokeLinecap="butt"
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={offset}
                initial={{ strokeDasharray: `0 ${circ}` }}
                animate={{ strokeDasharray: `${dash} ${circ - dash}` }}
                transition={{ duration: 1, delay: i * 0.12, ease: "easeOut" }}
              />
            );
          })}
          <circle cx={cx} cy={cy} r={32} fill="white" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">Total</p>
          <p className="text-[13px] font-extrabold text-slate-800 leading-tight">{formatCurrency(total)}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2.5">
        {segs.map((seg) => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <div key={seg.key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: seg.color }} />
                  <span className="text-[11px] text-slate-500 font-medium">{seg.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-700">{formatCurrency(seg.value)}</span>
                  <span className="text-[9px] font-medium text-slate-400">({pct}%)</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: seg.light }}>
                <motion.div className="h-full rounded-full" style={{ background: seg.color }}
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Revenue bar chart
// ─────────────────────────────────────────────────────────────
function RevenueChart({ days, selectedIndex, onSelect }: { days: DayRevenue[]; selectedIndex: number | null; onSelect: (i: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...days.map((d) => d.income), 1);

  return (
    <div className="flex items-end gap-1.5 h-[100px] px-1">
      {days.map((day, i) => {
        const pct = day.income / max;
        const barH = Math.max(pct * 84, day.income > 0 ? 6 : 3);
        const isToday = i === days.length - 1;
        const isHovered = hovered === i;
        const isSelected = selectedIndex === i;
        return (
          <div key={i} className="relative flex-1 flex flex-col items-center justify-end gap-1.5"
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
            onClick={() => onSelect(i)}
          >
            {/* Tooltip */}
            <AnimatePresence>
              {isHovered && day.income > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.9 }}
                  transition={{ duration: 0.12 }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 bg-slate-800 text-white text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap shadow-lg"
                >
                  {formatCurrency(day.income)}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div className="w-full rounded-t-md cursor-pointer transition-all"
              initial={{ height: 0 }} animate={{ height: barH }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: isSelected || isToday
                  ? isHovered || isSelected
                    ? "linear-gradient(180deg,#4f46e5,#818cf8)"
                    : "linear-gradient(180deg,#6366f1,#a5b4fc)"
                  : isHovered
                    ? "#c7d2fe"
                    : day.income > 0 ? "#e0e7ff" : "#f1f5f9",
                borderRadius: "6px 6px 2px 2px",
                outline: isSelected ? "2px solid #6366f1" : "none",
                outlineOffset: "2px",
              }}
            />
            <span className={`text-[10px] font-semibold ${isSelected || isToday ? "text-indigo-600" : "text-slate-400"}`}>
              {day.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// KPI card
// ─────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon, accentColor, lightColor, isCurrency = true, delay = 0 }: {
  label: string; value: number; icon: React.ReactNode;
  accentColor: string; lightColor: string; isCurrency?: boolean; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden"
    >
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-[0.08]" style={{ background: accentColor }} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
          <p className="text-[24px] sm:text-[26px] font-extrabold text-slate-800 leading-none truncate">
            {isCurrency ? formatCurrency(value) : value.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: lightColor, color: accentColor }}>
          {icon}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-0.5 w-full rounded-b-2xl" style={{ background: `${accentColor}30` }} />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────
export function DashboardClient({ data }: { data: DashboardData }) {
  const [activeTab, setActiveTab] = useState<"today" | "monthly">("today");
  const [exporting, setExporting] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [profitStart, setProfitStart] = useState("");
  const [profitEnd, setProfitEnd] = useState("");
  const [profitResult, setProfitResult] = useState<{ income: number; expenses: number; profit: number } | null>(null);
  const [calculating, setCalculating] = useState(false);

  const p = activeTab === "today" ? data.today : data.monthly;
  const breakdown = activeTab === "today" ? data.todayBreakdown : data.monthlyBreakdown;
  const sortedStaff = [...data.labourIncome].sort((a, b) => b.totalIncome - a.totalIncome);
  const maxRev = sortedStaff[0]?.totalIncome || 1;

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Denzo-Report-${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Excel downloaded!");
    } catch { toast.error("Export failed"); }
    finally { setExporting(false); }
  }

  async function handleCalc() {
    if (!profitStart || !profitEnd) { toast.error("Select both dates"); return; }
    setCalculating(true); setProfitResult(null);
    try {
      const res = await fetch(`/api/dashboard/profit?start_date=${profitStart}&end_date=${profitEnd}`);
      if (!res.ok) throw new Error();
      setProfitResult(await res.json());
    } catch { toast.error("Failed to calculate"); }
    finally { setCalculating(false); }
  }

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <PageTransition>
      <div className="space-y-5 max-w-[1400px] mx-auto">

        {/* ── PAGE HEADER ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              <Scissors size={18} color="white" />
            </div>
            <div>
              <h1 className="text-[18px] font-extrabold text-slate-800 leading-tight">Denzo Salon</h1>
              <p className="text-[11px] text-slate-400">{dateStr}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Period toggle */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              {(["today", "monthly"] as const).map((tab) => (
                <button key={tab} type="button" suppressHydrationWarning
                  onClick={() => setActiveTab(tab)}
                  className="relative px-3.5 py-1.5 text-[12px] font-semibold rounded-lg transition-colors focus-visible:outline-none"
                  style={{ color: activeTab === tab ? "#4f46e5" : "#94a3b8" }}>
                  {activeTab === tab && (
                    <motion.span layoutId="tab-bg"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                  )}
                  <span className="relative z-10">{tab === "today" ? "Today" : "This Month"}</span>
                </button>
              ))}
            </div>

            {/* Export */}
            <button type="button" suppressHydrationWarning onClick={handleExport} disabled={exporting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-semibold transition-colors disabled:opacity-60 shadow-sm shadow-indigo-200">
              <Download size={13} />
              {exporting ? "Exporting…" : "Export"}
            </button>
          </div>
        </div>

        {/* ── KPI CARDS (This Month only) ── */}
        <AnimatePresence>
          {activeTab === "monthly" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pb-1">
                <KpiCard label="Income" value={p.income} icon={<TrendingUp size={20} />} accentColor="#10b981" lightColor="#d1fae5" delay={0} />
                <KpiCard label="Expenses" value={p.expenses} icon={<TrendingDown size={20} />} accentColor="#f43f5e" lightColor="#ffe4e6" delay={0.07} />
                <KpiCard label="Net Profit" value={p.profit} icon={p.profit >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />} accentColor={p.profit >= 0 ? "#3b82f6" : "#f43f5e"} lightColor={p.profit >= 0 ? "#dbeafe" : "#ffe4e6"} delay={0.14} />
                <KpiCard label="Customers" value={data.totalCustomers} icon={<Users size={20} />} accentColor="#8b5cf6" lightColor="#ede9fe" isCurrency={false} delay={0.21} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CHARTS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">

          {/* Revenue chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <BarChart2 size={14} className="text-indigo-500" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-700">Revenue</p>
                  <p className="text-[10px] text-slate-400">Last 7 days</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "linear-gradient(135deg,#6366f1,#a5b4fc)" }} />
                <span className="text-[10px] text-slate-400">Daily income</span>
              </div>
            </div>
            <div className="px-5 pt-6 pb-4">
              <RevenueChart days={data.last7Days} selectedIndex={selectedDayIndex} onSelect={(i) => setSelectedDayIndex(selectedDayIndex === i ? null : i)} />
            </div>
            {/* Summary below chart */}
            {(() => {
              const selectedDay = selectedDayIndex !== null ? data.last7Days[selectedDayIndex] : null;
              const chartIncome   = selectedDay ? selectedDay.income : p.income;
              const chartExpenses = selectedDay ? selectedDay.expenses : p.expenses;
              const chartProfit   = chartIncome - chartExpenses;
              const label         = selectedDay ? selectedDay.label : (activeTab === "today" ? "Today" : "This Month");
              return (
                <div className="border-t border-slate-100">
                  <div className="px-4 pt-2 pb-0 text-center">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-slate-100">
                    {[
                      { label: "Income",   val: chartIncome,   color: "#10b981", bg: "#f0fdf4" },
                      { label: "Expenses", val: chartExpenses, color: "#f43f5e", bg: "#fff1f2" },
                      { label: "Profit",   val: chartProfit,   color: chartProfit >= 0 ? "#3b82f6" : "#f43f5e", bg: chartProfit >= 0 ? "#eff6ff" : "#fff1f2" },
                    ].map((item) => (
                      <div key={item.label} className="py-3.5 px-4 text-center" style={{ background: item.bg }}>
                        <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: `${item.color}99` }}>{item.label}</p>
                        <p className="text-[14px] font-extrabold" style={{ color: item.color }}>{formatCurrency(item.val)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Payment breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                <CreditCard size={14} className="text-violet-500" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-700">Payment Modes</p>
                <p className="text-[10px] text-slate-400">{activeTab === "today" ? "Today" : "This month"}</p>
              </div>
            </div>
            <div className="px-5 py-5">
              <DonutChart breakdown={breakdown} />
            </div>
          </div>
        </div>

        {/* ── OVERALL STATS STRIP ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100">
            {[
              { label: "All-time Income",   val: data.overall.income,   color: "#10b981", icon: <TrendingUp size={14} /> },
              { label: "All-time Expenses", val: data.overall.expenses, color: "#f43f5e", icon: <TrendingDown size={14} /> },
              { label: "All-time Profit",   val: data.overall.profit,   color: data.overall.profit >= 0 ? "#3b82f6" : "#f43f5e", icon: <TrendingUp size={14} /> },
              { label: "Active Staff",      val: sortedStaff.length,   color: "#f59e0b", icon: <Users size={14} />, currency: false },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 + 0.2 }}
                className="flex items-center gap-3 px-5 py-4"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.color}15`, color: item.color }}>
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider truncate">{item.label}</p>
                  <p className="text-[15px] font-extrabold truncate" style={{ color: item.color }}>
                    {(item as { currency?: boolean }).currency === false ? item.val.toLocaleString("en-IN") : formatCurrency(item.val)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── STAFF + MEMBERSHIP ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

          {/* Staff Performance */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <Trophy size={14} className="text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-slate-700">Staff Performance</p>
                <p className="text-[10px] text-slate-400">All-time earnings</p>
              </div>
              {sortedStaff.length > 0 && (
                <span className="text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full">
                  {sortedStaff.length} members
                </span>
              )}
            </div>

            {sortedStaff.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Trophy size={28} className="text-slate-200 mb-2" />
                <p className="text-[12px] text-slate-400">No staff data yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {sortedStaff.map((emp, idx) => {
                  const pct = Math.round((emp.totalIncome / maxRev) * 100);
                  const rankColors = [
                    { dot: "#f59e0b", bar: "#fbbf24", bg: "bg-amber-50", num: "text-amber-600" },
                    { dot: "#94a3b8", bar: "#94a3b8", bg: "bg-slate-50",  num: "text-slate-500" },
                    { dot: "#cd7c2e", bar: "#d97706", bg: "bg-orange-50", num: "text-orange-600" },
                  ];
                  const rc = rankColors[Math.min(idx, rankColors.length - 1)];
                  const rankLabels = ["🥇", "🥈", "🥉"];

                  return (
                    <motion.div key={emp.employeeId}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.06 }}
                      className={`flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/70 transition-colors ${idx < 3 ? rc.bg : ""}`}
                    >
                      {/* Rank */}
                      <div className="w-8 flex-shrink-0 text-center">
                        {idx < 3
                          ? <span className="text-[18px] leading-none">{rankLabels[idx]}</span>
                          : <span className={`text-[11px] font-bold ${rc.num}`}>#{idx + 1}</span>
                        }
                      </div>

                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-extrabold text-white flex-shrink-0"
                        style={{ background: `${rc.dot}` }}>
                        {emp.employeeName.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[13px] font-semibold text-slate-700 truncate">{emp.employeeName}</p>
                          <p className="text-[13px] font-extrabold text-slate-800 flex-shrink-0 ml-2">
                            {formatCurrency(emp.totalIncome)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div className="h-full rounded-full" style={{ background: rc.bar }}
                              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: idx * 0.09 + 0.3, ease: "easeOut" }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 flex-shrink-0 font-medium">
                            {emp.totalServices} services
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Today's Membership Activity */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                <CreditCard size={14} className="text-violet-500" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-slate-700">Membership Activity</p>
                <p className="text-[10px] text-slate-400">Today's visits</p>
              </div>
              {data.todayMembershipActivity.length > 0 && (
                <span className="text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded-full">
                  {data.todayMembershipActivity.length} visits
                </span>
              )}
            </div>

            {data.todayMembershipActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CreditCard size={28} className="text-slate-200 mb-2" />
                <p className="text-[12px] text-slate-400">No membership visits today</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[360px] overflow-y-auto">
                {data.todayMembershipActivity.map((act, idx) => {
                  const avatarColors = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4", "#ec4899"];
                  const bg = avatarColors[idx % avatarColors.length];
                  return (
                    <motion.div key={`${act.customerName}-${idx}`}
                      initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                      className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-extrabold text-white flex-shrink-0 mt-0.5"
                        style={{ background: bg }}>
                        {act.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-[13px] font-semibold text-slate-800 truncate">{act.customerName}</p>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: "#f3e8ff", color: "#7c3aed" }}>
                            {act.planName}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {act.servicesUsed.map((svc, i) => (
                            <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-medium">{svc}</span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── PROFIT CALCULATOR ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <button type="button" suppressHydrationWarning
            onClick={() => setCalcOpen(!calcOpen)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center transition-colors group-hover:bg-indigo-100">
                <Calculator size={14} className="text-indigo-500" />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-bold text-slate-700">Profit Calculator</p>
                <p className="text-[10px] text-slate-400">Calculate profit for any date range</p>
              </div>
            </div>
            <motion.div animate={{ rotate: calcOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={15} className="text-slate-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {calcOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-4">
                  <div className="flex flex-wrap gap-3 items-end pt-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">From</label>
                      <input suppressHydrationWarning type="date" value={profitStart}
                        onChange={(e) => setProfitStart(e.target.value)}
                        className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">To</label>
                      <input suppressHydrationWarning type="date" value={profitEnd}
                        onChange={(e) => setProfitEnd(e.target.value)}
                        className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                      />
                    </div>
                    <Button variant="primary" size="md" loading={calculating} onClick={handleCalc}>
                      Calculate
                    </Button>
                  </div>

                  <AnimatePresence>
                    {profitResult && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: "Income",     value: profitResult.income,   color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
                            { label: "Expenses",   value: profitResult.expenses, color: "#e11d48", bg: "#fff1f2", border: "#fecdd3" },
                            { label: "Net Profit", value: profitResult.profit,
                              color: profitResult.profit >= 0 ? "#2563eb" : "#e11d48",
                              bg: profitResult.profit >= 0 ? "#eff6ff" : "#fff1f2",
                              border: profitResult.profit >= 0 ? "#bfdbfe" : "#fecdd3" },
                          ].map((item) => (
                            <div key={item.label} className="rounded-xl border p-4 text-center"
                              style={{ background: item.bg, borderColor: item.border }}>
                              <p className="text-[9px] font-bold uppercase tracking-widest mb-2 opacity-70" style={{ color: item.color }}>
                                {item.label}
                              </p>
                              <p className="text-[20px] font-extrabold" style={{ color: item.color }}>
                                {formatCurrency(item.value)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </PageTransition>
  );
}
