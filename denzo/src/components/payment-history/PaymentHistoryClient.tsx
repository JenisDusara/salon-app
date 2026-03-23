"use client";

import { motion } from "framer-motion";
import { History, Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageTransition } from "@/components/ui/PageTransition";
import { formatDate } from "@/lib/utils";

type BillItem = {
  id: number;
  serviceName: string;
  employeeName: string;
  price: number;
  isMembershipService: boolean;
};

type Bill = {
  id: number;
  date: string;
  createdAt: string;
  totalAmount: number;
  paymentMode: string;
  smsSent: boolean;
  customerId: number;
  customerName: string;
  customerPhone: string;
  items: BillItem[];
};

const MODES = ["All", "Cash", "Card", "Online", "Membership"] as const;
type Mode = (typeof MODES)[number];

const modeConfig: Record<string, { label: string; color: string; badge: string; text: string }> = {
  cash:       { label: "💵 Cash",       color: "bg-emerald-100 text-emerald-700 border-emerald-200", badge: "bg-emerald-100 text-emerald-700", text: "Cash" },
  card:       { label: "💳 Card",       color: "bg-blue-100 text-blue-700 border-blue-200",         badge: "bg-blue-100 text-blue-700",       text: "Card" },
  online:     { label: "📱 Online",     color: "bg-violet-100 text-violet-700 border-violet-200",   badge: "bg-violet-100 text-violet-700",   text: "Online" },
  membership: { label: "🎫 Membership", color: "bg-indigo-100 text-indigo-700 border-indigo-200",   badge: "bg-indigo-100 text-indigo-700",   text: "Membership" },
};

export function PaymentHistoryClient({ bills }: { bills: Bill[] }) {
  const [activeMode, setActiveMode] = useState<Mode>("All");
  const [search, setSearch] = useState("");

  const filtered = bills.filter((b) => {
    const modeMatch = activeMode === "All" || b.paymentMode === activeMode.toLowerCase();
    const searchMatch =
      !search.trim() ||
      b.customerName.toLowerCase().includes(search.toLowerCase()) ||
      b.customerPhone.includes(search);
    return modeMatch && searchMatch;
  });

  // Totals per mode
  const totals = {
    all: bills.reduce((s, b) => s + b.totalAmount, 0),
    cash: bills.filter((b) => b.paymentMode === "cash").reduce((s, b) => s + b.totalAmount, 0),
    card: bills.filter((b) => b.paymentMode === "card").reduce((s, b) => s + b.totalAmount, 0),
    online: bills.filter((b) => b.paymentMode === "online").reduce((s, b) => s + b.totalAmount, 0),
    membership: bills.filter((b) => b.paymentMode === "membership").reduce((s, b) => s + b.totalAmount, 0),
  };

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(["All", "Cash", "Card", "Online", "Membership"] as const).map((mode) => {
            const key = mode.toLowerCase() as keyof typeof totals;
            const count = mode === "All" ? bills.length : bills.filter((b) => b.paymentMode === mode.toLowerCase()).length;
            const cfg = mode === "All" ? null : modeConfig[mode.toLowerCase()];
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setActiveMode(mode)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  activeMode === mode
                    ? "border-indigo-300 bg-indigo-50 shadow-sm"
                    : "border-slate-100 bg-white hover:border-indigo-200"
                }`}
              >
                <p className="text-[11px] font-semibold text-slate-500 mb-1">
                  {cfg ? cfg.label : "🧾 All"}
                </p>
                <p className="text-[18px] font-bold text-slate-800">
                  ₹{totals[key].toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{count} bills</p>
              </button>
            );
          })}
        </div>

        {/* Search + filter header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <History size={15} className="text-indigo-500 flex-shrink-0" />
              <h2 className="text-[15px] font-semibold text-slate-800">
                {activeMode === "All" ? "All Payments" : `${activeMode} Payments`}
              </h2>
              <span className="text-[11px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {filtered.length}
              </span>
            </div>
            <div className="relative w-full sm:w-56">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or phone..."
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Tab pills */}
          <div className="px-5 py-3 flex items-center gap-2 border-b border-slate-50 overflow-x-auto">
            {MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setActiveMode(mode)}
                className={`flex-shrink-0 px-3 py-1 rounded-lg text-[12px] font-semibold border transition-colors ${
                  activeMode === mode
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {mode === "Cash" ? "💵 Cash"
                  : mode === "Card" ? "💳 Card"
                  : mode === "Online" ? "📱 Online"
                  : mode === "Membership" ? "🎫 Membership"
                  : "🧾 All"}
              </button>
            ))}
          </div>

          {/* Bills list */}
          {filtered.length === 0 ? (
            <EmptyState
              icon={<History size={22} />}
              title="No payments found"
              description="Try changing the filter or search"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Date</th>
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Customer</th>
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Services</th>
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Mode</th>
                    <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((bill, idx) => {
                    const cfg = modeConfig[bill.paymentMode];
                    return (
                      <motion.tr
                        key={bill.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: idx * 0.02 }}
                        className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <p className="text-[12px] font-medium text-slate-700">{formatDate(bill.date)}</p>
                          <p className="text-[10px] text-slate-400">#{bill.id}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-[13px] font-semibold text-slate-800">{bill.customerName}</p>
                          <p className="text-[11px] text-slate-400">{bill.customerPhone}</p>
                        </td>
                        <td className="px-4 py-3.5 max-w-[220px]">
                          <div className="space-y-0.5">
                            {bill.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-1.5 text-[11px]">
                                <span className="text-slate-700 truncate">{item.serviceName}</span>
                                <span className="text-slate-400 flex-shrink-0">· {item.employeeName}</span>
                                {item.isMembershipService && (
                                  <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1 rounded flex-shrink-0">M</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg border ${cfg?.color ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                            {cfg?.label ?? bill.paymentMode}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <p className="text-[14px] font-bold text-slate-800">₹{bill.totalAmount.toLocaleString("en-IN")}</p>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
