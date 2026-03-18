import { useEffect, useState } from "react";
import { getCustomers, createCustomer, getCustomerHistory } from "../api";
import toast from "react-hot-toast";
import ExportButton from "../components/ExportButton";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      const res = await getCustomers();
      setCustomers(res.data);
    } catch {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone) return toast.error("Name and phone are required");
    setSaving(true);
    try {
      await createCustomer(form);
      toast.success("Customer added successfully");
      setForm({ name: "", phone: "", email: "" });
      setShowForm(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add customer");
    } finally {
      setSaving(false);
    }
  };

  const handleHistory = async (id) => {
    try {
      const res = await getCustomerHistory(id);
      setHistory(res.data);
    } catch {
      toast.error("Failed to load history");
    }
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Customers</div>
          <div className="page-subtitle">{customers.length} total customers registered</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <ExportButton
            filename="customers.csv"
            label="Export CSV"
            getData={async () => {
              const res = await getCustomers();
              return res.data.map(c => ({
                ID: c.id, Name: c.name, Phone: c.phone,
                Email: c.email || "", "Total Visits": c.total_visits,
                "Joined Date": c.created_at?.split("T")[0],
              }));
            }}
          />
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Add Customer"}
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>New Customer</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name *</label>
              <input placeholder="e.g. Raj Patel" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone Number *</label>
              <input placeholder="10-digit mobile" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email (Optional)</label>
              <input placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <button className="btn-primary" onClick={handleSubmit} disabled={saving} style={{ height: 38, whiteSpace: "nowrap" }}>
              {saving ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card" style={{ marginBottom: 20, padding: "12px 20px" }}>
        <input
          placeholder="Search by name or phone number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>All Customers</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>{filtered.length} records</div>
        </div>
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No customers found</div>
        ) : (
          <table>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th>#</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Email</th>
                <th style={{ textAlign: "center" }}>Total Visits</th>
                <th>Joined</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id}>
                  <td style={{ color: "#94a3b8", fontSize: 12 }}>{i + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="avatar">{c.name[0]}</div>
                      <span style={{ fontWeight: 500 }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ color: "#475569" }}>{c.phone}</td>
                  <td style={{ color: "#475569" }}>{c.email || "—"}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`badge ${c.total_visits > 5 ? "badge-green" : c.total_visits > 0 ? "badge-blue" : "badge-gray"}`}>
                      {c.total_visits} {c.total_visits === 1 ? "visit" : "visits"}
                    </span>
                  </td>
                  <td style={{ color: "#94a3b8", fontSize: 12 }}>{c.created_at?.split("T")[0]}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn-ghost" onClick={() => handleHistory(c.id)} style={{ fontSize: 12, padding: "5px 12px" }}>
                      View History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* History Modal */}
      {history && (
        <div className="modal-overlay" onClick={() => setHistory(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 20 }}>
              <div>
                <div className="modal-title" style={{ marginBottom: 4 }}>{history.customer.name}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>{history.customer.phone} · {history.total_visits} visits</div>
              </div>
              <button className="btn-ghost" onClick={() => setHistory(null)} style={{ padding: "5px 10px", fontSize: 13 }}>✕</button>
            </div>

            {history.bills.length === 0 ? (
              <div className="empty-state">No billing history found</div>
            ) : history.bills.map(b => (
              <div key={b.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Bill #{b.id}</span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>{b.date}</span>
                </div>
                {b.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569", marginBottom: 4 }}>
                    <span>{item.service}</span>
                    <span style={{ fontWeight: 500 }}>{item.is_membership_service ? <span className="badge badge-green">FREE</span> : `₹${item.price}`}</span>
                  </div>
                ))}
                <hr className="divider" />
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: 14 }}>
                  <span>Total</span>
                  <span style={{ color: "#1e40af" }}>₹{b.total_amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}