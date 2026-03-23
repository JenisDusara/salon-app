"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Scissors,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type View = "login" | "forgot" | "success";

const inputClass =
  "w-full rounded-xl pl-9 pr-4 text-[13px] text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all duration-150";

const inputStyle = {
  background: "rgba(30, 41, 59, 0.9)",
  border: "1px solid rgba(71, 85, 105, 0.45)",
};

const slideVariants = {
  initial: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  animate: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -24 }),
};

export function LoginClient() {
  const router = useRouter();
  const [view, setView] = useState<View>("login");
  const [slideDir, setSlideDir] = useState(1);

  // Login state
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset state
  const [resetForm, setResetForm] = useState({
    username: "",
    resetCode: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  function goTo(v: View, dir = 1) {
    setSlideDir(dir);
    setView(v);
    setError("");
    setResetError("");
  }

  async function handleLogin(e: React.FormEvent) {
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

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");
    if (resetForm.newPassword.length < 6) {
      setResetError("Password must be at least 6 characters");
      return;
    }
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }
    setResetLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: resetForm.username,
          resetCode: resetForm.resetCode,
          newPassword: resetForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error ?? "Reset failed");
        return;
      }
      goTo("success", 1);
    } catch {
      setResetError("Network error. Please try again.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #080e1c 0%, #0f172a 45%, #1a1640 100%)",
      }}
    >
      {/* Ambient orbs */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.08, 0.16, 0.08] }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full max-w-[400px]"
      >
        <div
          className="rounded-2xl w-full overflow-hidden"
          style={{
            background: "rgba(13, 20, 36, 0.88)",
            backdropFilter: "blur(28px)",
            border: "1px solid rgba(99, 102, 241, 0.18)",
            boxShadow:
              "0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Top accent line */}
          <div
            className="h-[2px] w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, #6366f1, #8b5cf6, transparent)",
            }}
          />

          <div className="p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-7">
              <motion.div
                initial={{ scale: 0.4, opacity: 0, rotate: -15 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{
                  delay: 0.15,
                  duration: 0.5,
                  type: "spring",
                  stiffness: 180,
                }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
                }}
              >
                <Scissors size={24} color="white" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-center"
              >
                <h1
                  className="text-[22px] font-bold text-white tracking-[0.2em]"
                  style={{ textShadow: "0 0 30px rgba(99,102,241,0.4)" }}
                >
                  DENZO
                </h1>
                <p
                  className="text-[10px] mt-0.5 font-semibold tracking-[0.15em] uppercase"
                  style={{ color: "#475569" }}
                >
                  Salon Management Suite
                </p>
              </motion.div>
            </div>

            {/* Animated views */}
            <div className="overflow-hidden">
              <AnimatePresence mode="wait" custom={slideDir}>
                {/* ── LOGIN ── */}
                {view === "login" && (
                  <motion.div
                    key="login"
                    custom={slideDir}
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                  >
                    <form onSubmit={handleLogin} className="space-y-4">
                      {/* Username */}
                      <div>
                        <label
                          className="block text-[10px] font-bold mb-1.5 tracking-widest uppercase"
                          style={{ color: "#475569" }}
                        >
                          Username
                        </label>
                        <div className="relative">
                          <User
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2"
                            style={{ color: "#475569" }}
                          />
                          <input
                            suppressHydrationWarning
                            type="text"
                            value={form.username}
                            onChange={(e) =>
                              setForm({ ...form, username: e.target.value })
                            }
                            placeholder="Enter your username"
                            autoComplete="username"
                            className={`${inputClass} h-11`}
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label
                          className="block text-[10px] font-bold mb-1.5 tracking-widest uppercase"
                          style={{ color: "#475569" }}
                        >
                          Password
                        </label>
                        <div className="relative">
                          <Lock
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2"
                            style={{ color: "#475569" }}
                          />
                          <input
                            suppressHydrationWarning
                            type={showPassword ? "text" : "password"}
                            value={form.password}
                            onChange={(e) =>
                              setForm({ ...form, password: e.target.value })
                            }
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            className={`${inputClass} h-11 pr-11`}
                            style={inputStyle}
                          />
                          <button
                            suppressHydrationWarning
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors hover:text-slate-300"
                            style={{ color: "#475569" }}
                          >
                            {showPassword ? (
                              <EyeOff size={14} />
                            ) : (
                              <Eye size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Forgot link */}
                      <div className="flex justify-end -mt-1">
                        <button
                          suppressHydrationWarning
                          type="button"
                          onClick={() => goTo("forgot", 1)}
                          className="text-[11px] font-semibold transition-colors hover:text-indigo-300"
                          style={{ color: "#6366f1" }}
                        >
                          Forgot password?
                        </button>
                      </div>

                      {/* Error */}
                      <AnimatePresence>
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="rounded-xl px-3 py-2.5 text-[12px] font-medium"
                            style={{
                              background: "rgba(239,68,68,0.08)",
                              color: "#fca5a5",
                              border: "1px solid rgba(239,68,68,0.2)",
                            }}
                          >
                            {error}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Submit */}
                      <button
                        suppressHydrationWarning
                        type="submit"
                        disabled={loading || !form.username || !form.password}
                        className="w-full h-11 rounded-xl text-[13px] font-bold text-white transition-all duration-200 flex items-center justify-center gap-2"
                        style={{
                          background:
                            loading || !form.username || !form.password
                              ? "rgba(99,102,241,0.35)"
                              : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                          boxShadow:
                            loading || !form.username || !form.password
                              ? "none"
                              : "0 4px 20px rgba(99,102,241,0.35)",
                          cursor:
                            loading || !form.username || !form.password
                              ? "not-allowed"
                              : "pointer",
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
                    </form>
                  </motion.div>
                )}

                {/* ── FORGOT PASSWORD ── */}
                {view === "forgot" && (
                  <motion.div
                    key="forgot"
                    custom={slideDir}
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                  >
                    {/* Back + title */}
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        suppressHydrationWarning
                        type="button"
                        onClick={() => goTo("login", -1)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
                        style={{ color: "#64748b" }}
                      >
                        <ArrowLeft size={15} />
                      </button>
                      <h2 className="text-[14px] font-bold text-white">
                        Reset Password
                      </h2>
                    </div>

                    <p
                      className="text-[12px] leading-relaxed mb-4 rounded-xl px-3 py-2.5"
                      style={{
                        color: "#64748b",
                        background: "rgba(99,102,241,0.06)",
                        border: "1px solid rgba(99,102,241,0.12)",
                      }}
                    >
                      Ask your system admin for the{" "}
                      <span style={{ color: "#818cf8" }}>reset code</span>, then
                      fill in the fields below.
                    </p>

                    <form onSubmit={handleReset} className="space-y-3">
                      {/* Username */}
                      <div>
                        <label
                          className="block text-[10px] font-bold mb-1.5 tracking-widest uppercase"
                          style={{ color: "#475569" }}
                        >
                          Username
                        </label>
                        <div className="relative">
                          <User
                            size={13}
                            className="absolute left-3 top-1/2 -translate-y-1/2"
                            style={{ color: "#475569" }}
                          />
                          <input
                            suppressHydrationWarning
                            type="text"
                            value={resetForm.username}
                            onChange={(e) =>
                              setResetForm({
                                ...resetForm,
                                username: e.target.value,
                              })
                            }
                            placeholder="Your username"
                            className={`${inputClass} h-10`}
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      {/* Reset Code */}
                      <div>
                        <label
                          className="block text-[10px] font-bold mb-1.5 tracking-widest uppercase"
                          style={{ color: "#475569" }}
                        >
                          Reset Code
                        </label>
                        <div className="relative">
                          <KeyRound
                            size={13}
                            className="absolute left-3 top-1/2 -translate-y-1/2"
                            style={{ color: "#475569" }}
                          />
                          <input
                            suppressHydrationWarning
                            type="text"
                            value={resetForm.resetCode}
                            onChange={(e) =>
                              setResetForm({
                                ...resetForm,
                                resetCode: e.target.value,
                              })
                            }
                            placeholder="Enter reset code"
                            className={`${inputClass} h-10`}
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      {/* New Password */}
                      <div>
                        <label
                          className="block text-[10px] font-bold mb-1.5 tracking-widest uppercase"
                          style={{ color: "#475569" }}
                        >
                          New Password
                        </label>
                        <div className="relative">
                          <Lock
                            size={13}
                            className="absolute left-3 top-1/2 -translate-y-1/2"
                            style={{ color: "#475569" }}
                          />
                          <input
                            suppressHydrationWarning
                            type={showNewPassword ? "text" : "password"}
                            value={resetForm.newPassword}
                            onChange={(e) =>
                              setResetForm({
                                ...resetForm,
                                newPassword: e.target.value,
                              })
                            }
                            placeholder="Min. 6 characters"
                            className={`${inputClass} h-10 pr-11`}
                            style={inputStyle}
                          />
                          <button
                            suppressHydrationWarning
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                            style={{ color: "#475569" }}
                          >
                            {showNewPassword ? (
                              <EyeOff size={13} />
                            ) : (
                              <Eye size={13} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label
                          className="block text-[10px] font-bold mb-1.5 tracking-widest uppercase"
                          style={{ color: "#475569" }}
                        >
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock
                            size={13}
                            className="absolute left-3 top-1/2 -translate-y-1/2"
                            style={{ color: "#475569" }}
                          />
                          <input
                            suppressHydrationWarning
                            type="password"
                            value={resetForm.confirmPassword}
                            onChange={(e) =>
                              setResetForm({
                                ...resetForm,
                                confirmPassword: e.target.value,
                              })
                            }
                            placeholder="Re-enter new password"
                            className={`${inputClass} h-10`}
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      {/* Error */}
                      <AnimatePresence>
                        {resetError && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="rounded-xl px-3 py-2.5 text-[12px] font-medium"
                            style={{
                              background: "rgba(239,68,68,0.08)",
                              color: "#fca5a5",
                              border: "1px solid rgba(239,68,68,0.2)",
                            }}
                          >
                            {resetError}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button
                        suppressHydrationWarning
                        type="submit"
                        disabled={
                          resetLoading ||
                          !resetForm.username ||
                          !resetForm.resetCode ||
                          !resetForm.newPassword ||
                          !resetForm.confirmPassword
                        }
                        className="w-full h-11 rounded-xl text-[13px] font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 mt-1"
                        style={{
                          background:
                            resetLoading ||
                            !resetForm.username ||
                            !resetForm.resetCode ||
                            !resetForm.newPassword ||
                            !resetForm.confirmPassword
                              ? "rgba(99,102,241,0.35)"
                              : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                          boxShadow:
                            resetLoading ||
                            !resetForm.username ||
                            !resetForm.resetCode ||
                            !resetForm.newPassword ||
                            !resetForm.confirmPassword
                              ? "none"
                              : "0 4px 20px rgba(99,102,241,0.35)",
                          cursor: resetLoading ? "not-allowed" : "pointer",
                        }}
                      >
                        {resetLoading ? (
                          <>
                            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            Resetting...
                          </>
                        ) : (
                          "Reset Password"
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* ── SUCCESS ── */}
                {view === "success" && (
                  <motion.div
                    key="success"
                    custom={slideDir}
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="text-center py-2"
                  >
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 220,
                        delay: 0.1,
                      }}
                      className="flex justify-center mb-4"
                    >
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{
                          background: "rgba(16,185,129,0.12)",
                          border: "1px solid rgba(16,185,129,0.25)",
                        }}
                      >
                        <CheckCircle2 size={32} style={{ color: "#10b981" }} />
                      </div>
                    </motion.div>
                    <h2 className="text-[17px] font-bold text-white mb-1.5">
                      Password Updated!
                    </h2>
                    <p
                      className="text-[12px] mb-6 leading-relaxed"
                      style={{ color: "#64748b" }}
                    >
                      Your password has been reset successfully.
                      <br />
                      You can now sign in with your new password.
                    </p>
                    <button
                      suppressHydrationWarning
                      type="button"
                      onClick={() => {
                        setResetForm({
                          username: "",
                          resetCode: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                        goTo("login", -1);
                      }}
                      className="w-full h-11 rounded-xl text-[13px] font-bold text-white"
                      style={{
                        background:
                          "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
                      }}
                    >
                      Back to Sign In
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {view === "login" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-[10px] mt-6 tracking-widest uppercase"
                style={{ color: "#1e2d42" }}
              >
                Internal Access Only
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
