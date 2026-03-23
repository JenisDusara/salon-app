"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Gift, Pencil, Plus, Settings, Trash2, Wallet, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PageTransition } from "@/components/ui/PageTransition";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Membership, MembershipPlan } from "@/types";

export function MembershipsClient({
  initialMemberships,
  initialPlans,
}: {
  initialMemberships: Membership[];
  initialPlans: MembershipPlan[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"memberships" | "plans">("memberships");
  const [memberships, setMemberships] = useState(initialMemberships);
  const [plans, setPlans] = useState(initialPlans);

  useEffect(() => { setMemberships(initialMemberships); }, [initialMemberships]);
  useEffect(() => { setPlans(initialPlans); }, [initialPlans]);

  const [showAssign, setShowAssign] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editPlan, setEditPlan] = useState<MembershipPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<{ id: number; name: string; phone: string }[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [assignForm, setAssignForm] = useState({ customerId: "", planId: "" });
  const [planForm, setPlanForm] = useState({ name: "", price: "", bonusPercent: "100", validityDays: "365" });

  // Customer history
  type BillHistory = {
    id: number;
    date: string;
    totalAmount: number;
    paymentMode: string;
    items: { id: number; service: { name: string }; employee: { name: string }; price: number; isMembershipService: boolean }[];
  };
  const [historyCustomer, setHistoryCustomer] = useState<{ id: number; name: string } | null>(null);
  const [historyBills, setHistoryBills] = useState<BillHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  async function openHistory(customerId: number, customerName: string) {
    setHistoryCustomer({ id: customerId, name: customerName });
    setHistoryBills([]);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/history`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Only show membership bills
      setHistoryBills(data.bills.filter((b: BillHistory) => b.paymentMode === "membership"));
    } catch {
      toast.error("Failed to load history");
    } finally {
      setLoadingHistory(false);
    }
  }

  // Edit membership
  const [editMembership, setEditMembership] = useState<Membership | null>(null);
  const [editMemForm, setEditMemForm] = useState({ planId: "", balance: "" });

  function openEditMembership(m: Membership) {
    setEditMembership(m);
    setEditMemForm({ planId: String(m.planId), balance: String(m.balance) });
  }

  async function handleUpdateMembership() {
    if (!editMembership) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/memberships/${editMembership.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: parseInt(editMemForm.planId, 10),
          balance: Number(editMemForm.balance),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Membership updated");
      setEditMembership(null);
      router.refresh();
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePlan(id: number, name: string) {
    if (!confirm(`Delete plan "${name}"?`)) return;
    try {
      const res = await fetch(`/api/memberships/plans/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error);
      }
      const data = await res.json();
      if (data.deactivated) {
        setPlans((prev) => prev.map((p) => p.id === id ? { ...p, isActive: false } : p));
        toast.info(`Plan has existing memberships — marked as Inactive`);
      } else {
        setPlans((prev) => prev.filter((p) => p.id !== id));
        toast.success("Plan deleted");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function handleDeleteMembership(id: number, name: string) {
    if (!confirm(`Delete ${name}'s membership?`)) return;
    try {
      const res = await fetch(`/api/memberships/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setMemberships((prev) => prev.filter((m) => m.id !== id));
      toast.success("Membership deleted");
    } catch {
      toast.error("Delete failed");
    }
  }

  async function openAssign() {
    setAssignForm({ customerId: "", planId: "" });
    setLoadingCustomers(true);
    setShowAssign(true);
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error();
      setCustomers(await res.json());
    } catch {
      toast.error("Failed to load customers");
    } finally {
      setLoadingCustomers(false);
    }
  }

  function openAddPlan() {
    setPlanForm({ name: "", price: "", bonusPercent: "100", validityDays: "365" });
    setEditPlan(null);
    setShowPlanForm(true);
  }

  function openEditPlan(p: MembershipPlan) {
    setPlanForm({
      name: p.name,
      price: String(p.price),
      bonusPercent: String(p.bonusPercent),
      validityDays: String(p.validityDays),
    });
    setEditPlan(p);
    setShowPlanForm(true);
  }

  async function handleAssign() {
    if (!assignForm.customerId || !assignForm.planId) {
      toast.error("Select customer and plan");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: parseInt(assignForm.customerId, 10),
          planId: parseInt(assignForm.planId, 10),
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error);
      }
      toast.success("Membership assigned!");
      setShowAssign(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePlan() {
    if (!planForm.name.trim() || !planForm.price) {
      toast.error("Name and price are required");
      return;
    }
    setSaving(true);
    try {
      if (editPlan) {
        const res = await fetch(`/api/memberships/plans/${editPlan.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: planForm.name,
            price: Number(planForm.price),
            bonusPercent: parseInt(planForm.bonusPercent, 10) || 0,
            validityDays: parseInt(planForm.validityDays, 10),
          }),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        toast.success("Plan updated");
      } else {
        const res = await fetch("/api/memberships/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: planForm.name,
            price: Number(planForm.price),
            bonusPercent: parseInt(planForm.bonusPercent, 10) || 0,
            validityDays: parseInt(planForm.validityDays, 10),
          }),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setPlans((prev) => [created, ...prev]);
        toast.success("Plan created!");
      }
      setShowPlanForm(false);
    } catch {
      toast.error("Failed to save plan");
    } finally {
      setSaving(false);
    }
  }

  // Computed preview for assign modal
  const selectedPlan = plans.find((p) => p.id === parseInt(assignForm.planId, 10));
  const previewTotal = selectedPlan
    ? selectedPlan.price * (1 + selectedPlan.bonusPercent / 100)
    : 0;

  // Computed preview for plan form
  const previewPrice = Number(planForm.price) || 0;
  const previewBonus = (previewPrice * (parseInt(planForm.bonusPercent, 10) || 0)) / 100;
  const previewBalance = previewPrice + previewBonus;

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* Tab switcher */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm border border-slate-100">
            {(["memberships", "plans"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="relative px-5 py-1.5 text-[13px] font-medium rounded-lg transition-colors focus-visible:outline-none"
                style={{ color: activeTab === tab ? "#4f46e5" : "#64748b" }}
              >
                {activeTab === tab && (
                  <motion.span
                    layoutId="memTab"
                    className="absolute inset-0 rounded-lg bg-indigo-50"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {tab === "memberships" ? (
                    <><Wallet size={13} />Active Memberships</>
                  ) : (
                    <><Settings size={13} />Manage Plans</>
                  )}
                  <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {tab === "memberships" ? memberships.length : plans.length}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={activeTab === "memberships" ? openAssign : openAddPlan}
          >
            <Plus size={15} />
            {activeTab === "memberships" ? "Assign Membership" : "Create Plan"}
          </Button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "memberships" ? (
            <motion.div
              key="memberships"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
            >
              {memberships.length === 0 ? (
                <EmptyState
                  icon={<Wallet size={22} />}
                  title="No active memberships"
                  description="Assign a membership plan to a customer"
                  action={
                    <Button variant="primary" size="sm" onClick={openAssign}>
                      <Plus size={13} />
                      Assign Membership
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {memberships.map((m, idx) => {
                    const pct = m.totalBalance > 0 ? (m.balance / m.totalBalance) * 100 : 0;
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: idx * 0.06 }}
                        className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${m.isExpired ? "opacity-70 border-slate-200" : "border-slate-100"}`}
                      >
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[13px] font-bold">
                                {m.customerName?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => openHistory(m.customerId, m.customerName ?? "")}
                                  className="text-[14px] font-semibold text-slate-800 hover:text-indigo-600 transition-colors text-left underline-offset-2 hover:underline"
                                >
                                  {m.customerName}
                                </button>
                                <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                  {m.planName}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge variant={m.isExpired ? "expired" : "active"}>
                                {m.isExpired ? "Expired" : "Active"}
                              </Badge>
                              <button
                                type="button"
                                onClick={() => openEditMembership(m)}
                                className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMembership(m.id, m.customerName ?? "")}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400">Expires: {formatDate(m.expiryDate)}</p>
                        </div>

                        {/* Wallet Balance */}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[12px] text-slate-500 flex items-center gap-1">
                              <Wallet size={11} />
                              Balance
                            </span>
                            <div className="text-right">
                              <p className="text-[18px] font-bold text-slate-800">{formatCurrency(m.balance)}</p>
                              <p className="text-[10px] text-slate-400">of {formatCurrency(m.totalBalance)}</p>
                            </div>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(pct, 100)}%` }}
                              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 + idx * 0.06 }}
                              className="h-full rounded-full"
                              style={{ background: pct < 20 ? "#f43f5e" : "#6366f1" }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 text-right">
                            {pct.toFixed(0)}% remaining
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="plans"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
            >
              {plans.length === 0 ? (
                <EmptyState
                  icon={<Settings size={22} />}
                  title="No plans created"
                  description="Create wallet-based membership plans"
                  action={
                    <Button variant="primary" size="sm" onClick={openAddPlan}>
                      <Plus size={13} />
                      Create Plan
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans.map((p, idx) => {
                    const bonus = p.price * (p.bonusPercent / 100);
                    const total = p.price + bonus;
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: idx * 0.06 }}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                      >
                        <div className="p-5 border-b border-slate-100 flex items-start justify-between">
                          <div>
                            <p className="text-[15px] font-bold text-slate-800">{p.name}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{p.validityDays} days validity</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={p.isActive ? "active" : "inactive"}>
                              {p.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <button
                              type="button"
                              onClick={() => openEditPlan(p)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              <Settings size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePlan(p.id, p.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="p-4 space-y-2.5">
                          <div className="flex items-center justify-between text-[13px]">
                            <span className="text-slate-500">Customer pays</span>
                            <span className="font-bold text-slate-800">{formatCurrency(p.price)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[13px]">
                            <span className="text-slate-500 flex items-center gap-1">
                              <Gift size={12} className="text-emerald-500" />
                              Bonus ({p.bonusPercent}%)
                            </span>
                            <span className="font-semibold text-emerald-600">+{formatCurrency(bonus)}</span>
                          </div>
                          <div className="h-px bg-slate-100" />
                          <div className="flex items-center justify-between text-[13px]">
                            <span className="font-semibold text-slate-700 flex items-center gap-1">
                              <Wallet size={12} className="text-indigo-500" />
                              Total Balance
                            </span>
                            <span className="text-[16px] font-bold text-indigo-600">{formatCurrency(total)}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Customer History Modal */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setHistoryCustomer(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-indigo-500" />
                <div>
                  <p className="text-[14px] font-bold text-slate-800">{historyCustomer.name}</p>
                  <p className="text-[11px] text-slate-400">Service history</p>
                </div>
              </div>
              <button type="button" onClick={() => setHistoryCustomer(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12 text-slate-400 text-[13px]">Loading...</div>
              ) : historyBills.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-slate-400 text-[13px]">No bills found</div>
              ) : (
                historyBills.map((bill) => (
                  <div key={bill.id} className="rounded-xl border border-slate-100 p-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] font-semibold text-slate-700">
                          {new Date(bill.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                          bill.paymentMode === "cash" ? "bg-emerald-100 text-emerald-700"
                          : bill.paymentMode === "card" ? "bg-blue-100 text-blue-700"
                          : bill.paymentMode === "membership" ? "bg-indigo-100 text-indigo-700"
                          : "bg-violet-100 text-violet-700"
                        }`}>
                          {bill.paymentMode === "cash" ? "💵 Cash" : bill.paymentMode === "card" ? "💳 Card" : bill.paymentMode === "membership" ? "🎫 Membership" : "📱 Online"}
                        </span>
                      </div>
                      <p className="text-[13px] font-bold text-slate-800">₹{bill.totalAmount}</p>
                    </div>
                    <div className="space-y-1.5">
                      {bill.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-[12px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-700">{item.service.name}</span>
                            <span className="text-slate-400">· {item.employee.name}</span>
                          </div>
                          {item.isMembershipService ? (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Membership</span>
                          ) : (
                            <span className="text-slate-600 font-medium">₹{item.price}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Assign Modal */}
      <Modal isOpen={showAssign} onClose={() => setShowAssign(false)} title="Assign Membership" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">Customer *</label>
            <select
              value={assignForm.customerId}
              onChange={(e) => setAssignForm({ ...assignForm, customerId: e.target.value })}
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loadingCustomers}
            >
              <option value="">{loadingCustomers ? "Loading..." : "Select customer"}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">Plan *</label>
            <select
              value={assignForm.planId}
              onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select plan</option>
              {plans.filter((p) => p.isActive).map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}</option>
              ))}
            </select>
          </div>
          {selectedPlan && (
            <div className="bg-indigo-50 rounded-xl p-3 text-[12px] space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Customer pays</span>
                <span className="font-semibold">{formatCurrency(selectedPlan.price)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Bonus ({selectedPlan.bonusPercent}%)</span>
                <span className="font-semibold">+{formatCurrency(selectedPlan.price * selectedPlan.bonusPercent / 100)}</span>
              </div>
              <div className="flex justify-between text-indigo-700 font-bold pt-1 border-t border-indigo-100">
                <span>Total wallet balance</span>
                <span>{formatCurrency(previewTotal)}</span>
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" size="md" className="flex-1" onClick={() => setShowAssign(false)}>Cancel</Button>
            <Button variant="primary" size="md" className="flex-1" onClick={handleAssign} loading={saving}>Assign</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Membership Modal */}
      <Modal isOpen={!!editMembership} onClose={() => setEditMembership(null)} title="Edit Membership" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">Change Plan</label>
            <select
              value={editMemForm.planId}
              onChange={(e) => {
                const p = plans.find((pl) => pl.id === parseInt(e.target.value, 10));
                const newBal = p ? p.price * (1 + p.bonusPercent / 100) : Number(editMemForm.balance);
                setEditMemForm({ planId: e.target.value, balance: String(newBal) });
              }}
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select plan</option>
              {plans.filter((p) => p.isActive).map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">Current Balance (₹)</label>
            <input
              type="number"
              value={editMemForm.balance}
              onChange={(e) => setEditMemForm({ ...editMemForm, balance: e.target.value })}
              min="0"
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" size="md" className="flex-1" onClick={() => setEditMembership(null)}>Cancel</Button>
            <Button variant="primary" size="md" className="flex-1" onClick={handleUpdateMembership} loading={saving}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* Plan Form Modal */}
      <Modal
        isOpen={showPlanForm}
        onClose={() => setShowPlanForm(false)}
        title={editPlan ? "Edit Plan" : "Create Plan"}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">Plan Name *</label>
            <input
              value={planForm.name}
              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              placeholder="e.g. Gold Membership"
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">Price (₹) *</label>
              <input
                type="number"
                value={planForm.price}
                onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                placeholder="5000"
                min="0"
                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">Bonus %</label>
              <input
                type="number"
                value={planForm.bonusPercent}
                onChange={(e) => setPlanForm({ ...planForm, bonusPercent: e.target.value })}
                placeholder="100"
                min="0"
                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          {previewPrice > 0 && (
            <div className="bg-indigo-50 rounded-xl p-3 text-[12px] space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Customer pays</span>
                <span className="font-semibold">{formatCurrency(previewPrice)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Bonus</span>
                <span className="font-semibold">+{formatCurrency(previewBonus)}</span>
              </div>
              <div className="flex justify-between text-indigo-700 font-bold pt-1 border-t border-indigo-100">
                <span>Total wallet balance</span>
                <span>{formatCurrency(previewBalance)}</span>
              </div>
            </div>
          )}
          <div>
            <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">Validity (days)</label>
            <input
              type="number"
              value={planForm.validityDays}
              onChange={(e) => setPlanForm({ ...planForm, validityDays: e.target.value })}
              min="1"
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" size="md" className="flex-1" onClick={() => setShowPlanForm(false)}>Cancel</Button>
            <Button variant="primary" size="md" className="flex-1" onClick={handleSavePlan} loading={saving}>
              {editPlan ? "Save Changes" : "Create Plan"}
            </Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}
