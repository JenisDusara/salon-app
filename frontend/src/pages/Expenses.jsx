import { useEffect, useState } from "react";
import { getExpenses, createExpense, deleteExpense, getExpenseSummary } from "../api";
import toast from "react-hot-toast";

const CATEGORIES = ["Rent", "Electricity", "Products", "Coffee/Snacks", "Maintenance", "Other"];

const CATEGORY_COLORS = {
  "Rent":          { bg: "#eff6ff", text: "#1d4ed8" },
  "Electricity":   { bg: "#fffbeb", text: "#b45309" },
  "Products":      { bg: "#f0fdf4", text: "#15803d" },
  "Coffee/Snacks": { bg: "#fdf4ff", text: "#7e22ce" },
  "Maintenance":   { bg: "#fff1f2", text: "#be123c" },
  "Other":         { bg: "#f8fafc", text: "#475569" },
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({ category: "Other", amount: "", description: "", date: "" });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [expRes, sumRes] = await Promise.all([getExpenses(), getExpenseSummary()]);
      setExpenses(expRes.data);
      setSummary(sumRes.data);
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.amount) return toast.error("Amount is required");
    setSaving(true);
    try {
      await createExpense({
        category: form.category,
        amount: parseFloat(form.amount),
        description: form.description || null,
        date: form.date || null,
      });
      toast.success("Expense recorded");
      setForm({ category: "Other", amount: "", description: "", date: "" });
      setShowForm(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense record?")) return;
    try {
      await deleteExpense(id);
      toast.success("Expense deleted");
      fetchAll();
    } catch {
      toast.error("Failed to delete expense");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Expenses</div>
          <div className="page-subtitle">Track all shop expenditures</div>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Expense"}
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid-3" style={{ marginBottom: 24 }}>
          {[
            { label: "Today's Expenses", value: summary.today, accent: "#ef4444" },
            { label: "Monthly Expenses", value: summary.monthly, accent: "#f59e0b" },
            { label: "Total Expenses", value: summary.total, accent: "#8b5cf6" },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.accent}` }}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.accent }}>₹{s.value.toFixed(0)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Category Breakdown */}
      {summary?.by_category && Object.keys(summary.by_category).length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Expenses by Category</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {Object.entries(summary.by_category).map(([cat, amt]) => {
              const c = CATEGORY_COLORS[cat] || CATEGORY_COLORS["Other"];
              return (
                <div key={cat} style={{ background: c.bg, borderRadius: 10, padding: "10px 16px", minWidth: 130 }}>
                  <div style={{ fontSize: 12, color: c.text, fontWeight: 500, marginBottom: 4 }}>{cat}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: c.text }}>₹{amt.toFixed(0)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>New Expense</div>
          <div style={{ display: "grid", gridTemplateColumns: "180px 140px 1fr 160px auto", gap: 12, alignItems: "end" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Category *</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Amount (₹) *</label>
              <input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description</label>
              <input placeholder="Optional note..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <button className="btn-primary" onClick={handleSubmit} disabled={saving} style={{ height: 38, whiteSpace: "nowrap" }}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>All Expenses</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>{expenses.length} records</div>
        </div>
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : expenses.length === 0 ? (
          <div className="empty-state">No expenses recorded yet</div>
        ) : (
          <table>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th>#</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e, i) => {
                const c = CATEGORY_COLORS[e.category] || CATEGORY_COLORS["Other"];
                return (
                  <tr key={e.id}>
                    <td style={{ color: "#94a3b8", fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <span style={{ background: c.bg, color: c.text, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                        {e.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: "#0f172a" }}>₹{e.amount}</td>
                    <td style={{ color: "#64748b" }}>{e.description || "—"}</td>
                    <td style={{ color: "#94a3b8", fontSize: 12 }}>{e.date}</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn-danger" onClick={() => handleDelete(e.id)} style={{ fontSize: 12, padding: "4px 12px" }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}