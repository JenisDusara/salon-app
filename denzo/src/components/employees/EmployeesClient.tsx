"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ChevronDown,
  PenLine,
  Plus,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PageTransition } from "@/components/ui/PageTransition";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Employee, EmployeeReport } from "@/types";

const rowVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.22, delay: i * 0.04, ease: "easeOut" },
  }),
};

export function EmployeesClient({
  initialEmployees,
}: {
  initialEmployees: Employee[];
}) {
  const router = useRouter();
  const [employees, setEmployees] = useState(initialEmployees);

  useEffect(() => {
    setEmployees(initialEmployees);
  }, [initialEmployees]);
  const [showForm, setShowForm] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    joinedDate: "",
    isActive: true,
  });

  // Report modal
  const [reportEmployee, setReportEmployee] = useState<Employee | null>(null);
  const [report, setReport] = useState<EmployeeReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  function openAdd() {
    const today = new Date().toISOString().split("T")[0];
    setForm({ name: "", phone: "", joinedDate: today, isActive: true });
    setEditEmployee(null);
    setShowForm(true);
  }

  function openEdit(e: Employee) {
    setForm({
      name: e.name,
      phone: e.phone,
      joinedDate: e.joinedDate,
      isActive: e.isActive,
    });
    setEditEmployee(e);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditEmployee(null);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.phone.trim() || !form.joinedDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      if (editEmployee) {
        const res = await fetch(`/api/employees/${editEmployee.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            phone: form.phone,
            joinedDate: form.joinedDate,
            isActive: form.isActive,
          }),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setEmployees((prev) =>
          prev.map((e) =>
            e.id === updated.id
              ? {
                  ...updated,
                  joinedDate:
                    updated.joinedDate?.split("T")[0] ?? updated.joinedDate,
                }
              : e,
          ),
        );
        toast.success("Employee updated");
      } else {
        const res = await fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            phone: form.phone,
            joinedDate: form.joinedDate,
          }),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setEmployees((prev) => [
          ...prev,
          {
            ...created,
            joinedDate: created.joinedDate?.split("T")[0] ?? created.joinedDate,
          },
        ]);
        toast.success("Employee added");
        router.refresh();
      }
      closeForm();
    } catch {
      toast.error("Failed to save employee");
    } finally {
      setSaving(false);
    }
  }

  async function openReport(e: Employee) {
    setReportEmployee(e);
    setReport(null);
    setLoadingReport(true);
    setSelectedService(null);
    try {
      const res = await fetch(`/api/employees/${e.id}/report`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReport(data);
    } catch {
      toast.error("Failed to load report");
    } finally {
      setLoadingReport(false);
    }
  }

  const activeCount = employees.filter((e) => e.isActive).length;

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-slate-500">
            {activeCount} active · {employees.length} total
          </p>
          <Button variant="primary" size="md" onClick={openAdd}>
            <Plus size={15} />
            Add Employee
          </Button>
        </div>

        {/* Table */}
        {employees.length === 0 ? (
          <EmptyState
            icon={<Users size={22} />}
            title="No employees yet"
            description="Add your team members to track performance and assign services"
            action={
              <Button variant="primary" size="sm" onClick={openAdd}>
                <Plus size={13} />
                Add Employee
              </Button>
            }
          />
        ) : (
          <div
            className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
          >
            {/* Table header */}
            <div className="grid grid-cols-[1fr_140px_120px_100px_80px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Name
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Phone
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Joined
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Status
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide text-right">
                Actions
              </span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-50">
              {employees.map((e, i) => (
                <motion.div
                  key={e.id}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-[1fr_140px_120px_100px_80px] gap-4 px-5 py-3.5 items-center hover:bg-slate-50/60 transition-colors"
                >
                  {/* Name + avatar */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      }}
                    >
                      {e.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[13px] font-semibold text-slate-800 truncate">
                      {e.name}
                    </span>
                  </div>

                  <span className="text-[13px] text-slate-600">{e.phone}</span>
                  <span className="text-[13px] text-slate-500">
                    {formatDate(e.joinedDate)}
                  </span>

                  <div>
                    <Badge variant={e.isActive ? "active" : "inactive"}>
                      {e.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      type="button"
                      title="View report"
                      onClick={() => openReport(e)}
                      className="p-1.5 rounded-lg bg-violet-50 text-violet-500 hover:bg-violet-100 transition-colors"
                    >
                      <TrendingUp size={13} />
                    </button>
                    <button
                      type="button"
                      title="Edit"
                      onClick={() => openEdit(e)}
                      className="p-1.5 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 transition-colors"
                    >
                      <PenLine size={13} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editEmployee ? "Edit Employee" : "Add Employee"}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">
              Full Name *
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Priya Sharma"
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">
              Phone *
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="10-digit number"
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">
              Joined Date *
            </label>
            <input
              type="date"
              value={form.joinedDate}
              onChange={(e) => setForm({ ...form, joinedDate: e.target.value })}
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          {editEmployee && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={`w-10 h-5 rounded-full transition-colors relative ${form.isActive ? "bg-emerald-500" : "bg-slate-300"}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isActive ? "translate-x-5" : "translate-x-0.5"}`}
                />
              </button>
              <span className="text-[13px] text-slate-600">
                {form.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button
              variant="ghost"
              size="md"
              className="flex-1"
              onClick={closeForm}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={handleSave}
              loading={saving}
            >
              {editEmployee ? "Save Changes" : "Add Employee"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Performance Report Modal */}
      <AnimatePresence>
        {reportEmployee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={() => setReportEmployee(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    }}
                  >
                    {reportEmployee.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-slate-800">
                      {reportEmployee.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Performance Report
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReportEmployee(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                {loadingReport ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
                    ))}
                  </div>
                ) : report ? (
                  (() => {
                    // Group service history by service name
                    const serviceGroups = report.serviceHistory.reduce(
                      (acc, h) => {
                        if (!acc[h.serviceName]) acc[h.serviceName] = [];
                        acc[h.serviceName].push(h);
                        return acc;
                      },
                      {} as Record<string, typeof report.serviceHistory>,
                    );
                    const sortedServices = Object.entries(serviceGroups).sort(
                      (a, b) => b[1].length - a[1].length,
                    );
                    const selectedItems = selectedService
                      ? (serviceGroups[selectedService] ?? [])
                      : [];

                    return (
                      <div className="space-y-5">
                        {/* Summary */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-indigo-50 rounded-xl p-3 text-center">
                            <p className="text-[22px] font-bold text-indigo-600">
                              {report.totalServices}
                            </p>
                            <p className="text-[10px] text-indigo-500 mt-0.5 font-medium">
                              Services Done
                            </p>
                          </div>
                          <div className="bg-emerald-50 rounded-xl p-3 text-center">
                            <p className="text-[22px] font-bold text-emerald-600">
                              {formatCurrency(report.totalIncome)}
                            </p>
                            <p className="text-[10px] text-emerald-500 mt-0.5 font-medium">
                              Revenue Earned
                            </p>
                          </div>
                        </div>

                        {/* Service type buttons */}
                        {sortedServices.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                              Services — tap to see customers
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {sortedServices.map(([name, items]) => {
                                const isSelected = selectedService === name;
                                const revenue = items.reduce(
                                  (s, h) => s + h.price,
                                  0,
                                );
                                return (
                                  <button
                                    key={name}
                                    type="button"
                                    suppressHydrationWarning
                                    onClick={() =>
                                      setSelectedService(
                                        isSelected ? null : name,
                                      )
                                    }
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${
                                      isSelected
                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                                    }`}
                                  >
                                    <span className="text-[12px] font-semibold">
                                      {name}
                                    </span>
                                    <span
                                      className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                                        isSelected
                                          ? "bg-white/20 text-white"
                                          : "bg-indigo-100 text-indigo-600"
                                      }`}
                                    >
                                      ×{items.length}
                                    </span>
                                    <span
                                      className={`text-[11px] font-semibold ${
                                        isSelected
                                          ? "text-indigo-200"
                                          : "text-slate-400"
                                      }`}
                                    >
                                      {formatCurrency(revenue)}
                                    </span>
                                    <motion.div
                                      animate={{ rotate: isSelected ? 180 : 0 }}
                                      transition={{ duration: 0.15 }}
                                    >
                                      <ChevronDown
                                        size={13}
                                        className={
                                          isSelected
                                            ? "text-white"
                                            : "text-slate-400"
                                        }
                                      />
                                    </motion.div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Customer list for selected service */}
                        <AnimatePresence>
                          {selectedService && selectedItems.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.18 }}
                              className="rounded-xl border border-indigo-100 overflow-hidden"
                            >
                              {/* Header */}
                              <div className="bg-indigo-50 px-4 py-2.5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                  <p className="text-[12px] font-bold text-indigo-700">
                                    {selectedService}
                                  </p>
                                </div>
                                <p className="text-[11px] text-indigo-500 font-medium">
                                  {selectedItems.length} customer
                                  {selectedItems.length > 1 ? "s" : ""}
                                </p>
                              </div>

                              {/* Customer rows */}
                              <div className="divide-y divide-slate-50 max-h-56 overflow-y-auto">
                                {selectedItems.map((h, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[11px] font-bold text-indigo-600 flex-shrink-0">
                                        {h.customerName.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[13px] font-semibold text-slate-800 truncate">
                                          {h.customerName}
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                          {formatDate(h.date)}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="text-[13px] font-bold text-slate-700 flex-shrink-0 ml-3">
                                      {formatCurrency(h.price)}
                                    </span>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-[13px] text-slate-400 text-center py-8">
                    No data available
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}