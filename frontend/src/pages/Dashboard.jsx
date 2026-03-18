import { useEffect, useState } from "react";
import { getDashboard, getProfit, getBills, getCustomers, getEmployees, getMemberships, getExpenses } from "../api";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

const icons = {
  revenue: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  expense: "M20 12V22H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z",
  profit: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
  customers: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 2a4 4 0 0 1 0 7.75M23 21v-2a4 4 0 0 0-3-3.87",
};

const MetricCard = ({ label, value, icon, color, bg, borderColor, sub }) => (
  <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: `1px solid ${borderColor}`, borderTop: `3px solid ${color}`, display: "flex", flexDirection: "column", gap: 6 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </div>
    </div>
    <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "#94a3b8" }}>{sub}</div>}
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>{children}</div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [profit, setProfit] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState("today");

  useEffect(() => {
    getDashboard()
      .then(res => setData(res.data))
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const fetchProfit = async () => {
    if (!startDate || !endDate) return toast.error("Select both dates");
    setCalculating(true);
    try {
      const res = await getProfit(startDate, endDate);
      setProfit(res.data);
    } catch {
      toast.error("Failed to fetch profit");
    } finally {
      setCalculating(false);
    }
  };

  const exportExcel = async () => {
    try {
      const [billsRes, cusRes, empRes, memRes, expRes] = await Promise.all([
        getBills(), getCustomers(), getEmployees(), getMemberships(), getExpenses()
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cusRes.data.map(c => ({
        Name: c.name, Phone: c.phone, Email: c.email || "",
        "Total Visits": c.total_visits, "Joined Date": c.created_at?.split("T")[0] || "",
      }))), "Customers");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(empRes.data.map(e => ({
        Name: e.name, Phone: e.phone, "Joined Date": e.joined_date, Status: e.is_active ? "Active" : "Inactive",
      }))), "Employees");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(memRes.data.map(m => ({
        Customer: m.customer_name, Plan: m.plan_name,
        "Start Date": m.start_date, "Expiry Date": m.expiry_date, Status: m.is_active ? "Active" : "Expired",
      }))), "Memberships");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(billsRes.data.map(b => ({
        "Bill ID": b.id, Customer: b.customer_name, Date: b.date,
        "Total Amount": b.total_amount, "SMS Sent": b.sms_sent ? "Yes" : "No",
      }))), "Bills");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expRes.data.map(e => ({
        Category: e.category, Amount: e.amount, Description: e.description || "", Date: e.date,
      }))), "Expenses");
      XLSX.writeFile(wb, `salon-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Excel exported!");
    } catch {
      toast.error("Export failed");
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "#64748b", fontSize: 14 }}>
      Loading dashboard...
    </div>
  );
  if (!data) return null;

  const todayProfit = data.today.profit;
  const monthlyProfit = data.monthly.profit;
  const membershipActivity = data.today_membership_activity || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>Dashboard</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Live overview of your salon</div>
        </div>
        <button onClick={exportExcel} style={{ padding: "8px 16px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          ↓ Export Excel
        </button>
      </div>

      {/* Tab Buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        {["today", "monthly"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "7px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
            background: activeTab === tab ? "#0f172a" : "#f1f5f9",
            color: activeTab === tab ? "#fff" : "#64748b",
          }}>
            {tab === "today" ? "Today" : "This Month"}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {activeTab === "today" ? <>
          <MetricCard label="Revenue" value={`₹${data.today.income.toFixed(0)}`} icon={icons.revenue} color="#3b82f6" bg="#eff6ff" borderColor="#e2e8f0" sub="Collected" />
          <MetricCard label="Expenses" value={`₹${data.today.expenses.toFixed(0)}`} icon={icons.expense} color="#f43f5e" bg="#fff1f2" borderColor="#e2e8f0" sub="Spent" />
          <MetricCard label="Profit" value={`₹${todayProfit.toFixed(0)}`} icon={icons.profit} color={todayProfit >= 0 ? "#10b981" : "#f43f5e"} bg={todayProfit >= 0 ? "#f0fdf4" : "#fff1f2"} borderColor="#e2e8f0" sub="Net" />
        </> : <>
          <MetricCard label="Revenue" value={`₹${data.monthly.income.toFixed(0)}`} icon={icons.revenue} color="#8b5cf6" bg="#f5f3ff" borderColor="#e2e8f0" sub="Billed" />
          <MetricCard label="Expenses" value={`₹${data.monthly.expenses.toFixed(0)}`} icon={icons.expense} color="#f59e0b" bg="#fffbeb" borderColor="#e2e8f0" sub="Spent" />
          <MetricCard label="Profit" value={`₹${monthlyProfit.toFixed(0)}`} icon={icons.profit} color={monthlyProfit >= 0 ? "#10b981" : "#f43f5e"} bg={monthlyProfit >= 0 ? "#f0fdf4" : "#fff1f2"} borderColor="#e2e8f0" sub="Net" />
        </>}
      </div>

      {/* Overall Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <MetricCard label="Total Revenue" value={`₹${data.overall.income.toFixed(0)}`} icon={icons.revenue} color="#3b82f6" bg="#eff6ff" borderColor="#e2e8f0" />
        <MetricCard label="Total Expenses" value={`₹${data.overall.expenses.toFixed(0)}`} icon={icons.expense} color="#f43f5e" bg="#fff1f2" borderColor="#e2e8f0" />
        <MetricCard label="Net Profit" value={`₹${data.overall.profit.toFixed(0)}`} icon={icons.profit} color="#10b981" bg="#f0fdf4" borderColor="#e2e8f0" />
        <MetricCard label="Customers" value={data.total_customers} icon={icons.customers} color="#0ea5e9" bg="#f0f9ff" borderColor="#e2e8f0" sub="Registered" />
      </div>

      {/* Bottom row: Labour + Membership Activity + Profit Calc */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

        {/* Labour Performance */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Labour Performance</div>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{data.labour_income.length} staff</span>
          </div>
          {data.labour_income.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>No data yet</div>
          ) : data.labour_income.map((e, i) => (
            <div key={e.employee_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px", borderBottom: i < data.labour_income.length - 1 ? "1px solid #f8fafc" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#0ea5e9" }}>
                  {e.employee_name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{e.employee_name}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>{e.total_services} services</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>₹{e.total_income.toFixed(0)}</div>
                <div style={{ fontSize: 10, color: "#10b981" }}>revenue</div>
              </div>
            </div>
          ))}
        </div>

        {/* Today's Membership Activity */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Today's Members</div>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{membershipActivity.length} visits</span>
          </div>
          {membershipActivity.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>No membership visits today</div>
          ) : membershipActivity.map((m, i) => (
            <div key={i} style={{ padding: "11px 18px", borderBottom: i < membershipActivity.length - 1 ? "1px solid #f8fafc" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#8b5cf6" }}>
                  {m.customer_name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{m.customer_name}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>{m.plan_name} plan</div>
                </div>
              </div>
              <div style={{ paddingLeft: 38, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {m.services_used.map((s, j) => (
                  <span key={j} style={{ fontSize: 10, background: "#f0fdf4", color: "#15803d", borderRadius: 20, padding: "2px 8px", fontWeight: 500 }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Profit Calculator */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>Final Profit / Balance</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 14 }}>Custom date range</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          <button onClick={fetchProfit} disabled={calculating} style={{ width: "100%", padding: "9px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {calculating ? "Calculating..." : "Calculate Profit"}
          </button>
          {profit && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ height: 1, background: "#f1f5f9" }} />
              {[
                { label: "Revenue", value: profit.total_income, color: "#10b981", bg: "#f0fdf4" },
                { label: "Expenses", value: profit.total_expenses, color: "#f43f5e", bg: "#fff1f2" },
                { label: "Net Profit", value: profit.net_profit, color: profit.net_profit >= 0 ? "#1e40af" : "#f43f5e", bg: profit.net_profit >= 0 ? "#eff6ff" : "#fff1f2" },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: r.bg, borderRadius: 7 }}>
                  <span style={{ fontSize: 11, color: "#475569", fontWeight: 500 }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>₹{r.value.toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}