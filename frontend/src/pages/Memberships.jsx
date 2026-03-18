import { useEffect, useState } from "react";
import {
  getMembershipPlans, createMembershipPlan, updateMembershipPlan,
  getMemberships, createMembership, getServices, getCustomers,
} from "../api";
import toast from "react-hot-toast";

export default function Memberships() {
  const [tab, setTab] = useState("memberships");
  const [plans, setPlans] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showMemForm, setShowMemForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [saving, setSaving] = useState(false);

  const [planForm, setPlanForm] = useState({ name: "", price: "", validity_days: "365" });
  const [planServices, setPlanServices] = useState([{ service_id: "", allowed_count: "" }]);
  const [memForm, setMemForm] = useState({ customer_id: "", plan_id: "", start_date: "" });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [plRes, memRes, srvRes, cusRes] = await Promise.all([
        getMembershipPlans(), getMemberships(), getServices(), getCustomers(),
      ]);
      setPlans(plRes.data);
      setMemberships(memRes.data);
      setServices(srvRes.data);
      setCustomers(cusRes.data);
    } catch {
      toast.error("Failed to load data");
    }
  };

  const handlePlanSubmit = async () => {
    if (!planForm.name || !planForm.price) return toast.error("Name and price are required");
    const validSvcs = planServices.filter(ps => ps.service_id && ps.allowed_count);
    if (validSvcs.length === 0) return toast.error("Add at least one service");
    setSaving(true);
    try {
      const payload = {
        name: planForm.name,
        price: parseFloat(planForm.price),
        validity_days: parseInt(planForm.validity_days),
        services: validSvcs.map(ps => ({ service_id: parseInt(ps.service_id), allowed_count: parseInt(ps.allowed_count) })),
      };
      if (editingPlan) {
        await updateMembershipPlan(editingPlan.id, payload);
        toast.success("Plan updated");
        setEditingPlan(null);
      } else {
        await createMembershipPlan(payload);
        toast.success("Plan created");
      }
      setPlanForm({ name: "", price: "", validity_days: "365" });
      setPlanServices([{ service_id: "", allowed_count: "" }]);
      setShowPlanForm(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const handleEditPlan = (p) => {
    setEditingPlan(p);
    setPlanForm({ name: p.name, price: p.price, validity_days: p.validity_days });
    setPlanServices(p.services.map(s => ({ service_id: s.service_id, allowed_count: s.allowed_count })));
    setShowPlanForm(true);
    setTab("plans");
  };

  const handleMemSubmit = async () => {
    if (!memForm.customer_id || !memForm.plan_id) return toast.error("Customer and plan are required");
    setSaving(true);
    try {
      await createMembership({
        customer_id: parseInt(memForm.customer_id),
        plan_id: parseInt(memForm.plan_id),
        start_date: memForm.start_date || null,
      });
      toast.success("Membership assigned successfully");
      setMemForm({ customer_id: "", plan_id: "", start_date: "" });
      setShowMemForm(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to assign membership");
    } finally {
      setSaving(false);
    }
  };

  const updateRow = (i, field, val) => {
    const updated = [...planServices];
    updated[i][field] = val;
    setPlanServices(updated);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Memberships</div>
          <div className="page-subtitle">{memberships.length} active memberships · {plans.length} plans</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {tab === "plans" && (
            <button className="btn-primary" onClick={() => { setShowPlanForm(!showPlanForm); setEditingPlan(null); setPlanForm({ name: "", price: "", validity_days: "365" }); setPlanServices([{ service_id: "", allowed_count: "" }]); }}>
              {showPlanForm ? "Cancel" : "+ New Plan"}
            </button>
          )}
          {tab === "memberships" && (
            <button className="btn-primary" onClick={() => setShowMemForm(!showMemForm)}>
              {showMemForm ? "Cancel" : "+ Assign Membership"}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {[{ key: "memberships", label: "Active Memberships" }, { key: "plans", label: "Manage Plans" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "7px 20px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 500,
            background: tab === t.key ? "#1e40af" : "transparent",
            color: tab === t.key ? "#fff" : "#64748b",
            cursor: "pointer",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── MEMBERSHIPS TAB ── */}
      {tab === "memberships" && (
        <>
          {showMemForm && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Assign Membership</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 180px auto", gap: 12, alignItems: "end" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Customer *</label>
                  <select value={memForm.customer_id} onChange={e => setMemForm({ ...memForm, customer_id: e.target.value })}>
                    <option value="">Select customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Plan *</label>
                  <select value={memForm.plan_id} onChange={e => setMemForm({ ...memForm, plan_id: e.target.value })}>
                    <option value="">Select plan</option>
                    {plans.filter(p => p.is_active).map(p => <option key={p.id} value={p.id}>{p.name} — ₹{p.price}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Start Date</label>
                  <input type="date" value={memForm.start_date} onChange={e => setMemForm({ ...memForm, start_date: e.target.value })} />
                </div>
                <button className="btn-primary" onClick={handleMemSubmit} disabled={saving} style={{ height: 38 }}>
                  {saving ? "..." : "Assign"}
                </button>
              </div>
            </div>
          )}

          {memberships.length === 0 ? (
            <div className="card"><div className="empty-state">No memberships found</div></div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
              {memberships.map(m => (
                <div key={m.id} className="card" style={{ padding: 18, borderTop: `3px solid ${m.is_expired ? "#ef4444" : "#10b981"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{m.customer_name}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{m.plan_name}</div>
                    </div>
                    <span className={`badge ${m.is_expired ? "badge-red" : "badge-green"}`}>
                      {m.is_expired ? "Expired" : "Active"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>
                    {m.start_date} → {m.expiry_date}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {m.services.map(s => (
                      <div key={s.service_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", borderRadius: 7, padding: "7px 12px" }}>
                        <span style={{ fontSize: 13, color: "#475569" }}>{s.service_name}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>{s.used}/{s.allowed} used</span>
                          <span className={`badge ${s.remaining === 0 ? "badge-red" : "badge-green"}`}>
                            {s.remaining} left
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── PLANS TAB ── */}
      {tab === "plans" && (
        <>
          {showPlanForm && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{editingPlan ? "Edit Plan" : "New Membership Plan"}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 160px", gap: 12, marginBottom: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Plan Name *</label>
                  <input placeholder="e.g. Gold, Premium" value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Price (₹) *</label>
                  <input type="number" placeholder="2000" value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Validity (days)</label>
                  <input type="number" placeholder="365" value={planForm.validity_days} onChange={e => setPlanForm({ ...planForm, validity_days: e.target.value })} />
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Included Services</div>
              {planServices.map((ps, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 140px auto", gap: 10, marginBottom: 8, alignItems: "center" }}>
                  <select value={ps.service_id} onChange={e => updateRow(i, "service_id", e.target.value)}>
                    <option value="">Select service</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <input type="number" placeholder="Count" value={ps.allowed_count} onChange={e => updateRow(i, "allowed_count", e.target.value)} />
                  {planServices.length > 1 && (
                    <button className="btn-danger" onClick={() => setPlanServices(planServices.filter((_, idx) => idx !== i))} style={{ padding: "7px 12px" }}>✕</button>
                  )}
                </div>
              ))}
              <button className="btn-ghost" onClick={() => setPlanServices([...planServices, { service_id: "", allowed_count: "" }])} style={{ marginBottom: 16, fontSize: 13 }}>
                + Add Service
              </button>

              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-primary" onClick={handlePlanSubmit} disabled={saving}>
                  {saving ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
                </button>
                {editingPlan && (
                  <button className="btn-ghost" onClick={() => { setEditingPlan(null); setShowPlanForm(false); }}>Cancel</button>
                )}
              </div>
            </div>
          )}

          {plans.length === 0 ? (
            <div className="card"><div className="empty-state">No plans created yet</div></div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {plans.map(p => (
                <div key={p.id} className="card" style={{ padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>{p.name}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#1e40af", marginTop: 4 }}>₹{p.price}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "end", gap: 6 }}>
                      <span className={`badge ${p.is_active ? "badge-green" : "badge-red"}`}>{p.is_active ? "Active" : "Inactive"}</span>
                      <button className="btn-ghost" onClick={() => handleEditPlan(p)} style={{ fontSize: 12, padding: "4px 10px" }}>Edit</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>Valid for {p.validity_days} days</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {p.services.map(s => (
                      <div key={s.service_id} style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", borderRadius: 6, padding: "6px 10px" }}>
                        <span style={{ fontSize: 13, color: "#475569" }}>{s.service_name}</span>
                        <span className="badge badge-blue">{s.allowed_count}×</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}