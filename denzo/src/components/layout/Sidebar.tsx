"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  CreditCard,
  Eye,
  EyeOff,
  History,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Receipt,
  Scissors,
  Settings,
  TrendingDown,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/customers", icon: Users, label: "Customers" },
  { href: "/employees", icon: UserCheck, label: "Employees" },
  { href: "/billing", icon: Receipt, label: "Billing" },
  { href: "/services", icon: Scissors, label: "Services" },
  { href: "/memberships", icon: CreditCard, label: "Memberships" },
  { href: "/expenses", icon: TrendingDown, label: "Expenses" },
  { href: "/payment-history", icon: History, label: "Payment History" },
  { href: "/marketing", icon: Megaphone, label: "Marketing" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  adminName?: string;
}

export function Sidebar({ isOpen = false, onClose, adminName = "Admin" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Change password form
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const initials = adminName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Logout failed");
    } finally {
      setLoggingOut(false);
    }
  }

  async function handleChangePassword() {
    if (!oldPw || !newPw || !confirmPw) {
      toast.error("All fields are required");
      return;
    }
    if (newPw.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("New passwords do not match");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSuccess(true);
      setOldPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => { setSuccess(false); setShowAdminPanel(false); }, 2000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  function closePanel() {
    setShowAdminPanel(false);
    setOldPw(""); setNewPw(""); setConfirmPw("");
    setSuccess(false);
  }

  return (
    <>
      <aside
        className={`
          fixed left-0 top-0 h-full w-[240px] z-40 flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
        style={{ background: "var(--sidebar)" }}
      >
        {/* Logo */}
        <div className="relative border-b flex items-center justify-between px-9 py-2" style={{ borderColor: "var(--sidebar-border)", background: "#ffffff" }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="flex-0 flex items-center justify-center">
            <img src="/image.png" alt="Denzo Man's Salon" className="h-10 w-auto object-contain" style={{ display: "block", maxWidth: "180px" }} />
          </motion.div>
          <button type="button" suppressHydrationWarning onClick={onClose}
            className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
            style={{ color: "#374151" }}>
            <X size={25} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-3" style={{ color: "#4b5563" }}>Main Menu</p>
          <motion.ul variants={containerVariants} initial="hidden" animate="visible" className="space-y-0.5">
            {navItems.map(({ href, icon: Icon, label }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <motion.li key={href} variants={itemVariants}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative group"
                    style={{
                      background: isActive ? "rgba(99, 102, 241, 0.15)" : "transparent",
                      color: isActive ? "#e2e8f0" : "#6b7280",
                      borderLeft: isActive ? "3px solid #6366f1" : "3px solid transparent",
                    }}
                  >
                    <Icon size={17} style={{ color: isActive ? "#818cf8" : "#6b7280", flexShrink: 0 }} />
                    <span className="text-[13px] font-medium">{label}</span>
                    {isActive && (
                      <motion.div layoutId="activeIndicator" className="absolute right-3 w-1.5 h-1.5 rounded-full" style={{ background: "#6366f1" }} />
                    )}
                  </Link>
                </motion.li>
              );
            })}
          </motion.ul>
        </nav>

        {/* Admin + Logout */}
        <div className="px-4 py-4 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="flex items-center gap-3">
            {/* Clickable admin info */}
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setShowAdminPanel(true)}
              className="flex items-center gap-3 flex-1 min-w-0 rounded-xl px-2 py-2 transition-colors hover:bg-white/5 text-left"
            >
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white" }}>
                  {initials}
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2" style={{ background: "#10b981", borderColor: "var(--sidebar)" }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-slate-200 truncate">Denzo Salon</p>
                <p className="text-[11px] truncate capitalize" style={{ color: "#6b7280" }}>{adminName}</p>
              </div>
              <Settings size={13} style={{ color: "#4b5563", flexShrink: 0 }} />
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              title="Logout"
              suppressHydrationWarning
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ background: "rgba(239,68,68,0.08)", color: loggingOut ? "#4b5563" : "#ef4444" }}
            >
              {loggingOut ? (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-red-800 border-t-red-400 animate-spin" />
              ) : (
                <LogOut size={14} />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Admin Panel Overlay ── */}
      <AnimatePresence>
        {showAdminPanel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={closePanel}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[380px]"
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: "#0f172a", border: "1px solid rgba(99,102,241,0.2)" }}>

                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white" }}>
                      {initials}
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-white">Denzo Salon</p>
                      <p className="text-[11px] capitalize" style={{ color: "#6b7280" }}>{adminName}</p>
                    </div>
                  </div>
                  <button type="button" onClick={closePanel} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "#6b7280" }}>
                    <X size={16} />
                  </button>
                </div>

                {/* Info row */}
                <div className="px-5 py-3 flex gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {[
                    { label: "Role", value: "Owner" },
                    { label: "Status", value: "Active", green: true },
                    { label: "Access", value: "Full" },
                  ].map((item) => (
                    <div key={item.label} className="flex-1 rounded-xl px-3 py-2.5 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <p className="text-[10px] font-medium mb-1" style={{ color: "#4b5563" }}>{item.label}</p>
                      <p className={`text-[12px] font-bold ${item.green ? "text-emerald-400" : "text-slate-300"}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Change Password */}
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <KeyRound size={14} style={{ color: "#6366f1" }} />
                    <p className="text-[13px] font-semibold text-slate-300">Change Password</p>
                  </div>

                  {success ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-6 gap-3"
                    >
                      <CheckCircle size={40} className="text-emerald-400" />
                      <p className="text-[14px] font-semibold text-emerald-400">Password changed!</p>
                    </motion.div>
                  ) : (
                    <>
                      {/* Old Password */}
                      <div className="relative">
                        <input
                          type={showOld ? "text" : "password"}
                          value={oldPw}
                          onChange={(e) => setOldPw(e.target.value)}
                          placeholder="Current password"
                          suppressHydrationWarning
                          className="w-full h-10 rounded-xl px-4 pr-10 text-[13px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                        />
                        <button type="button" suppressHydrationWarning onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#4b5563" }}>
                          {showOld ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>

                      {/* New Password */}
                      <div className="relative">
                        <input
                          type={showNew ? "text" : "password"}
                          value={newPw}
                          onChange={(e) => setNewPw(e.target.value)}
                          placeholder="New password (min 6 chars)"
                          suppressHydrationWarning
                          className="w-full h-10 rounded-xl px-4 pr-10 text-[13px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                        />
                        <button type="button" suppressHydrationWarning onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#4b5563" }}>
                          {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>

                      {/* Confirm Password */}
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          value={confirmPw}
                          onChange={(e) => setConfirmPw(e.target.value)}
                          placeholder="Confirm new password"
                          suppressHydrationWarning
                          className="w-full h-10 rounded-xl px-4 pr-10 text-[13px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                        />
                        <button type="button" suppressHydrationWarning onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#4b5563" }}>
                          {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>

                      {/* Strength indicator */}
                      {newPw.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex gap-1">
                            {[1,2,3,4].map((i) => (
                              <div key={i} className="h-1 flex-1 rounded-full transition-colors duration-300"
                                style={{
                                  background: newPw.length >= i * 3
                                    ? newPw.length < 6 ? "#f59e0b" : newPw.length < 9 ? "#6366f1" : "#10b981"
                                    : "rgba(255,255,255,0.08)"
                                }}
                              />
                            ))}
                          </div>
                          <p className="text-[10px]" style={{ color: newPw.length < 6 ? "#f59e0b" : newPw.length < 9 ? "#818cf8" : "#10b981" }}>
                            {newPw.length < 6 ? "Too short" : newPw.length < 9 ? "Good" : "Strong"}
                          </p>
                        </div>
                      )}

                      {/* Save button */}
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={handleChangePassword}
                        disabled={saving}
                        className="w-full h-10 rounded-xl text-[13px] font-semibold text-white transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                      >
                        {saving ? (
                          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                          <>
                            <KeyRound size={14} />
                            Update Password
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>

                {/* Logout inside panel */}
                <div className="px-5 pb-4">
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={handleLogout}
                    className="w-full h-9 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition-colors"
                    style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
