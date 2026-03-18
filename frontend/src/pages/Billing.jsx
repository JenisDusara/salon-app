import { useEffect, useState, useRef } from "react";
import { getCustomers, createCustomer, getServices, getEmployees, createBill, getBills } from "../api";
import toast from "react-hot-toast";

const emptyItem = { service_id: "", employee_id: "", price: "" };

export default function Billing() {
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [bills, setBills] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [phoneInput, setPhoneInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [submitting, setSubmitting] = useState(false);
  const phoneRef = useRef(null);

  useEffect(() => { fetchInitial(); }, []);

  const fetchInitial = async () => {
    try {
      const [srvRes, empRes, billRes, cusRes] = await Promise.all([
        getServices(), getEmployees(), getBills(), getCustomers()
      ]);
      setServices(srvRes.data);
      setEmployees(empRes.data);
      setBills(billRes.data);
      setCustomers(cusRes.data);
    } catch {
      toast.error("Failed to load data");
    }
  };

  const handlePhoneChange = (val) => {
    setPhoneInput(val);
    setSelectedCustomer(null);
    if (val.length >= 3) {
      const matches = customers.filter(c => c.phone.includes(val) || c.name.toLowerCase().includes(val.toLowerCase()));
      setSuggestions(matches.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleNameChange = (val) => {
    setNameInput(val);
    setSelectedCustomer(null);
    if (val.length >= 2) {
      const matches = customers.filter(c => c.name.toLowerCase().includes(val.toLowerCase()));
      setSuggestions(matches.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectCustomer = (c) => {
    setSelectedCustomer(c);
    setPhoneInput(c.phone);
    setNameInput(c.name);
    setEmailInput(c.email || "");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleItemChange = (i, field, val) => {
    const updated = [...items];
    updated[i][field] = val;
    if (field === "service_id") {
      const svc = services.find(s => s.id === parseInt(val));
      if (svc) updated[i].price = svc.base_price;
    }
    setItems(updated);
  };

  const resetForm = () => {
    setPhoneInput(""); setNameInput(""); setEmailInput("");
    setSelectedCustomer(null); setSuggestions([]);
    setItems([{ ...emptyItem }]);
  };

  const handleSubmit = async () => {
    if (!phoneInput) return toast.error("Phone number is required");
    if (!nameInput) return toast.error("Customer name is required");
    const validItems = items.filter(it => it.service_id && it.employee_id);
    if (validItems.length === 0) return toast.error("Add at least one service");

    setSubmitting(true);
    try {
      let customerId = selectedCustomer?.id;
      if (!customerId) {
        const res = await createCustomer({
          name: nameInput.trim(),
          phone: phoneInput.trim(),
          email: emailInput.trim() || null,
        });
        customerId = res.data.id;
        toast.success("New customer saved!");
      }
      await createBill({
        customer_id: customerId,
        items: validItems.map(it => ({
          service_id: parseInt(it.service_id),
          employee_id: parseInt(it.employee_id),
          price: it.price ? parseFloat(it.price) : null,
        })),
      });
      toast.success("Bill created! SMS sent ✓");
      resetForm();
      fetchInitial();
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Failed to create bill");
    } finally {
      setSubmitting(false);
    }
  };

  const total = items.reduce((sum, it) => sum + (parseFloat(it.price) || 0), 0);

  const SuggestionDropdown = ({ list }) => (
    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, zIndex: 100, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", marginTop: 4, overflow: "hidden" }}>
      {list.map(c => (
        <div key={c.id} onClick={() => selectCustomer(c)}
          style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "background 0.1s" }}
          onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
          onMouseLeave={e => e.currentTarget.style.background = "#fff"}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#3b82f6" }}>
              {c.name[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{c.name}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.phone}</div>
            </div>
          </div>
          <span style={{ fontSize: 11, background: "#eff6ff", color: "#3b82f6", borderRadius: 20, padding: "2px 10px", fontWeight: 600 }}>
            {c.total_visits} visits
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Billing</div>
        <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>Create bills and manage transactions</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

        {/* ── Left ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Customer Card */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "20px 22px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
              Customer Details
            </div>

            <div style={{ position: "relative", marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Phone Number *</label>
              <input
                ref={phoneRef}
                placeholder="Enter phone number"
                value={phoneInput}
                onChange={e => handlePhoneChange(e.target.value)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onFocus={() => phoneInput.length >= 3 && setShowSuggestions(true)}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
              {showSuggestions && suggestions.length > 0 && <SuggestionDropdown list={suggestions} />}
            </div>

            <div style={{ position: "relative", marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Customer Name *</label>
              <input
                placeholder="Enter or search name"
                value={nameInput}
                onChange={e => handleNameChange(e.target.value)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onFocus={() => nameInput.length >= 2 && setShowSuggestions(true)}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
              {showSuggestions && suggestions.length > 0 && <SuggestionDropdown list={suggestions} />}
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Email (Optional)</label>
              <input
                placeholder="email@example.com"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {selectedCustomer && (
              <div style={{ marginTop: 14, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 9, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#15803d", fontWeight: 500 }}>
                  Returning customer · {selectedCustomer.total_visits} previous visits
                </span>
              </div>
            )}
          </div>

          {/* Services Card */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "20px 22px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
              Services
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 90px 32px", gap: 8, marginBottom: 8 }}>
              {["Service", "Labour", "Price (₹)", ""].map((h, i) => (
                <div key={i} style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
              ))}
            </div>

            {items.map((item, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 90px 32px", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <select value={item.service_id} onChange={e => handleItemChange(i, "service_id", e.target.value)}
                  style={{ padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, outline: "none" }}>
                  <option value="">Service</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={item.employee_id} onChange={e => handleItemChange(i, "employee_id", e.target.value)}
                  style={{ padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, outline: "none" }}>
                  <option value="">Labour</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <input type="number" placeholder="0" value={item.price}
                  onChange={e => handleItemChange(i, "price", e.target.value)}
                  style={{ padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, outline: "none", width: "100%", boxSizing: "border-box" }} />
                {items.length > 1 ? (
                  <button onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                    style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #fecaca", background: "#fff1f2", color: "#f43f5e", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    ✕
                  </button>
                ) : <div />}
              </div>
            ))}

            <button onClick={() => setItems([...items, { ...emptyItem }])}
              style={{ marginTop: 6, fontSize: 12, color: "#3b82f6", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: 500 }}>
              + Add Another Service
            </button>
          </div>

          {/* Total Bar */}
          <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius: 14, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Total Amount</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#fff", lineHeight: 1 }}>₹{total.toFixed(0)}</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 5 }}>SMS will be sent automatically</div>
            </div>
            <button onClick={handleSubmit} disabled={submitting}
              style={{ padding: "13px 28px", background: submitting ? "#334155" : "#3b82f6", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", transition: "background 0.2s" }}>
              {submitting ? "Processing..." : "Create Bill & Send SMS"}
            </button>
          </div>
        </div>

        {/* ── Right: Recent Bills ── */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Recent Bills</div>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{bills.length} total</span>
          </div>
            <div style={{ height: "calc(100vh - 180px)", overflowY: "auto" }}>
            {bills.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No bills created yet</div>
            ) : bills.slice(0, 15).map(b => (
              <div key={b.id} style={{ padding: "14px 20px", borderBottom: "1px solid #f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#0ea5e9", flexShrink: 0 }}>
                      {b.customer_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{b.customer_name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{b.date}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>₹{b.total_amount}</div>
                    <span style={{ fontSize: 10, background: b.sms_sent ? "#f0fdf4" : "#fffbeb", color: b.sms_sent ? "#15803d" : "#92400e", borderRadius: 20, padding: "2px 8px", fontWeight: 600 }}>
                      {b.sms_sent ? "SMS Sent" : "Pending"}
                    </span>
                  </div>
                </div>
                <div style={{ marginLeft: 46 }}>
                  {b.items.map((item, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#64748b", display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span>{item.service_name} <span style={{ color: "#cbd5e1" }}>· {item.employee_name}</span></span>
                      <span style={{ fontWeight: 600, color: item.is_membership_service ? "#15803d" : "#374151" }}>
                        {item.is_membership_service ? "FREE" : `₹${item.price}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}