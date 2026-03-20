"use client";

import { motion } from "framer-motion";
import { History, PenLine, Plus, Search, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PageTransition } from "@/components/ui/PageTransition";
import { formatDate } from "@/lib/utils";
import type { BillItemData, Customer } from "@/types";

interface CustomerHistoryData {
  customer: Customer;
  totalVisits: number;
  bills: Array<{
    id: number;
    date: string;
    totalAmount: number;
    items: BillItemData[];
  }>;
}

export function CustomersClient({
  initialCustomers,
}: {
  initialCustomers: Customer[];
}) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initialCustomers);

  // Sync with server data when it changes (e.g. after router.refresh())
  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [historyData, setHistoryData] = useState<CustomerHistoryData | null>(
    null,
  );
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery),
  );

  function openAdd() {
    setForm({ name: "", phone: "", email: "" });
    setEditCustomer(null);
    setShowForm(true);
  }
  function openEdit(c: Customer) {
    setForm({ name: c.name, phone: c.phone, email: c.email ?? "" });
    setEditCustomer(c);
    setShowForm(true);
  }
  function closeForm() {
    setShowForm(false);
    setEditCustomer(null);
  }

  async function openHistory(c: Customer) {
    setHistoryCustomer(c);
    setHistoryData(null);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/customers/${c.id}/history`);
      if (!res.ok) throw new Error();
      setHistoryData(await res.json());
    } catch {
      toast.error("Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    setSaving(true);
    try {
      if (editCustomer) {
        const res = await fetch(`/api/customers/${editCustomer.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, email: form.email || null }),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === updated.id
              ? { ...c, name: updated.name, email: updated.email }
              : c,
          ),
        );
        toast.success("Customer updated");
      } else {
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            phone: form.phone,
            email: form.email || null,
          }),
        });
        if (!res.ok) {
          const e = await res.json();
          throw new Error(e.error);
        }
        const created = await res.json();
        setCustomers((prev) => [created, ...prev]);
        toast.success("Customer added");
        router.refresh();
      }
      closeForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function getVisitBadgeVariant(visits: number) {
    if (visits === 0) return "inactive";
    if (visits < 5) return "info";
    if (visits < 10) return "active";
    return "free";
  }

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full h-9 pl-9 pr-9 rounded-lg border border-slate-200 bg-white text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-500 font-medium bg-white border border-slate-200 rounded-lg px-3 py-1.5">
              {customers.length} total
            </span>
            <Button variant="primary" size="md" onClick={openAdd}>
              <Plus size={15} />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Users size={22} />}
              title={searchQuery ? "No results found" : "No customers yet"}
              description={
                searchQuery
                  ? `No customers match "${searchQuery}"`
                  : "Add your first customer to get started"
              }
              action={
                !searchQuery ? (
                  <Button variant="primary" size="sm" onClick={openAdd}>
                    <Plus size={13} />
                    Add Customer
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">
                      Customer
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Email
                    </th>
                    <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Visits
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Joined
                    </th>
                    <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, idx) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.04 }}
                      className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-slate-800">
                              {c.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {c.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-slate-500">
                        {c.email ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={getVisitBadgeVariant(c.totalVisits)}>
                          {c.totalVisits} visits
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-[12px] text-slate-500">
                        {formatDate(c.createdAt)}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openHistory(c)}
                            className="flex items-center gap-1.5 text-[12px] text-indigo-600 hover:text-indigo-800 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50"
                          >
                            <History size={13} />
                            History
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            className="flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-700 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
                          >
                            <PenLine size={13} />
                            Edit
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editCustomer ? "Edit Customer" : "Add Customer"}
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
              placeholder="Customer name"
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          {!editCustomer && (
            <div>
              <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">
                Phone *
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="10-digit phone number"
                maxLength={10}
                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          )}
          <div>
            <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">
              Email <span className="text-slate-400">(optional)</span>
            </label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
              type="email"
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
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
              {editCustomer ? "Save Changes" : "Add Customer"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={!!historyCustomer}
        onClose={() => setHistoryCustomer(null)}
        title={historyCustomer ? `${historyCustomer.name}'s Visit History` : ""}
        size="lg"
      >
        {historyLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
        ) : historyData ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <Users size={14} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-800">
                  {historyData.totalVisits} total visits
                </p>
                <p className="text-[11px] text-slate-500">
                  {historyCustomer?.phone}
                </p>
              </div>
            </div>
            {historyData.bills.length === 0 ? (
              <p className="text-center text-[13px] text-slate-400 py-6">
                No bills yet
              </p>
            ) : (
              <div className="space-y-3">
                {historyData.bills.map((bill) => (
                  <div
                    key={bill.id}
                    className="rounded-xl border border-slate-100 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[12px] text-slate-500">
                        {formatDate(bill.date)}
                      </p>
                      <p className="text-[14px] font-bold text-slate-800">
                        ₹{bill.totalAmount}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      {bill.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] text-slate-700">
                              {item.serviceName}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              by {item.employeeName}
                            </span>
                          </div>
                          {item.isMembershipService ? (
                            <Badge variant="free">FREE</Badge>
                          ) : (
                            <span className="text-[12px] font-medium text-slate-700">
                              ₹{item.price}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </PageTransition>
  );
}
