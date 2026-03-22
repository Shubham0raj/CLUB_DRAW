"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }

      // Store admin token separately from user token
      localStorage.setItem("adminToken", data.token);
      router.push("/admin/users");

    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">

      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-600 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-5 animate-fade-in">

        {/* ── HEADER ── */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-400/30
                          flex items-center justify-center text-3xl mx-auto mb-4">
            🛡️
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Panel</h1>
          <p className="text-slate-400 text-sm mt-2">Golf Draw System · Restricted Access</p>
        </div>

        {/* ── FORM CARD ── */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm px-8 py-8 shadow-xl space-y-5">

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-rose-300 uppercase tracking-widest">
              Admin Email
            </label>
            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-rose-500/60
                         text-white placeholder-slate-500 text-sm
                         rounded-xl px-4 py-3 outline-none transition-all duration-200"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-rose-300 uppercase tracking-widest">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-rose-500/60
                         text-white placeholder-slate-500 text-sm
                         rounded-xl px-4 py-3 outline-none transition-all duration-200"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl px-4 py-3 bg-rose-500/10 border border-rose-500/30
                            text-rose-300 text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl
                       bg-rose-600 hover:bg-rose-500 active:bg-rose-700
                       text-white font-semibold text-sm
                       shadow-lg shadow-rose-900/40
                       transition-all duration-200 hover:scale-[1.02]
                       disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 group"
          >
            <span className="flex items-center gap-2">
              <span>{loading ? "⏳" : "🔐"}</span>
              {loading ? "Signing in…" : "Sign In as Admin"}
            </span>
            {!loading && (
              <span className="text-rose-300 group-hover:translate-x-0.5 transition-transform duration-150">→</span>
            )}
          </button>
        </div>

        {/* Back to user login */}
        <p className="text-center text-slate-500 text-sm">
          Not an admin?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-slate-400 hover:text-slate-200 font-medium transition-colors duration-150"
          >
            User Login
          </button>
        </p>

      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.45s ease-out both; }
        .bg-white\/5 { background-color: rgb(255 255 255 / 0.05); }
      `}</style>
    </div>
  );
}