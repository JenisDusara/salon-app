"use client";

import { motion } from "framer-motion";
import { PenLine, Plus, Scissors, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PageTransition } from "@/components/ui/PageTransition";
import { formatCurrency } from "@/lib/utils";
import type { Service } from "@/types";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: "easeOut" as const },
  },
};

export function ServicesClient({
  initialServices,
}: {
  initialServices: Service[];
}) {
  const router = useRouter();
  const [services, setServices] = useState(initialServices);

  useEffect(() => {
    setServices(initialServices);
  }, [initialServices]);
  const [showForm, setShowForm] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: "", basePrice: "" });

  function openAdd() {
    setForm({ name: "", basePrice: "" });
    setEditService(null);
    setShowForm(true);
  }
  function openEdit(s: Service) {
    setForm({ name: s.name, basePrice: String(s.basePrice) });
    setEditService(s);
    setShowForm(true);
  }
  function closeForm() {
    setShowForm(false);
    setEditService(null);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.basePrice || Number(form.basePrice) <= 0) {
      toast.error("Please enter a valid service name and price");
      return;
    }
    setSaving(true);
    try {
      if (editService) {
        const res = await fetch(`/api/services/${editService.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            basePrice: Number(form.basePrice),
          }),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setServices((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s)),
        );
        toast.success("Service updated");
      } else {
        const res = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            basePrice: Number(form.basePrice),
          }),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setServices((prev) => [...prev, created]);
        toast.success("Service created");
        router.refresh();
      }
      closeForm();
    } catch {
      toast.error("Failed to save service");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/services/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setServices((prev) => prev.filter((s) => s.id !== deleteId));
      toast.success("Service deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete service");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-slate-500">
              {services.length} service{services.length !== 1 ? "s" : ""}{" "}
              available
            </p>
          </div>
          <Button variant="primary" size="md" onClick={openAdd}>
            <Plus size={15} />
            Add Service
          </Button>
        </div>

        {/* Grid */}
        {services.length === 0 ? (
          <EmptyState
            icon={<Scissors size={22} />}
            title="No services yet"
            description="Add your first service to start creating bills"
            action={
              <Button variant="primary" size="sm" onClick={openAdd}>
                <Plus size={13} />
                Add Service
              </Button>
            }
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {services.map((s) => (
              <motion.div
                key={s.id}
                variants={cardVariants}
                whileHover={{
                  y: -3,
                  boxShadow: "0 12px 32px rgba(99,102,241,0.12)",
                }}
                className="bg-white rounded-2xl border border-slate-100 p-5 group relative overflow-hidden transition-shadow cursor-default"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
              >
                {/* Background accent */}
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 -translate-y-8 translate-x-8" />

                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 relative"
                  style={{
                    background: "linear-gradient(135deg, #eef2ff, #ede9fe)",
                  }}
                >
                  <Scissors size={20} className="text-indigo-500" />
                </div>

                {/* Content */}
                <p className="text-[14px] font-semibold text-slate-800 mb-1 truncate pr-4">
                  {s.name}
                </p>
                <p className="text-[24px] font-bold text-indigo-600">
                  {formatCurrency(s.basePrice)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  base price per session
                </p>

                {/* Actions — appear on hover */}
                <div className="absolute bottom-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button
                    type="button"
                    onClick={() => openEdit(s)}
                    className="p-1.5 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 transition-colors"
                  >
                    <PenLine size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(s.id)}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}

            {/* Add card */}
            <motion.button
              variants={cardVariants}
              type="button"
              onClick={openAdd}
              whileHover={{ y: -3 }}
              className="bg-slate-50 hover:bg-indigo-50 border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 transition-all duration-150 min-h-[160px]"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center">
                <Plus size={18} className="text-slate-400" />
              </div>
              <span className="text-[13px] font-medium text-slate-500">
                Add Service
              </span>
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editService ? "Edit Service" : "Add Service"}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">
              Service Name *
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Hair Cut, Facial, Massage"
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">
              Base Price (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]">
                ₹
              </span>
              <input
                type="number"
                value={form.basePrice}
                onChange={(e) =>
                  setForm({ ...form, basePrice: e.target.value })
                }
                placeholder="0"
                min="0"
                step="1"
                className="w-full h-9 pl-7 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
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
              {editService ? "Save Changes" : "Add Service"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Service"
        message="This service will be permanently deleted. Existing bills won't be affected."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </PageTransition>
  );
}
