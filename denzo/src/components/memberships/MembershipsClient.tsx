"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, CreditCard, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageTransition } from "@/components/ui/PageTransition";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Membership, MembershipPlan, Service } from "@/types";

interface PlanServiceEntry { serviceId: number; serviceName: string; allowedCount: number; }

export function MembershipsClient({ initialMemberships, initialPlans, services }: {
  initialMemberships: Membership[]; initialPlans: MembershipPlan[]; services: Service[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"memberships" | "plans">("memberships");
  const [memberships, setMemberships] = useState(initialMemberships);
  const [plans, setPlans] = useState(initialPlans);
  const [showAssign, setShowAssign] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editPlan, setEditPlan] = useState<MembershipPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<{ id: number; name: string; phone: string }[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Assign form
  const [assignForm, setAssignForm] = useState({ customerId: "", planId: "", startDate: "" });

  // Plan form
  const [planForm, setPlanForm] = useState({ name: "", price: "", validityDays: "365" });
  const [planServices, setPlanServices] = useState<PlanServiceEntry[]>([]);
  const [addServiceId, setAddServiceId] = useState("");
  const [addAllowedCount, setAddAllowedCount] = useState("1");

  async function openAssign() {
    setAssignForm({ customerId: "", planId: "", startDate: "" });
    setLoadingCustomers(true);
    setShowAssign(true);
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error();
      setCustomers(await res.json());
    } catch { toast.error("Failed to load customers"); }
    finally { setLoadingCustomers(false); }
  }

  function openAddPlan() {
    setPlanForm({ name: "", price: "", validityDays: "365" });
    setPlanServices([]);
    setEditPlan(null);
    setShowPlanForm(true);
  }

  function openEditPlan(p: MembershipPlan) {
    setPlanForm({ name: p.name, price: String(p.price), validityDays: String(p.validityDays) });
    setPlanServices(p.services.map((s) => ({ serviceId: s.serviceId, serviceName: s.serviceName, allowedCount: s.allowedCount })));
    setEditPlan(p);
    setShowPlanForm(true);
  }

  function addPlanService() {
    const svcId = parseInt(addServiceId);
    if (!svcId) { toast.error("Select a service"); return; }
    if (planServices.find((ps) => ps.serviceId === svcId)) { toast.error("Service already added"); return; }
    const svc = services.find((s) => s.id === svcId);
    if (!svc) return;
    setPlanServices((prev) => [...prev, { serviceId: svc.id, serviceName: svc.name, allowedCount: parseInt(addAllowedCount) || 1 }]);
    setAddServiceId(""); setAddAllowedCount("1");
  }

  async function handleAssign() {
    if (!assignForm.customerId || !assignForm.planId) { toast.error("Select customer and plan"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/memberships", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: parseInt(assignForm.customerId), planId: parseInt(assignForm.planId), startDate: assignForm.startDate || undefined }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success("Membership assigned!");
      setShowAssign(false);
      router.refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  }

  async function handleSavePlan() {
    if (!planForm.name.trim() || !planForm.price) { toast.error("Name and price are required"); return; }
    if (planServices.length === 0) { toast.error("Add at least one service"); return; }
    setSaving(true);
    try {
      if (editPlan) {
        const res = await fetch(`/api/memberships/plans/${editPlan.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: planForm.name, price: Number(planForm.price), validityDays: parseInt(planForm.validityDays), services: planServices.map((ps) => ({ serviceId: ps.serviceId, allowedCount: ps.allowedCount })) }),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setPlans((prev) => prev.map((p) => p.id === updated.id ? { ...updated, services: planServices } : p));
        toast.success("Plan updated");
      } else {
        const res = await fetch("/api/memberships/plans", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: planForm.name, price: Number(planForm.price), validityDays: parseInt(planForm.validityDays), services: planServices.map((ps) => ({ serviceId: ps.serviceId, allowedCount: ps.allowedCount })) }),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setPlans((prev) => [{ ...created, services: planServices }, ...prev]);
        toast.success("Plan created!");
        router.refresh();
      }
      setShowPlanForm(false);
    } catch { toast.error("Failed to save plan"); }
    finally { setSaving(false); }
  }

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* Tab switcher */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm border border-slate-100">
            {(["memberships", "plans"] as const).map((tab) => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                className="relative px-5 py-1.5 text-[13px] font-medium rounded-lg transition-colors focus-visible:outline-none"
                style={{ color: activeTab === tab ? "#4f46e5" : "#64748b" }}>
                {activeTab === tab && <motion.span layoutId="memTab" className="absolute inset-0 rounded-lg bg-indigo-50" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                <span className="relative z-10 flex items-center gap-1.5">
                  {tab === "memberships" ? <><CreditCard size={13} />Active Memberships</> : <><Settings size={13} />Manage Plans</>}
                  <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {tab === "memberships" ? memberships.length : plans.length}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <Button variant="primary" size="md" onClick={activeTab === "memberships" ? openAssign : openAddPlan}>
            <Plus size={15} />{activeTab === "memberships" ? "Assign Membership" : "Create Plan"}
          </Button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "memberships" ? (
            <motion.div key="memberships" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.18 }}>
              {memberships.length === 0 ? (
                <EmptyState icon={<CreditCard size={22} />} title="No active memberships" description="Assign a membership plan to a customer" action={<Button variant="primary" size="sm" onClick={openAssign}><Plus size={13} />Assign Membership</Button>} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {memberships.map((m, idx) => (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: idx * 0.06 }}
                      className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${m.isExpired ? "opacity-70 border-slate-200" : "border-slate-100"}`}>
                      <div className="p-5 border-b border-slate-100">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[13px] font-bold">
                              {m.customerName?.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-[14px] font-semibold text-slate-800">{m.customerName}</p>
                          </div>
                          <Badge variant={m.isExpired ? "expired" : "active"}>{m.isExpired ? "Expired" : "Active"}</Badge>
                        </div>
                        <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{m.planName}</span>
                        <p className="text-[11px] text-slate-400 mt-2">Expires: {formatDate(m.expiryDate)}</p>
                      </div>
                      <div className="p-4 space-y-3">
                        {m.services.map((svc) => (
                          <div key={svc.serviceId}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[12px] font-medium text-slate-700">{svc.serviceName}</span>
                              <span className="text-[11px] text-slate-500">{svc.used}/{svc.allowed}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((svc.used / svc.allowed) * 100, 100)}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.2 + idx * 0.06 }}
                                className="h-full rounded-full"
                                style={{ background: svc.used >= svc.allowed ? "#f43f5e" : "#6366f1" }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="plans" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}>
              {plans.length === 0 ? (
                <EmptyState icon={<Settings size={22} />} title="No plans created" description="Create membership plans to offer customers" action={<Button variant="primary" size="sm" onClick={openAddPlan}><Plus size={13} />Create Plan</Button>} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans.map((p, idx) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: idx * 0.06 }}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-5 border-b border-slate-100 flex items-start justify-between">
                        <div>
                          <p className="text-[15px] font-bold text-slate-800">{p.name}</p>
                          <p className="text-[22px] font-bold text-indigo-600 mt-1">{formatCurrency(p.price)}</p>
                          <p className="text-[11px] text-slate-400">{p.validityDays} days validity</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={p.isActive ? "active" : "inactive"}>{p.isActive ? "Active" : "Inactive"}</Badge>
                          <button type="button" onClick={() => openEditPlan(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"><Settings size={14} /></button>
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        {p.services.map((svc) => (
                          <div key={svc.serviceId} className="flex items-center justify-between text-[12px]">
                            <span className="text-slate-700">{svc.serviceName}</span>
                            <span className="font-semibold text-indigo-600">{svc.allowedCount}×</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Assign Modal */}
      <Modal isOpen={showAssign} onClose={() => setShowAssign(false)} title="Assign Membership" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">Customer *</label>
            <select value={assignForm.customerId} onChange={(e) => setAssignForm({ ...assignForm, customerId: e.target.value })}
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" disabled={loadingCustomers}>
              <option value="">{loadingCustomers ? "Loading..." : "Select customer"}</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">Plan *</label>
            <select value={assignForm.planId} onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select plan</option>
              {plans.filter((p) => p.isActive).map((p) => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">Start Date <span className="text-slate-400">(optional)</span></label>
            <input type="date" value={assignForm.startDate} onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" size="md" className="flex-1" onClick={() => setShowAssign(false)}>Cancel</Button>
            <Button variant="primary" size="md" className="flex-1" onClick={handleAssign} loading={saving}>Assign</Button>
          </div>
        </div>
      </Modal>

      {/* Plan Form Modal */}
      <Modal isOpen={showPlanForm} onClose={() => setShowPlanForm(false)} title={editPlan ? "Edit Plan" : "Create Plan"} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">Plan Name *</label>
              <input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="e.g. Gold Membership"
                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">Price (₹) *</label>
              <input type="number" value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} placeholder="0" min="0"
                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">Validity (days)</label>
              <input type="number" value={planForm.validityDays} onChange={(e) => setPlanForm({ ...planForm, validityDays: e.target.value })} min="1"
                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          {/* Services */}
          <div>
            <label className="text-[12px] font-medium text-slate-600 mb-2 block">Included Services</label>
            <div className="flex gap-2 mb-3">
              <select value={addServiceId} onChange={(e) => setAddServiceId(e.target.value)}
                className="flex-1 h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select service</option>
                {services.filter((s) => !planServices.find((ps) => ps.serviceId === s.id)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="number" value={addAllowedCount} onChange={(e) => setAddAllowedCount(e.target.value)} min="1" placeholder="Times"
                className="w-16 h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[12px] text-center focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <Button variant="outline" size="sm" onClick={addPlanService}><Plus size={13} /></Button>
            </div>
            {planServices.length > 0 && (
              <div className="space-y-1.5">
                {planServices.map((ps) => (
                  <div key={ps.serviceId} className="flex items-center justify-between bg-indigo-50 rounded-lg px-3 py-2">
                    <span className="text-[12px] font-medium text-indigo-800">{ps.serviceName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-indigo-600">{ps.allowedCount}×</span>
                      <button type="button" onClick={() => setPlanServices((prev) => prev.filter((p) => p.serviceId !== ps.serviceId))} className="text-indigo-400 hover:text-rose-500 transition-colors"><X size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" size="md" className="flex-1" onClick={() => setShowPlanForm(false)}>Cancel</Button>
            <Button variant="primary" size="md" className="flex-1" onClick={handleSavePlan} loading={saving}>{editPlan ? "Save Changes" : "Create Plan"}</Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}
