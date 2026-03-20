"use client";

import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Scissors, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginClient() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #0c1220 0%, #0f172a 50%, #1e1b4b 100%)",
      }}
    >
      {/* Background decoration */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(99,102,241,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.3) 0%, transparent 50%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" as const }}
        className="relative w-full max-w-[400px]"
      >
        {/* Card */}
        <div
          className="rounded-2xl p-8 w-full"
          style={{
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            boxShadow:
              "0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.15,
                duration: 0.4,
                type: "spring",
                stiffness: 200,
              }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            >
              <Scissors size={28} color="white" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-center"
            >
              <h1 className="text-2xl font-bold text-white tracking-wide">
                DENZO
              </h1>
              <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
                Salon Management Suite
              </p>
            </motion.div>
          </div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Username */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "#94a3b8" }}
              >
                Username
              </label>
              <div className="relative">
                <User
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#4b5563" }}
                />
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  placeholder="Enter username"
                  autoComplete="username"
                  className="w-full h-11 rounded-xl pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{
                    background: "rgba(30, 41, 59, 0.8)",
                    border: "1px solid rgba(71, 85, 105, 0.5)",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "#94a3b8" }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#4b5563" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full h-11 rounded-xl pl-10 pr-11 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{
                    background: "rgba(30, 41, 59, 0.8)",
                    border: "1px solid rgba(71, 85, 105, 0.5)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: "#4b5563" }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg px-3 py-2.5 text-xs font-medium"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#fca5a5",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !form.username || !form.password}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-all duration-200 mt-2 flex items-center justify-center gap-2"
              style={{
                background: loading
                  ? "rgba(99, 102, 241, 0.5)"
                  : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: !form.username || !form.password ? 0.5 : 1,
              }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In to DENZO"
              )}
            </button>
          </motion.form>

          {/* Footer */}
          <p
            className="text-center text-[11px] mt-6"
            style={{ color: "#374151" }}
          >
            Internal access only · DENZO Management Suite
          </p>
        </div>
      </motion.div>
    </div>
  );
}
