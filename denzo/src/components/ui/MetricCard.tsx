"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { formatCurrency } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  color: "income" | "expense" | "profit" | "info";
  subtitle?: string;
  delay?: number;
  isCurrency?: boolean;
}

const colorConfig = {
  income: {
    bg: "#f0fdf4",
    border: "#bbf7d0",
    topBorder: "#10b981",
    icon: "#10b981",
    iconBg: "#dcfce7",
    text: "#059669",
  },
  expense: {
    bg: "#fff1f2",
    border: "#fecdd3",
    topBorder: "#f43f5e",
    icon: "#f43f5e",
    iconBg: "#ffe4e6",
    text: "#e11d48",
  },
  profit: {
    bg: "#eff6ff",
    border: "#bfdbfe",
    topBorder: "#3b82f6",
    icon: "#3b82f6",
    iconBg: "#dbeafe",
    text: "#2563eb",
  },
  info: {
    bg: "#faf5ff",
    border: "#e9d5ff",
    topBorder: "#8b5cf6",
    icon: "#8b5cf6",
    iconBg: "#ede9fe",
    text: "#7c3aed",
  },
};

export function MetricCard({
  label,
  value,
  icon,
  color,
  subtitle,
  delay = 0,
  isCurrency = true,
}: MetricCardProps) {
  const cfg = colorConfig[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" as const }}
      whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
      className="bg-white rounded-xl p-5 relative overflow-hidden transition-shadow"
      style={{
        borderTop: `3px solid ${cfg.topBorder}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-slate-500 mb-1">{label}</p>
          <p
            className="text-[26px] font-bold truncate"
            style={{ color: cfg.text }}
          >
            {isCurrency ? formatCurrency(value) : value.toLocaleString("en-IN")}
          </p>
          {subtitle && (
            <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: cfg.iconBg, color: cfg.icon }}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
