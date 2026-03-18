import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Employees from "./pages/Employees";
import Services from "./pages/Services";
import Billing from "./pages/Billing";
import Expenses from "./pages/Expenses";
import Memberships from "./pages/Memberships";
import Marketing from "./pages/Marketing";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard" },
  { to: "/customers", label: "Customers" },
  { to: "/employees", label: "Employees" },
  { to: "/billing", label: "Billing" },
  { to: "/services", label: "Services" },
  { to: "/memberships", label: "Memberships" },
  { to: "/expenses", label: "Expenses" },
  { to: "/marketing", label: "Marketing" },
];

const NAV_ICONS = {
  Dashboard: "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z",
  Customers: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 2a4 4 0 0 1 0 7.75M23 21v-2a4 4 0 0 0-3-3.87",
  Employees: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  Billing: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8",
  Services: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
  Memberships: "M1 4h22v16H1zM1 10h22",
  Expenses: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  Marketing: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
};

export default function App() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { fontSize: "13px", borderRadius: "10px" } }} />
      <div style={{ display: "flex", minHeight: "100vh" }}>

        {/* Sidebar */}
        <aside style={{
          width: 230, background: "#0f172a", display: "flex",
          flexDirection: "column", position: "fixed", height: "100vh", zIndex: 100,
        }}>
          {/* Logo */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "center" }}>
           <img src="/logo.jpg" alt="logo" style={{ width: "100%", height: 110, objectFit: "cover" }} />
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
            <div style={{ padding: "8px 20px 6px", fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
              Main Menu
            </div>
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 20px", textDecoration: "none",
                  color: isActive ? "#e2e8f0" : "#64748b",
                  background: isActive ? "rgba(59,130,246,0.12)" : "transparent",
                  borderLeft: `3px solid ${isActive ? "#3b82f6" : "transparent"}`,
                  fontSize: 13, transition: "all 0.15s",
                })}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={NAV_ICONS[item.label]} />
                </svg>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1e3a6e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#93c5fd" }}>
                AD
              </div>
              <div>
                <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 500 }}>Admin</div>
                <div style={{ color: "#475569", fontSize: 11 }}>Owner</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ marginLeft: 230, flex: 1, minHeight: "100vh", background: "#f1f5f9" }}>
          {/* Top bar */}
          <div style={{
            background: "#fff", borderBottom: "1px solid #e2e8f0",
            padding: "14px 28px", display: "flex", justifyContent: "space-between",
            alignItems: "center", position: "sticky", top: 0, zIndex: 50,
          }}>
            <div style={{ fontSize: 13, color: "#64748b" }}>{today}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
              <span style={{ fontSize: 13, color: "#64748b" }}>System Online</span>
            </div>
          </div>

          {/* Page Content */}
          <div style={{ padding: 28 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/services" element={<Services />} />
              <Route path="/memberships" element={<Memberships />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/marketing" element={<Marketing />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}