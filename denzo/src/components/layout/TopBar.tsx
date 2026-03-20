"use client";

import { usePathname } from "next/navigation";
import { getPageTitle, formatDateFull } from "@/lib/utils";
import { Bell } from "lucide-react";

export function TopBar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-7">
      <div>
        <h1 className="text-[17px] font-semibold text-slate-800">{title}</h1>
        <p className="text-[11px] text-slate-400">{formatDateFull()}</p>
      </div>
      <div className="flex items-center gap-3">
        {/* System online */}
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-medium text-emerald-700">System Online</span>
        </div>
        {/* Notification bell */}
        <button
          type="button"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <Bell size={15} className="text-slate-500" />
        </button>
      </div>
    </header>
  );
}
