import { useEffect, useState } from "react";
import { getMarketingCustomers, sendBulkSMS, getCampaigns } from "../api";
import toast from "react-hot-toast";

const TEMPLATES = [
  {
    label: "Festival Offer",
    text: "🎉 Festival Special! Hair Cut only ₹99. Visit us today and look your best. Limited time offer!",
  },
  {
    label: "Weekend Offer",
    text: "🎊 Weekend Special! Get 20% off on all services this Saturday & Sunday. Book your slot now!",
  },
  {
    label: "New Service",
    text: "✨ We've added new services at our salon! Visit us to experience something new. Special intro prices available.",
  },
  {
    label: "Loyalty Message",
    text: "💙 Thank you for being our valued customer! Visit us this week and get a special discount just for you.",
  },
];

export default function Marketing() {
  const [customers, setCustomers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [cusRes, camRes] = await Promise.all([getMarketingCustomers(), getCampaigns()]);
      setCustomers(cusRes.data);
      setCampaigns(camRes.data);
    } catch {
      toast.error("Failed to load data");
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return toast.error("Please enter a message");
    if (!window.confirm(`Send SMS to all ${customers.length} customers?`)) return;
    setSending(true);
    setResult(null);
    try {
      const res = await sendBulkSMS(message);
      setResult(res.data);
      toast.success(`SMS sent to ${res.data.sent} customers!`);
      setMessage("");
      fetchAll();
    } catch {
      toast.error("Failed to send SMS");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Marketing</div>
          <div className="page-subtitle">Send promotional SMS to all {customers.length} customers</div>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>

        {/* ── Left: Compose ── */}
        <div>
          {/* Templates */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Quick Templates</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TEMPLATES.map(t => (
                <div
                  key={t.label}
                  onClick={() => setMessage(t.text)}
                  style={{
                    padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8,
                    cursor: "pointer", transition: "all 0.15s",
                    background: message === t.text ? "#eff6ff" : "#fff",
                    borderColor: message === t.text ? "#bfdbfe" : "#e2e8f0",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = message === t.text ? "#eff6ff" : "#fff"}
                >
                  <div style={{ fontWeight: 500, fontSize: 13, color: message === t.text ? "#1d4ed8" : "#0f172a", marginBottom: 4 }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{t.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Compose */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Compose Message</div>
            <div className="form-group">
              <label className="form-label">SMS Message *</label>
              <textarea
                rows={5}
                placeholder="Type your promotional message here..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                style={{ resize: "vertical", lineHeight: 1.6 }}
              />
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, textAlign: "right" }}>
                {message.length} characters
              </div>
            </div>

            {/* Preview */}
            {message && (
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>SMS Preview</div>
                <div style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{message}</div>
              </div>
            )}

            {/* Recipients info */}
            <div style={{ background: "#eff6ff", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span style={{ fontSize: 13, color: "#1d4ed8", fontWeight: 500 }}>
                This message will be sent to {customers.length} customers
              </span>
            </div>

            <button
              className="btn-primary"
              onClick={handleSend}
              disabled={sending || !message.trim()}
              style={{ width: "100%", padding: 12, fontSize: 15, fontWeight: 600 }}
            >
              {sending ? "Sending SMS..." : `Send SMS to All ${customers.length} Customers`}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 16 }}>
              <div style={{ fontWeight: 600, color: "#15803d", marginBottom: 10 }}>✓ Campaign Sent Successfully</div>
              <div className="grid-3" style={{ gap: 10 }}>
                {[
                  { label: "Total", value: result.total, color: "#1d4ed8" },
                  { label: "Sent", value: result.sent, color: "#15803d" },
                  { label: "Failed", value: result.failed, color: "#b91c1c" },
                ].map(r => (
                  <div key={r.label} style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{r.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: r.color }}>{r.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Past Campaigns ── */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Past Campaigns</div>
          </div>
          <div style={{ maxHeight: 700, overflowY: "auto" }}>
            {campaigns.length === 0 ? (
              <div className="empty-state">No campaigns sent yet</div>
            ) : campaigns.map(c => (
              <div key={c.id} style={{ padding: "14px 20px", borderBottom: "1px solid #f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                  <span className="badge badge-blue">{c.recipient_count} recipients</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{c.sent_at?.split("T")[0]}</span>
                </div>
                <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{c.message}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}