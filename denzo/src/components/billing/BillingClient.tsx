"use client";

import { motion } from "framer-motion";
import { ChevronDown, Phone, Plus, Receipt, UserPlus, Wallet, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageTransition } from "@/components/ui/PageTransition";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Bill, Customer, Employee, Service } from "@/types";

interface LineItem {
  _key: string;
  serviceId: number;
  employeeId: number;
  price: number;
}

export function BillingClient({
  services,
  employees,
  recentBills: initialBills,
  allCustomers,
}: {
  services: Service[];
  employees: Employee[];
  recentBills: Bill[];
  allCustomers: Customer[];
}) {
  const router = useRouter();
  const [bills, setBills] = useState(initialBills);

  useEffect(() => {
    setBills(initialBills);
  }, [initialBills]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newCustomerMode, setNewCustomerMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { _key: "0", serviceId: 0, employeeId: 0, price: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"cash" | "card" | "online" | "membership" | null>(null);
  const [useMembership, setUseMembership] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Filter suggestions by phone
  useEffect(() => {
    if (!customerQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const matched = allCustomers
      .filter((c) => c.phone.includes(customerQuery))
      .slice(0, 6);
    setSuggestions(matched);

    // Auto-open new customer form when 10 digits typed and no match found
    if (customerQuery.length === 10 && matched.length === 0) {
      setNewCustomerMode(true);
      setNewPhone(customerQuery);
      setShowSuggestions(false);
    }
  }, [customerQuery, allCustomers]);

  // Close suggestions on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function selectCustomer(c: Customer) {
    setSelectedCustomer(c);
    setCustomerQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setNewCustomerMode(false);
    // Auto-enable membership if customer has balance
    if (c.membershipBalance && c.membershipBalance > 0) {
      setUseMembership(true);
      setPaymentMode("membership");
    } else {
      setUseMembership(false);
    }
  }

  function clearCustomer() {
    setSelectedCustomer(null);
    setCustomerQuery("");
    setNewCustomerMode(false);
    setNewName("");
    setNewPhone("");
    setUseMembership(false);
    setPaymentMode(null);
  }

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      { _key: Date.now().toString(), serviceId: 0, employeeId: 0, price: 0 },
    ]);
  }

  function removeLineItem(key: string) {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((i) => i._key !== key));
  }

  function updateLineItem(key: string, field: keyof LineItem, value: number) {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item._key !== key) return item;
        if (field === "serviceId") {
          const svc = services.find((s) => s.id === value);
          return {
            ...item,
            serviceId: value,
            price: svc ? svc.basePrice : item.price,
          };
        }
        return { ...item, [field]: value };
      }),
    );
  }

  const total = lineItems.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
  const isValid =
    (selectedCustomer ||
      (newCustomerMode && newName.trim() && newPhone.trim())) &&
    lineItems.every((i) => i.serviceId && i.employeeId) &&
    paymentMode !== null;

  async function handleSubmit() {
    if (!isValid) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      let customerId = selectedCustomer?.id;

      // Create new customer if needed
      if (newCustomerMode) {
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName, phone: newPhone }),
        });
        if (!res.ok) {
          const e = await res.json();
          throw new Error(e.error ?? "Failed to create customer");
        }
        const created = await res.json();
        customerId = created.id;
      }

      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          paymentMode,
          items: lineItems.map((i) => ({
            serviceId: i.serviceId,
            employeeId: i.employeeId,
            price: Number(i.price),
          })),
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error ?? "Failed");
      }
      const newBill = await res.json();

      toast.success("Bill created! SMS sent ✓");
      setBills((prev) => [newBill, ...prev.slice(0, 14)]);

      // Reset form
      clearCustomer();
      setPaymentMode(null);
      setLineItems([
        { _key: Date.now().toString(), serviceId: 0, employeeId: 0, price: 0 },
      ]);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create bill");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageTransition>
      <div className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-6 items-start">
        {/* LEFT - Create Bill */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Receipt size={16} className="text-indigo-500" />
            <h2 className="text-[15px] font-semibold text-slate-800">
              Create New Bill
            </h2>
          </div>
          <div className="p-6 space-y-5">
            {/* Customer Search */}
            <div>
              <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">
                Customer *
              </label>
              {selectedCustomer ? (
                <>
                  <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[13px] font-bold">
                        {selectedCustomer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-indigo-800">
                          {selectedCustomer.name}
                        </p>
                        <p className="text-[11px] text-indigo-600">
                          {selectedCustomer.phone}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearCustomer}
                      className="text-indigo-400 hover:text-indigo-600 transition-colors"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  {/* Membership Balance Banner */}
                  {selectedCustomer.membershipBalance !== undefined && selectedCustomer.membershipBalance > 0 && (
                    <div className="mt-2 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <Wallet size={12} className="text-emerald-600" />
                        <span className="text-[11px] font-semibold text-emerald-700">
                          Membership Balance: ₹{selectedCustomer.membershipBalance.toFixed(0)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !useMembership;
                          setUseMembership(next);
                          setPaymentMode(next ? "membership" : null);
                        }}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                          useMembership
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {useMembership ? "✓ Using" : "Use"}
                      </button>
                    </div>
                  )}
                </>
              ) : newCustomerMode ? (
                <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-indigo-700 flex items-center gap-1.5">
                      <UserPlus size={13} />
                      New Customer
                    </p>
                    <button
                      type="button"
                      onClick={() => setNewCustomerMode(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Full Name *"
                    className="w-full h-8 rounded-lg border border-slate-200 bg-white px-3 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Phone Number *"
                    maxLength={10}
                    className="w-full h-8 rounded-lg border border-slate-200 bg-white px-3 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ) : (
                <div ref={searchRef} className="relative">
                  <Phone
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={customerQuery}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setCustomerQuery(val);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    inputMode="numeric"
                    placeholder="Enter phone number..."
                    className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {showSuggestions && customerQuery.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                      {suggestions.length > 0 ? (
                        <>
                          {suggestions.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => selectCustomer(c)}
                              className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 transition-colors"
                            >
                              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[12px] font-bold flex-shrink-0">
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-[12px] font-semibold text-slate-800">
                                  {c.name}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {c.phone}
                                </p>
                              </div>
                            </button>
                          ))}
                          <div className="border-t border-slate-100 px-4 py-2">
                            <button
                              type="button"
                              onClick={() => {
                                setNewCustomerMode(true);
                                setShowSuggestions(false);
                                setNewPhone(customerQuery);
                              }}
                              className="text-[12px] text-indigo-600 font-medium flex items-center gap-1.5 hover:text-indigo-800 transition-colors"
                            >
                              <UserPlus size={12} />
                              Add &quot;{customerQuery}&quot; as new customer
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="p-3">
                          <p className="text-[12px] text-slate-500 mb-2">
                            No customers found
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setNewCustomerMode(true);
                              setShowSuggestions(false);
                              setNewPhone(customerQuery);
                            }}
                            className="text-[12px] text-indigo-600 font-medium flex items-center gap-1.5 hover:text-indigo-800 transition-colors"
                          >
                            <UserPlus size={12} />
                            Add as new customer
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Service Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[12px] font-medium text-slate-600">
                  Services *
                </label>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="text-[12px] text-indigo-600 font-medium flex items-center gap-1 hover:text-indigo-800 transition-colors"
                >
                  <Plus size={12} />
                  Add Service
                </button>
              </div>
              <div className="space-y-2">
                {lineItems.map((item) => (
                  <div
                    key={item._key}
                    className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      {/* Service */}
                      <div className="relative">
                        <select
                          value={item.serviceId || ""}
                          onChange={(e) =>
                            updateLineItem(
                              item._key,
                              "serviceId",
                              parseInt(e.target.value, 10),
                            )
                          }
                          className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 pr-6 text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                        >
                          <option value="">Service</option>
                          {services.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={11}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                      </div>
                      {/* Employee */}
                      <div className="relative">
                        <select
                          value={item.employeeId || ""}
                          onChange={(e) =>
                            updateLineItem(
                              item._key,
                              "employeeId",
                              parseInt(e.target.value, 10),
                            )
                          }
                          className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 pr-6 text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                        >
                          <option value="">Employee</option>
                          {employees.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={11}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                      </div>
                    </div>
                    {/* Price */}
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg h-8 px-2 w-24 flex-shrink-0">
                      <span className="text-[12px] text-slate-400">₹</span>
                      <input
                        type="number"
                        value={item.price || ""}
                        onChange={(e) =>
                          updateLineItem(
                            item._key,
                            "price",
                            Number(e.target.value),
                          )
                        }
                        className="flex-1 min-w-0 text-[12px] text-slate-700 focus:outline-none bg-transparent"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(item._key)}
                        className="text-slate-400 hover:text-rose-500 transition-colors flex-shrink-0"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Mode */}
            {!useMembership && (
              <div>
                <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">
                  Payment Mode *
                </label>
                <div className="flex gap-2">
                  {(["cash", "card", "online"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`flex-1 h-9 rounded-xl text-[12px] font-semibold border transition-colors capitalize ${
                        paymentMode === mode
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                      }`}
                    >
                      {mode === "cash" ? "💵 Cash" : mode === "card" ? "💳 Card" : "📱 Online"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Total + Submit */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-slate-600">
                  Total Amount
                </span>
                <span className="text-[22px] font-bold text-slate-800">
                  {formatCurrency(total)}
                </span>
              </div>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleSubmit}
                loading={submitting}
                disabled={!isValid}
              >
                <Receipt size={15} />
                Create Bill &amp; Send SMS
              </Button>
            </div>
          </div>
        </div>


        {/* RIGHT - Recent Bills */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-slate-800">
              Recent Bills
            </h2>
            <span className="text-[11px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {bills.length}
            </span>
          </div>
          <div className="p-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
            {bills.length === 0 ? (
              <EmptyState
                icon={<Receipt size={22} />}
                title="No bills yet"
                description="Create your first bill on the left"
              />
            ) : (
              bills.map((bill, idx) => (
                <motion.div
                  key={bill.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.04 }}
                  className="rounded-xl border border-slate-100 p-4 hover:border-indigo-100 hover:bg-indigo-50/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-slate-800">
                          {bill.customerName}
                        </p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                          bill.paymentMode === "cash"
                            ? "bg-emerald-100 text-emerald-700"
                            : bill.paymentMode === "card"
                            ? "bg-blue-100 text-blue-700"
                            : bill.paymentMode === "membership"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-violet-100 text-violet-700"
                        }`}>
                          {bill.paymentMode === "cash" ? "💵 Cash" : bill.paymentMode === "card" ? "💳 Card" : bill.paymentMode === "membership" ? "🎫 Membership" : "📱 Online"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {formatDate(bill.date)}
                      </p>
                    </div>
                    <p className="text-[14px] font-bold text-slate-800">
                      {formatCurrency(bill.totalAmount)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {bill.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[11px] text-slate-700 truncate">
                            {item.serviceName}
                          </span>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">
                            · {item.employeeName}
                          </span>
                        </div>
                        {item.isMembershipService ? (
                          <Badge variant="free" className="flex-shrink-0">
                            FREE
                          </Badge>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-600 flex-shrink-0">
                            ₹{item.price}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
