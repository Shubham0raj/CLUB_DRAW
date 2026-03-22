"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

// ── All logic moved into EnterContent ─────────────────
function EnterContent() {
  const params = useSearchParams();
  const router = useRouter();

  const drawId = params.get("drawId");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");

  const getToken = () => localStorage.getItem("token");

  const handleEnter = async () => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    if (!drawId) {
      setMessageType("error");
      setMessage("No active draw found. Please create a draw first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch("/api/entry/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ drawId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessageType("error");
        setMessage(data.error);
        return;
      }

      setMessageType("success");
      setMessage("Successfully entered the draw!");

      setTimeout(() => router.push("/"), 1200);
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-start justify-center px-4 py-12">

      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg space-y-5 animate-fade-in">

        {/* ── HEADER ── */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm px-8 py-7 shadow-xl">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm font-medium
                       transition-colors duration-150 mb-5 group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform duration-150">←</span>
            Back to Home
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-lg">
              🏌️
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Enter Competition</h1>
              <p className="text-slate-400 text-sm">Confirm your draw entry</p>
            </div>
          </div>
        </div>

        {/* ── ENTRY DETAILS CARD ── */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm px-8 py-6 shadow-xl space-y-4">
          <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">
            Entry Details
          </p>

          <div className="flex items-center justify-between py-3">
            <span className="text-slate-400 text-sm font-medium">Draw ID</span>
            <span className="text-white font-mono text-xs bg-white/8 border border-white/10 px-3 py-1.5 rounded-lg truncate max-w-50">
              {drawId ?? <span className="text-slate-500 italic font-sans">No draw active</span>}
            </span>
          </div>
        </div>

        {/* ── REQUIREMENT NOTICE ── */}
        <div className="rounded-2xl bg-indigo-500/8 border border-indigo-500/20 backdrop-blur-sm px-6 py-4 shadow-xl">
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 text-base mt-0.5">ℹ️</span>
            <p className="text-indigo-200 text-sm leading-relaxed">
              You must have at least{" "}
              <span className="font-semibold text-white">5 recorded scores</span>{" "}
              before entering the draw. Your latest scores will be used as your entry snapshot.
            </p>
          </div>
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div className="space-y-3">
          <button
            onClick={handleEnter}
            disabled={loading || messageType === "success" && !!message}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl
                       bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700
                       text-white font-semibold text-sm
                       shadow-lg shadow-emerald-900/40
                       transition-all duration-200 hover:scale-[1.02] hover:shadow-emerald-700/40
                       disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 group"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">{loading ? "⏳" : "✅"}</span>
              {loading ? "Entering Draw…" : "Confirm Entry"}
            </span>
            {!loading && (
              <span className="text-emerald-200 group-hover:translate-x-0.5 transition-transform duration-150">→</span>
            )}
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl
                       bg-white/5 hover:bg-white/10 active:bg-white/3
                       border border-white/10 hover:border-white/20
                       text-slate-300 font-semibold text-sm
                       transition-all duration-200 hover:scale-[1.02] group"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">🏠</span>
              Back to Home
            </span>
            <span className="text-slate-500 group-hover:translate-x-0.5 transition-transform duration-150">→</span>
          </button>
        </div>

        {/* ── INLINE MESSAGE ── */}
        {message && (
          <div className={`rounded-2xl px-6 py-4 border text-sm font-medium flex items-start gap-3 shadow-lg transition-all duration-300
            ${messageType === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            <span className="text-base mt-0.5">{messageType === "success" ? "✅" : "⚠️"}</span>
            <div>
              <span>{message}</span>
              {messageType === "success" && (
                <p className="text-xs mt-1 opacity-70">Redirecting you to home…</p>
              )}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.45s ease-out both; }
        .bg-white\/5   { background-color: rgb(255 255 255 / 0.05); }
        .bg-white\/8   { background-color: rgb(255 255 255 / 0.08); }
        .bg-white\/3   { background-color: rgb(255 255 255 / 0.03); }
        .border-white\/8 { border-color: rgb(255 255 255 / 0.08); }
        .bg-indigo-500\/8 { background-color: rgb(99 102 241 / 0.08); }
      `}</style>
    </div>
  );
}

// ── Suspense wrapper — THIS is the default export ─────
export default function EnterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    }>
      <EnterContent />
    </Suspense>
  );
}