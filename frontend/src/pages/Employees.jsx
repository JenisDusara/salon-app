import { useEffect, useState } from "react";
import { getEmployees, createEmployee, getEmployeeReport } from "../api";
import toast from "react-hot-toast";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [report, setReport] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      const res = await getEmployees();
      setEmployees(res.data);
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone) return toast.error("Name and phone are required");
    setSaving(true);
    try {
      await createEmployee(form);
      toast.success("Employee added successfully");
      setForm({ name: "", phone: "" });
      setShowForm(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add employee");
    } finally {
      setSaving(false);
    }
  };

  const handleReport = async (id) => {
    try {
      const res = await getEmployeeReport(id);
      setReport(res.data);
    } catch {
      toast.error("Failed to load report");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Employees</div>
          <div className="page-subtitle">{employees.length} active staff members</div>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Employee"}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>New Employee</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name *</label>
              <input placeholder="e.g. Rahul Sharma" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone Number *</label>
              <input placeholder="10-digit mobile" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <button className="btn-primary" onClick={handleSubmit} disabled={saving} style={{ height: 38, whiteSpace: "nowrap" }}>
              {saving ? "Saving..." : "Save Employee"}
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>All Employees</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>{employees.length} records</div>
        </div>
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : employees.length === 0 ? (
          <div className="empty-state">No employees found. Add your first staff member.</div>
        ) : (
          <table>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th>#</th>
                <th>Employee</th>
                <th>Phone</th>
                <th>Joined Date</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e, i) => (
                <tr key={e.id}>
                  <td style={{ color: "#94a3b8", fontSize: 12 }}>{i + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="avatar">{e.name[0]}</div>
                      <span style={{ fontWeight: 500 }}>{e.name}</span>
                    </div>
                  </td>
                  <td style={{ color: "#475569" }}>{e.phone}</td>
                  <td style={{ color: "#94a3b8", fontSize: 12 }}>{e.joined_date}</td>
                  <td>
                    <span className={`badge ${e.is_active ? "badge-green" : "badge-red"}`}>
                      {e.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn-ghost" onClick={() => handleReport(e.id)} style={{ fontSize: 12, padding: "5px 12px" }}>
                      View Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {report && (
        <div className="modal-overlay" onClick={() => setReport(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="avatar" style={{ width: 44, height: 44, fontSize: 16 }}>{report.employee.name[0]}</div>
                <div>
                  <div className="modal-title" style={{ marginBottom: 2 }}>{report.employee.name}</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>{report.employee.phone}</div>
                </div>
              </div>
              <button className="btn-ghost" onClick={() => setReport(null)} style={{ padding: "5px 10px", fontSize: 13 }}>✕</button>
            </div>

            <div className="grid-2" style={{ gap: 12 }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#15803d", marginBottom: 6, fontWeight: 500 }}>Total Services Done</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#15803d" }}>{report.total_services}</div>
              </div>
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#1d4ed8", marginBottom: 6, fontWeight: 500 }}>Total Revenue Generated</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#1d4ed8" }}>₹{report.total_income.toFixed(0)}</div>
              </div>
            </div>

            {report.service_history && report.service_history.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                  Service History
                </div>
                <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 8 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>Date</th>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>Customer</th>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>Service</th>
                        <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.service_history.map((h, i) => (
                        <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 12px", color: "#94a3b8", fontSize: 12 }}>{h.date}</td>
                          <td style={{ padding: "8px 12px", fontWeight: 500 }}>{h.customer_name}</td>
                          <td style={{ padding: "8px 12px", color: "#475569" }}>{h.service_name}</td>
                          <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: h.is_membership_service ? "#15803d" : "#0f172a" }}>
                            {h.is_membership_service ? "FREE" : `₹${h.price}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <button className="btn-ghost" onClick={() => setReport(null)} style={{ width: "100%", marginTop: 20, padding: 10 }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}