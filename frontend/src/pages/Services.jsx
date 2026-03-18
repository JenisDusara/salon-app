import { useEffect, useState } from "react";
import { getServices, createService, updateService, deleteService } from "../api";
import toast from "react-hot-toast";

export default function Services() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ name: "", base_price: "" });
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    try {
      const res = await getServices();
      setServices(res.data);
    } catch {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.base_price) return toast.error("Name and price are required");
    setSaving(true);
    try {
      if (editing) {
        await updateService(editing.id, { name: form.name, base_price: parseFloat(form.base_price) });
        toast.success("Service updated successfully");
        setEditing(null);
      } else {
        await createService({ name: form.name, base_price: parseFloat(form.base_price) });
        toast.success("Service added successfully");
      }
      setForm({ name: "", base_price: "" });
      setShowForm(false);
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name, base_price: s.base_price });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      await deleteService(id);
      toast.success("Service deleted");
      fetchServices();
    } catch {
      toast.error("Failed to delete service");
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({ name: "", base_price: "" });
    setShowForm(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Services</div>
          <div className="page-subtitle">{services.length} services configured</div>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: "", base_price: "" }); }}>
          {showForm && !editing ? "Cancel" : "+ Add Service"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
            {editing ? "Edit Service" : "New Service"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 200px auto auto", gap: 12, alignItems: "end" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Service Name *</label>
              <input placeholder="e.g. Hair Cut, Beard Trim" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Base Price (₹) *</label>
              <input type="number" placeholder="e.g. 200" value={form.base_price} onChange={e => setForm({ ...form, base_price: e.target.value })} />
            </div>
            <button className="btn-primary" onClick={handleSubmit} disabled={saving} style={{ height: 38, whiteSpace: "nowrap" }}>
              {saving ? "Saving..." : editing ? "Update" : "Add Service"}
            </button>
            {editing && (
              <button className="btn-ghost" onClick={handleCancel} style={{ height: 38 }}>Cancel</button>
            )}
          </div>
        </div>
      )}

      {/* Services Grid */}
      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : services.length === 0 ? (
        <div className="card">
          <div className="empty-state">No services found. Add your first service to get started.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {services.map(s => (
            <div key={s.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                  </svg>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn-ghost" onClick={() => handleEdit(s)} style={{ fontSize: 11, padding: "4px 10px" }}>Edit</button>
                  <button className="btn-danger" onClick={() => handleDelete(s.id)} style={{ fontSize: 11, padding: "4px 10px" }}>Delete</button>
                </div>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#1e40af" }}>₹{s.base_price}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Base price per session</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}