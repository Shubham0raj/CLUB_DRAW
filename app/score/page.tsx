"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ScorePage() {
  const router = useRouter();

  // ── userId removed — comes from token now ──────────
  // useSearchParams no longer needed

  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const getToken = () => localStorage.getItem("token");

  const handleAddScore = async () => {
    const token = getToken();

    // ── Redirect if no token ────────────────────────
    if (!token) {
      router.push("/login");
      return;
    }

    const num = Number(value);

    if (!value || isNaN(num) || num < 1 || num > 45) {
      setMessageType("error");
      setMessage("Enter a valid number between 1 and 45.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch("/api/scores/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,  // ── token replaces userId
        },
        body: JSON.stringify({
          value: num,                         // ── userId removed from body
          date: new Date().toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessageType("error");
        setMessage(data.error);
        return;
      }

      setMessageType("success");
      setMessage("Score added successfully!");
      setValue(""); // reset input
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const numVal = Number(value);
  const isValid = value !== "" && !isNaN(numVal) && numVal >= 1 && numVal <= 45;
  const progress = isValid ? ((numVal - 1) / 44) * 100 : 0;

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
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-lg">
              ⛳
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Add Score</h1>
              <p className="text-slate-400 text-sm">Record a new golf score entry</p>
            </div>
          </div>
        </div>

        {/* ── INPUT CARD ── */}
        {/* Player card removed — userId no longer available from URL */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm px-8 py-6 shadow-xl space-y-5">
          <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">
            Score Entry
          </p>

          {/* Number input */}
          <div className="relative">
            <input
              type="number"
              placeholder="Enter score (1–45)"
              value={value}
              min={1}
              max={45}
              onChange={(e) => {
                setValue(e.target.value);
                setMessage("");
              }}
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-500/60
                         text-white placeholder-slate-500 text-2xl font-bold text-center
                         rounded-xl px-5 py-5 outline-none
                         transition-all duration-200
                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {/* Valid indicator */}
            {isValid && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6
                              rounded-full bg-emerald-500/20 border border-emerald-400/40
                              flex items-center justify-center text-emerald-400 text-xs">
                ✓
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>1</span>
              <span className={`transition-colors duration-200 ${isValid ? "text-indigo-300" : ""}`}>
                {isValid ? numVal : "—"}
              </span>
              <span>45</span>
            </div>
            <div className="h-1.5 w-full bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-indigo-500 to-blue-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            onClick={handleAddScore}
            disabled={loading}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl
                       bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                       text-white font-semibold text-sm
                       shadow-lg shadow-indigo-900/40
                       transition-all duration-200 hover:scale-[1.02] hover:shadow-indigo-700/40
                       disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 group"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">{loading ? "⏳" : "➕"}</span>
              {loading ? "Adding Score…" : "Add Score"}
            </span>
            {!loading && (
              <span className="text-indigo-300 group-hover:translate-x-0.5 transition-transform duration-150">→</span>
            )}
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
            <span>{message}</span>
          </div>
        )}

      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.45s ease-out both; }
        .bg-white\/5  { background-color: rgb(255 255 255 / 0.05); }
        .bg-white\/8  { background-color: rgb(255 255 255 / 0.08); }
        .border-white\/8  { border-color: rgb(255 255 255 / 0.08); }
      `}</style>
    </div>
  );
}