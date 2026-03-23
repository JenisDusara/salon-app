"use client";

import { Bell, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDateFull, getPageTitle } from "@/lib/utils";

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    setDateStr(formatDateFull());
  }, []);

  return (
    <header className="sticky top-0 z-30 h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-7">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          type="button"
          suppressHydrationWarning
          onClick={onMenuClick}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Menu size={20} className="text-slate-600" />
        </button>

        <div>
          <h1 className="text-[16px] md:text-[17px] font-semibold text-slate-800 leading-tight">
            {title}
          </h1>
          <p className="text-[11px] text-slate-400 min-h-[16px] hidden sm:block">
            {dateStr}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* System online — hidden on very small screens */}
        <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-medium text-emerald-700">
            System Online
          </span>
        </div>
        {/* Notification bell */}
        <button
          type="button"
          suppressHydrationWarning
          className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <Bell size={15} className="text-slate-500" />
        </button>
      </div>
    </header>
  );
}
