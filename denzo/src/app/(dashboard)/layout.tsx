import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar />
      <div
        className="flex flex-col flex-1 min-h-screen"
        style={{ marginLeft: "240px" }}
      >
        <TopBar />
        <main className="flex-1 p-7 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
