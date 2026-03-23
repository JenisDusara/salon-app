"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex bg-slate-100 min-h-screen">
      {/* Mobile backdrop overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 min-h-screen md:ml-[240px]">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-7 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
