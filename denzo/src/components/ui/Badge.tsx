import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type BadgeVariant = "active" | "inactive" | "expired" | "free" | "success" | "warning" | "info" | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  inactive: "bg-slate-100 text-slate-500 border border-slate-200",
  expired: "bg-rose-50 text-rose-600 border border-rose-200",
  free: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  info: "bg-blue-50 text-blue-700 border border-blue-200",
  default: "bg-slate-100 text-slate-600 border border-slate-200",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
