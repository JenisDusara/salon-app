"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, PenLine, Trash2, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageTransition } from "@/components/ui/PageTransition";
import { formatDate, EXPENSE_CATEGORIES, CATEGORY_COLORS } from "@/lib/utils";
import type { Expense, ExpenseSummary } from "@/types";

export function ExpensesClient({ initialExpenses, summary }: { initialExpenses: Expense[]; summary: ExpenseSummary }) {
  const router = useRouter();
  const [expenses, setExpenses] = useState(initialExpenses);
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ category: "Other", amount: "", description: "", date: "" });

  function openAdd() { setForm({ category: "Other", amount: "", description: "", date: "" }); setEditExpense(null); setShowForm(true); }
  function openEdit(e: Expense) { setForm({ category: e.category, amount: String(e.amount), description: e.description ?? "", date: e.date.split("T")[0] }); setEditExpense(e); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditExpense(null); }

  async function handleSave() {
    if (!form.amount || Number(form.amount) <= 0) { toast.error("Enter a valid amount"); return; }
    setSaving(true);
    try {
      if (editExpense) {
        const res = await fetch(`/api/expenses/${editExpense.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: form.category, amount: Number(form.amount), description: form.description || null, date: form.date || undefined }),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setExpenses((prev) => prev.map((e) => e.id === updated.id ? updated : e));
        toast.success("Expense updated");
      } else {
        const res = await fetch("/api/expenses", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: form.category, amount: Number(form.amount), description: form.description || null, date: form.date || undefined }),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setExpenses((prev) => [created, ...prev]);
        toast.success("Expense added");
        router.refresh();
      }
      closeForm();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/expenses/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setExpenses((prev) => prev.filter((e) => e.id !== deleteId));
      toast.success("Expense deleted");
      router.refresh();
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); setDeleteId(null); }
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard label="Today's Expenses" value={summary.today} icon={<TrendingDown size={18} />} color="expense" delay={0} />
          <MetricCard label="Monthly Expenses" value={summary.monthly} icon={<TrendingDown size={18} />} color="expense" delay={0.08} />
          <MetricCard label="Total Expenses" value={summary.total} icon={<TrendingDown size={18} />} color="expense" delay={0.16} />
        </div>

        {/* Category Breakdown */}
        {Object.keys(summary.byCategory).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-[13px] font-semibold text-slate-700 mb-4">By Category</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(summary.byCategory).map(([cat, amt]) => {
                const colors = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other;
                return (
                  <div key={cat} className="flex items-center justify-between rounded-xl px-4 py-3 border" style={{ background: colors.bg, borderColor: colors.border }}>
                    <span className="text-[12px] font-semibold" style={{ color: colors.text }}>{cat}</span>
                    <span className="text-[13px] font-bold" style={{ color: colors.text }}>₹{amt.toLocaleString("en-IN")}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-slate-800">All Expenses</h2>
            <Button variant="primary" size="sm" onClick={openAdd}><Plus size={13} />Add Expense</Button>
          </div>
          {expenses.length === 0 ? (
            <EmptyState icon={<TrendingDown size={22} />} title="No expenses recorded" description="Track your business expenses here" action={<Button variant="primary" size="sm" onClick={openAdd}><Plus size={13} />Add Expense</Button>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Date</th>
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Category</th>
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Description</th>
                    <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Amount</th>
                    <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e, idx) => {
                    const colors = CATEGORY_COLORS[e.category] ?? CATEGORY_COLORS.Other;
                    return (
                      <motion.tr key={e.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: idx * 0.03 }} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 text-[12px] text-slate-500">{formatDate(e.date)}</td>
                        <td className="px-4 py-3.5">
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border" style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}>{e.category}</span>
                        </td>
                        <td className="px-4 py-3.5 text-[12px] text-slate-500 max-w-[200px] truncate">{e.description ?? <span className="text-slate-300">—</span>}</td>
                        <td className="px-4 py-3.5 text-right text-[13px] font-semibold text-rose-600">₹{e.amount.toLocaleString("en-IN")}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => openEdit(e)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"><PenLine size={13} /></button>
                            <button type="button" onClick={() => setDeleteId(e.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 size={13} /></button>
                          </div>
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

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={closeForm} title={editExpense ? "Edit Expense" : "Add Expense"} size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">Amount (₹) *</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" min="0" step="1"
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">Description <span className="text-slate-400">(optional)</span></label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description"
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">Date <span className="text-slate-400">(optional, defaults to today)</span></label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" size="md" className="flex-1" onClick={closeForm}>Cancel</Button>
            <Button variant="primary" size="md" className="flex-1" onClick={handleSave} loading={saving}>{editExpense ? "Save Changes" : "Add Expense"}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Expense" message="This expense record will be permanently deleted." confirmLabel="Delete" variant="danger" loading={deleting} />
    </PageTransition>
  );
}
