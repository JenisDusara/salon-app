"use client";

import { Download, X } from "lucide-react";
import { useRef, useState } from "react";

// ── Salon info – update these to match your actual business details ──
const SALON = {
  name: "DENZO",
  tagline: "Man's Salon",
  address: "Shop No. 5, Main Road, Surat - 395001",
  phone: "+91 98765 43210",
  email: "denzosalon@gmail.com",
};

// Brand colors — matches dashboard (dark sidebar + indigo accent)
const BRAND = "#4f46e5";   // indigo-600
const DARK  = "#0f172a";   // slate-900

interface InvoiceBill {
  id: number;
  date: string;
  totalAmount: number;
  paymentMode: string;
  membershipBalance?: number;
  membershipPlanName?: string;
  customer: { id: number; name: string; phone: string };
  items: {
    id: number;
    service: { id: number; name: string };
    employee: { id: number; name: string };
    price: number;
    isMembershipService: boolean;
  }[];
}

interface InvoiceModalProps {
  bill: InvoiceBill | null;
  onClose: () => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmt(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function InvoiceModal({ bill, onClose }: InvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  if (!bill) return null;

  const b = bill;
  const isMembership = b.paymentMode === "membership";
  const invoiceNo = `#${b.id.toString().padStart(4, "0")}`;
  const paymentLabel =
    b.paymentMode.charAt(0).toUpperCase() + b.paymentMode.slice(1);

  async function handleDownload() {
    if (!invoiceRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).jsPDF;

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice-${invoiceNo}-${b.customer.name.replace(/\s+/g, "_")}.pdf`);
    } catch {
      // fallback
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-[15px] font-semibold text-slate-800">
            Invoice Preview
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-[12px] font-semibold transition-colors"
            >
              <Download size={13} />
              {downloading ? "Generating..." : "Download PDF"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-5">
          <div
            ref={invoiceRef}
            className="bg-white shadow-sm rounded-xl overflow-hidden max-w-[620px] mx-auto"
          >
            {/* ── Header ── */}
            <div className="flex items-stretch min-h-[105px]">
              <div className="flex-1 px-8 py-6 flex flex-col justify-center">
                <div
                  className="text-[24px] font-black tracking-[3px]"
                  style={{ color: BRAND }}
                >
                  {SALON.name}
                </div>
                <div className="text-[9px] text-slate-400 tracking-[3px] uppercase mt-0.5">
                  {SALON.tagline}
                </div>
                <div className="text-[10px] text-slate-400 mt-2 leading-[1.7]">
                  {SALON.address}
                  <br />
                  {SALON.phone} &nbsp;·&nbsp; {SALON.email}
                </div>
              </div>

              {/* Dark clipped block */}
              <div
                className="flex flex-col items-end justify-center gap-2 pr-7"
                style={{
                  width: 210,
                  background: DARK,
                  clipPath: "polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)",
                }}
              >
                <span className="text-[24px] font-black text-white tracking-[5px]">
                  INVOICE
                </span>
                {isMembership && (
                  <span
                    className="text-[8px] font-bold text-white px-2.5 py-0.5 rounded-full tracking-widest uppercase"
                    style={{ background: BRAND }}
                  >
                    🎫 Membership
                  </span>
                )}
              </div>
            </div>

            {/* Brand bar */}
            <div className="h-[4px]" style={{ background: BRAND }} />

            {/* ── Bill info ── */}
            <div className="flex justify-between px-8 py-5">
              <div>
                <p
                  className="text-[9px] font-bold uppercase tracking-[2.5px] mb-2"
                  style={{ color: BRAND }}
                >
                  Invoice To
                </p>
                <p className="text-[16px] font-black text-slate-900">
                  {b.customer.name}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 leading-6">
                  Phone: {b.customer.phone}
                </p>
              </div>
              <div className="text-right">
                <table className="text-[11px]">
                  <tbody>
                    {[
                      ["Invoice No", invoiceNo],
                      ["Invoice Date", formatDate(b.date)],
                      ["Payment Mode", paymentLabel],
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <td className="pr-4 py-0.5 text-slate-500 whitespace-nowrap">
                          {label}
                        </td>
                        <td className="py-0.5 font-semibold text-slate-800 text-right">
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="h-px bg-slate-100 mx-8" />

            {/* ── Membership banner ── */}
            {isMembership && b.membershipBalance !== undefined && (
              <div
                className="mx-8 mt-4 rounded-xl overflow-hidden"
                style={{ background: DARK }}
              >
                {/* Plan name strip */}
                {b.membershipPlanName && (
                  <div
                    className="px-6 py-2 flex items-center gap-2"
                    style={{ background: BRAND }}
                  >
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      🎫 {b.membershipPlanName}
                    </span>
                    <span className="text-[9px] text-indigo-200">— Active Plan</span>
                  </div>
                )}
                {/* Balance row */}
                <div className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[2px] mb-1.5">
                      Membership Balance Remaining
                    </p>
                    <p className="text-[22px] font-black text-white">
                      {fmt(b.membershipBalance)}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5">After this visit</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[2px] mb-1.5">
                      Used This Visit
                    </p>
                    <p className="text-[22px] font-black" style={{ color: BRAND }}>
                      {fmt(b.totalAmount)}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Deducted from membership</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Items table ── */}
            <div className="px-8 pt-4 pb-2">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr style={{ background: DARK }}>
                    {[
                      { label: "SL.", cls: "text-left w-8" },
                      { label: "Service Name", cls: "text-left" },
                      { label: "By", cls: "text-left" },
                      { label: "Price", cls: "text-right" },
                      { label: "Total", cls: "text-right" },
                    ].map((col) => (
                      <th
                        key={col.label}
                        className={`px-3 py-3 font-bold uppercase tracking-[1px] text-[10px] text-slate-400 ${col.cls}`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`border-b border-slate-50 ${idx % 2 === 1 ? "bg-slate-50/60" : "bg-white"}`}
                    >
                      <td className="px-3 py-3 text-slate-400">{idx + 1}</td>
                      <td className="px-3 py-3 font-semibold text-slate-800">
                        {item.service.name}
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {item.employee.name}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {item.isMembershipService ? (
                          <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded tracking-wide border border-indigo-200">
                            MEMBERSHIP
                          </span>
                        ) : (
                          <span className="text-slate-700">{fmt(item.price)}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-slate-900">
                        {fmt(item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Totals ── */}
            <div className="flex justify-end px-8 py-3">
              <table className="text-[11px] min-w-[210px]">
                <tbody>
                  <tr>
                    <td className="py-1 pr-12 text-slate-500">Sub Total</td>
                    <td className="py-1 text-right text-slate-700">
                      {fmt(b.totalAmount)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-12 text-slate-500">Tax</td>
                    <td className="py-1 text-right text-slate-400">₹0.00</td>
                  </tr>
                  {isMembership && (
                    <tr>
                      <td
                        className="py-1 pr-12 font-semibold"
                        style={{ color: BRAND }}
                      >
                        Membership Used
                      </td>
                      <td
                        className="py-1 text-right font-semibold"
                        style={{ color: BRAND }}
                      >
                        – {fmt(b.totalAmount)}
                      </td>
                    </tr>
                  )}
                  <tr className="border-t border-slate-200">
                    <td className="pt-3 pr-12 font-black text-[16px] text-slate-900">
                      Total
                    </td>
                    <td
                      className="pt-3 text-right font-black text-[16px]"
                      style={{ color: BRAND }}
                    >
                      {fmt(b.totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="h-px bg-slate-100 mx-8 mt-2" />

            {/* ── Payment details ── */}
            <div className="px-8 py-4">
              <p
                className="text-[9px] font-bold uppercase tracking-[2.5px] mb-2"
                style={{ color: BRAND }}
              >
                Payment Details
              </p>
              <p className="text-[11px] text-slate-600">
                Mode:{" "}
                <span className="font-semibold text-slate-800">{paymentLabel}</span>
              </p>
              {isMembership && b.membershipBalance !== undefined && (
                <p className="text-[11px] text-slate-600 mt-1">
                  Remaining Balance:{" "}
                  <span className="font-bold" style={{ color: BRAND }}>
                    {fmt(b.membershipBalance)}
                  </span>
                </p>
              )}
            </div>

            {/* ── Footer ── */}
            <div
              className="px-8 py-4 flex items-center justify-between"
              style={{ background: DARK }}
            >
              <div>
                <p className="text-white font-bold text-[13px] tracking-wide">
                  Thank You For Your Business
                </p>
                <p
                  className="font-black text-[11px] tracking-[3px] mt-0.5"
                  style={{ color: BRAND }}
                >
                  DENZO
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-[9px] mb-4">Authorised Sign</p>
                <p className="text-slate-500 text-[11px]">_______________</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
