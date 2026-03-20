"use client";

import { motion } from "framer-motion";
import { Clock, MessageSquare, Send, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageTransition } from "@/components/ui/PageTransition";
import { SMS_TEMPLATES } from "@/lib/utils";
import type { SmsCampaign } from "@/types";

interface MarketingClientProps {
  customerCount: number;
  initialCampaigns: SmsCampaign[];
}

export function MarketingClient({
  customerCount,
  initialCampaigns,
}: MarketingClientProps) {
  const [message, setMessage] = useState("");
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>(initialCampaigns);

  useEffect(() => {
    setCampaigns(initialCampaigns);
  }, [initialCampaigns]);
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState<number | null>(
    null,
  );

  function handleSelectTemplate(idx: number) {
    setSelectedTemplateIdx(idx);
    setMessage(SMS_TEMPLATES[idx].text);
  }

  async function handleSend() {
    if (!message.trim()) {
      toast.error("Please write a message");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/marketing/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      if (!res.ok) throw new Error("Failed to send");
      const json = await res.json();
      toast.success(`SMS sent to ${json.sent} customers!`);
      setCampaigns((prev) => [
        {
          id: json.campaignId ?? Date.now(),
          message: message.trim(),
          sentAt: new Date().toISOString(),
          recipientCount: json.sent,
        },
        ...prev,
      ]);
      setMessage("");
      setSelectedTemplateIdx(null);
    } catch {
      toast.error("Failed to send campaign");
    } finally {
      setSending(false);
      setShowConfirm(false);
    }
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-6 items-start">
          {/* Compose */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <MessageSquare size={16} className="text-indigo-500" />
              <h2 className="text-[15px] font-semibold text-slate-800">
                Compose Message
              </h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Quick Templates
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {SMS_TEMPLATES.map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectTemplate(idx)}
                      className={`text-left rounded-xl border-2 p-3 transition-all duration-150 hover:border-indigo-300 hover:bg-indigo-50/40 focus-visible:outline-none ${selectedTemplateIdx === idx ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-slate-50/60"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[18px] leading-none">
                          {tpl.icon}
                        </span>
                        <span
                          className={`text-[12px] font-semibold ${selectedTemplateIdx === idx ? "text-indigo-700" : "text-slate-700"}`}
                        >
                          {tpl.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {tpl.text.slice(0, 55)}...
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12px] font-medium text-slate-600">
                    Message
                  </label>
                  <span
                    className={`text-[11px] font-medium ${message.length > 160 ? "text-rose-500" : "text-slate-400"}`}
                  >
                    {message.length} chars
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setSelectedTemplateIdx(null);
                  }}
                  placeholder="Type your message or pick a template above..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
              {message.trim() && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-200 flex items-center justify-center">
                      <MessageSquare size={11} className="text-indigo-700" />
                    </div>
                    <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide">
                      Preview
                    </p>
                  </div>
                  <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {message}
                  </p>
                </motion.div>
              )}
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => {
                  if (!message.trim()) {
                    toast.error("Write a message first");
                    return;
                  }
                  setShowConfirm(true);
                }}
                disabled={!message.trim()}
              >
                <Send size={15} />
                Send to {customerCount} customer{customerCount !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-indigo-500" />
                <h2 className="text-[15px] font-semibold text-slate-800">
                  Campaign History
                </h2>
              </div>
              {campaigns.length > 0 && (
                <span className="text-[11px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  {campaigns.length} sent
                </span>
              )}
            </div>
            <div className="p-5">
              {campaigns.length === 0 ? (
                <EmptyState
                  icon={<MessageSquare size={22} />}
                  title="No campaigns yet"
                  description="Send your first SMS campaign to reach all your customers."
                />
              ) : (
                <div className="space-y-3">
                  {campaigns.map((c, idx) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: idx * 0.05 }}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 hover:border-indigo-100 hover:bg-indigo-50/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Clock size={11} />
                          <span>
                            {new Date(c.sentAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex-shrink-0">
                          <Users size={10} />
                          {c.recipientCount}
                        </div>
                      </div>
                      <p className="text-[12px] text-slate-600 leading-relaxed">
                        {c.message.length > 80
                          ? `${c.message.slice(0, 80)}...`
                          : c.message}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSend}
        title="Send SMS Campaign"
        message={`This will send your message to ${customerCount} customers. Proceed?`}
        confirmLabel="Yes, Send"
        variant="primary"
        loading={sending}
      />
    </PageTransition>
  );
}
