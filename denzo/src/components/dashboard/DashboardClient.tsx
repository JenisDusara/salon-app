"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, Users, Calculator, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import type { DashboardData } from "@/types";

interface DashboardClientProps {
  data: DashboardData;
}

export function DashboardClient({ data }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"today" | "monthly">("today");
  const [profitStart, setProfitStart] = useState("");
  const [profitEnd, setProfitEnd] = useState("");
  const [profitResult, setProfitResult] = useState<{ income: number; expenses: number; profit: number } | null>(null);
  const [calculatingProfit, setCalculatingProfit] = useState(false);

  const periodData = activeTab === "today" ? data.today : data.monthly;
  const sortedLabour = [...data.labourIncome].sort((a, b) => b.totalIncome - a.totalIncome);

  async function handleCalculateProfit() {
    if (!profitStart || !profitEnd) { toast.error("Please select both dates"); return; }
    if (new Date(profitStart) > new Date(profitEnd)) { toast.error("Start date must be before end date"); return; }
    setCalculatingProfit(true);
    setProfitResult(null);
    try {
      const res = await fetch(`/api/dashboard/profit?start_date=${profitStart}&end_date=${profitEnd}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setProfitResult(json);
    } catch {
      toast.error("Failed to calculate profit");
    } finally {
      setCalculatingProfit(false);
    }
  }

  return (
    <PageTransition>
      <div className="space-y-7">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 w-fit shadow-sm border border-slate-100">
          {(["today", "monthly"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
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

        {/* Metrics */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <MetricCard label={activeTab === "today" ? "Today's Income" : "Monthly Income"} value={periodData.income} icon={<TrendingUp size={18} />} color="income" delay={0} />
            <MetricCard label={activeTab === "today" ? "Today's Expenses" : "Monthly Expenses"} value={periodData.expenses} icon={<TrendingDown size={18} />} color="expense" delay={0.08} />
            <MetricCard label={activeTab === "today" ? "Today's Profit" : "Monthly Profit"} value={periodData.profit} icon={<DollarSign size={18} />} color={periodData.profit < 0 ? "expense" : "profit"} delay={0.16} />
          </motion.div>
        </AnimatePresence>

        {/* Overall + Customers */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <MetricCard label="Overall Income" value={data.overall.income} icon={<TrendingUp size={18} />} color="income" delay={0} />
          <MetricCard label="Overall Expenses" value={data.overall.expenses} icon={<TrendingDown size={18} />} color="expense" delay={0.05} />
          <MetricCard label="Overall Profit" value={data.overall.profit} icon={<DollarSign size={18} />} color={data.overall.profit < 0 ? "expense" : "profit"} delay={0.1} />
          <MetricCard label="Total Customers" value={data.totalCustomers} icon={<Users size={18} />} color="info" isCurrency={false} delay={0.15} />
        </div>

        {/* Labour Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Briefcase size={16} className="text-indigo-500" />
            <h2 className="text-[15px] font-semibold text-slate-800">Labour Performance</h2>
          </div>
          {sortedLabour.length === 0 ? (
            <div className="px-6 py-10 text-center text-[13px] text-slate-400">No employee data available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Employee</th>
                    <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Services</th>
                    <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLabour.map((emp, idx) => (
                    <motion.tr
                      key={emp.employeeId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.06 }}
                      className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[13px] font-bold text-indigo-600 flex-shrink-0">
                            {emp.employeeName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[13px] font-medium text-slate-700">{emp.employeeName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center bg-slate-100 text-slate-600 text-[12px] font-semibold rounded-full px-2.5 py-0.5 min-w-[32px]">{emp.totalServices}</span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className="text-[13px] font-semibold text-emerald-600">{formatCurrency(emp.totalIncome)}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Membership Activity */}
        {data.todayMembershipActivity.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-[15px] font-semibold text-slate-800">Today&apos;s Membership Activity</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.todayMembershipActivity.map((activity, idx) => (
                <motion.div
                  key={`${activity.customerName}-${idx}`}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.22, delay: idx * 0.06 }}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-[13px] font-semibold text-slate-800">{activity.customerName}</p>
                    <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">{activity.planName}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activity.servicesUsed.map((svc, svcIdx) => (
                      <span key={svcIdx} className="text-[11px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md">{svc}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Profit Calculator */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Calculator size={16} className="text-indigo-500" />
            <h2 className="text-[15px] font-semibold text-slate-800">Profit Calculator</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-slate-600">Start Date</label>
                <input type="date" value={profitStart} onChange={(e) => setProfitStart(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-slate-600">End Date</label>
                <input type="date" value={profitEnd} onChange={(e) => setProfitEnd(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
              </div>
              <Button variant="primary" size="md" loading={calculatingProfit} onClick={handleCalculateProfit}>Calculate</Button>
            </div>
            <AnimatePresence>
              {profitResult && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                    <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">Income</p>
                    <p className="text-[22px] font-bold text-emerald-700">{formatCurrency(profitResult.income)}</p>
                  </div>
                  <div className="rounded-xl bg-rose-50 border border-rose-100 p-4">
                    <p className="text-[11px] font-semibold text-rose-600 uppercase tracking-wide mb-1">Expenses</p>
                    <p className="text-[22px] font-bold text-rose-700">{formatCurrency(profitResult.expenses)}</p>
                  </div>
                  <div className={`rounded-xl p-4 border ${profitResult.profit >= 0 ? "bg-blue-50 border-blue-100" : "bg-rose-50 border-rose-100"}`}>
                    <p className={`text-[11px] font-semibold uppercase tracking-wide mb-1 ${profitResult.profit >= 0 ? "text-blue-600" : "text-rose-600"}`}>Net Profit</p>
                    <p className={`text-[22px] font-bold ${profitResult.profit >= 0 ? "text-blue-700" : "text-rose-700"}`}>{formatCurrency(profitResult.profit)}</p>
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
