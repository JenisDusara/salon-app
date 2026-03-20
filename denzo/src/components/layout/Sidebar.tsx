"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Receipt,
  Scissors,
  CreditCard,
  TrendingDown,
  Megaphone,
  LogOut,
} from "lucide-react";
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
  { href: "/marketing", icon: Megaphone, label: "Marketing" },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

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

  return (
    <aside
      className="fixed left-0 top-0 h-full w-[240px] z-40 flex flex-col"
      style={{ background: "var(--sidebar)" }}
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <Scissors size={18} color="white" />
          </div>
          <div>
            <p className="text-white font-bold text-[16px] leading-tight tracking-widest">DENZO</p>
            <p className="text-[11px]" style={{ color: "#6b7280" }}>
              Management Suite
            </p>
          </div>
        </motion.div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-4">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-3"
          style={{ color: "#4b5563" }}
        >
          Main Menu
        </p>
        <motion.ul
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-0.5"
        >
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <motion.li key={href} variants={itemVariants}>
                <Link
                  href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative group"
                  style={{
                    background: isActive ? "rgba(99, 102, 241, 0.15)" : "transparent",
                    color: isActive ? "#e2e8f0" : "#6b7280",
                    borderLeft: isActive ? "3px solid #6366f1" : "3px solid transparent",
                  }}
                >
                  <Icon
                    size={17}
                    style={{ color: isActive ? "#818cf8" : "#6b7280", flexShrink: 0 }}
                  />
                  <span className="text-[13px] font-medium">{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute right-3 w-1.5 h-1.5 rounded-full"
                      style={{ background: "#6366f1" }}
                    />
                  )}
                </Link>
              </motion.li>
            );
          })}
        </motion.ul>
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold"
              style={{ background: "#1e293b", color: "#818cf8" }}
            >
              AD
            </div>
            <div
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: "#10b981", borderColor: "var(--sidebar)" }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-slate-200 truncate">Admin</p>
            <p className="text-[11px] truncate" style={{ color: "#6b7280" }}>
              Owner · DENZO
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Logout"
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{
              background: "rgba(239,68,68,0.08)",
              color: loggingOut ? "#4b5563" : "#ef4444",
            }}
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
  );
}
