"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Draw = {
  id:      string;
  month:   string;
  numbers: number[];
  status:  string;
};

type Entry = {
  id:       string;
  snapshot: number[];
};

type Winner = {
  id:         string;
  matchCount: number;
  amount:     number;
  status:     string;
};

export default function ResultsPage() {
  const router = useRouter();

  const [draw, setDraw]       = useState<Draw | null>(null);
  const [entry, setEntry]     = useState<Entry | null>(null);
  const [winner, setWinner]   = useState<Winner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const getToken    = () => localStorage.getItem("token");
  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  // ── Guard ───────────────────────────────────────────
  useEffect(() => {
    if (!getToken()) router.push("/login");
  }, []);

  // ── Fetch results ───────────────────────────────────
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res  = await fetch("/api/results", { headers: authHeaders() });
        const data = await res.json();

        if (!res.ok) { setError(data.error); return; }

        setDraw(data.draw);
        setEntry(data.entry);
        setWinner(data.winner);

      } catch (err) {
        console.error(err);
        setError("Failed to load results.");
      } finally {
        setLoading(false);
      }
    };

    if (getToken()) fetchResults();
  }, []);

  // ── Match calculation ───────────────────────────────
  const matches    = draw && entry ? entry.snapshot.filter((n) => draw.numbers.includes(n)) : [];
  const matchCount = matches.length;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-indigo-950 to-slate-900 px-4 py-12">

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative max-w-lg mx-auto space-y-5 animate-fade-in">

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
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-lg">
              🏅
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Draw Results</h1>
              <p className="text-slate-400 text-sm">See how your scores matched the draw</p>
            </div>
          </div>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="rounded-2xl px-6 py-4 border bg-rose-500/10 border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 px-8 py-16 text-center text-slate-500 text-sm">
            Loading results…
          </div>
        ) : !draw ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 px-8 py-16 text-center space-y-2">
            <p className="text-slate-300 font-semibold">No draws yet</p>
            <p className="text-slate-500 text-sm">Results will appear here once a draw has been run.</p>
          </div>
        ) : (
          <>
            {/* ── DRAW NUMBERS ── */}
            <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm px-8 py-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">
                  {draw.month} Draw Numbers
                </p>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border
                  ${draw.status === "OPEN"
                    ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                    : "bg-slate-500/20 border-slate-500/30 text-slate-400"
                  }`}>
                  {draw.status}
                </span>
              </div>

              <div className="flex gap-3 flex-wrap">
                {draw.numbers.map((n, i) => {
                  const isMatch = entry && entry.snapshot.includes(n);
                  return (
                    <div
                      key={i}
                      className={`w-12 h-12 rounded-full flex items-center justify-center
                                  text-sm font-bold border transition-all duration-200
                                  ${isMatch
                                    ? "bg-emerald-500/30 border-emerald-400/50 text-emerald-300 scale-110"
                                    : "bg-indigo-500/20 border-indigo-400/30 text-indigo-300"
                                  }`}
                    >
                      {n}
                    </div>
                  );
                })}
              </div>
              {entry && (
                <p className="text-slate-500 text-xs mt-3">✅ Green numbers matched your scores</p>
              )}
            </div>

            {/* ── USER ENTRY ── */}
            {entry ? (
              <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm px-8 py-6 shadow-xl">
                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest mb-4">
                  Your Score Snapshot
                </p>
                <div className="flex gap-3 flex-wrap">
                  {entry.snapshot.map((n, i) => {
                    const isMatch = draw.numbers.includes(n);
                    return (
                      <div
                        key={i}
                        className={`w-12 h-12 rounded-full flex items-center justify-center
                                    text-sm font-bold border transition-all duration-200
                                    ${isMatch
                                      ? "bg-emerald-500/30 border-emerald-400/50 text-emerald-300 scale-110"
                                      : "bg-white/8 border-white/15 text-slate-300"
                                    }`}
                      >
                        {n}
                      </div>
                    );
                  })}
                </div>

                {/* Match count */}
                <div className="mt-5 pt-4 border-t border-white/8">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Matching numbers</span>
                    <span className={`text-2xl font-bold
                      ${matchCount >= 3 ? "text-emerald-400" : "text-slate-400"}`}>
                      {matchCount} / 5
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgb(255 255 255 / 0.08)" }}>
                    <div
                      className={`h-full rounded-full transition-all duration-500
                        ${matchCount >= 3
                          ? "bg-linear-to-r from-emerald-500 to-emerald-400"
                          : "bg-linear-to-r from-slate-600 to-slate-500"
                        }`}
                      style={{ width: `${(matchCount / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-white/5 border border-white/10 px-8 py-8 text-center space-y-2">
                <p className="text-slate-300 font-semibold">You didn't enter this draw</p>
                <p className="text-slate-500 text-sm">Enter the next draw to see your results here.</p>
                <button
                  onClick={() => router.push("/")}
                  className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500
                             text-white text-sm font-semibold transition-all duration-200"
                >
                  Go to Home
                </button>
              </div>
            )}

            {/* ── WINNER CARD ── */}
            {winner && (
              <div className={`rounded-2xl px-8 py-6 border shadow-xl
                ${winner.status === "PAID"
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : winner.status === "REJECTED"
                  ? "bg-rose-500/10 border-rose-500/30"
                  : "bg-amber-500/10 border-amber-500/30"
                }`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="text-white font-bold text-lg">You Won!</p>
                    <p className="text-slate-400 text-sm">{winner.matchCount} matching numbers</p>
                  </div>
                  <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-semibold border
                    ${winner.status === "PAID"
                      ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                      : winner.status === "REJECTED"
                      ? "bg-rose-500/20 border-rose-500/30 text-rose-300"
                      : "bg-amber-500/20 border-amber-500/30 text-amber-300"
                    }`}>
                    {winner.status}
                  </span>
                </div>
                <p className="text-3xl font-bold text-emerald-400">₹{winner.amount}</p>
                {winner.status === "PENDING" && (
                  <p className="text-slate-400 text-xs mt-2">
                    Your prize is being processed. Admin will verify and mark as paid.
                  </p>
                )}
                {winner.status === "PAID" && (
                  <p className="text-emerald-300 text-xs mt-2">🎉 Your prize has been paid out!</p>
                )}
              </div>
            )}

            {/* ── NO WIN ── */}
            {entry && !winner && draw.status === "COMPLETED" && (
              <div className="rounded-2xl bg-white/5 border border-white/10 px-8 py-6 text-center space-y-1">
                <p className="text-slate-300 font-semibold">Better luck next time!</p>
                <p className="text-slate-500 text-sm">
                  You needed at least 3 matching numbers. You matched {matchCount}.
                </p>
              </div>
            )}

            {/* ── DRAW STILL OPEN ── */}
            {draw.status === "OPEN" && entry && (
              <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 px-6 py-4">
                <div className="flex items-start gap-3">
                  <span className="text-indigo-400 text-base mt-0.5">ℹ️</span>
                  <p className="text-indigo-200 text-sm">
                    You're entered in this draw! Results will appear here once the admin runs the draw.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.45s ease-out both; }
        .bg-white\/5 { background-color: rgb(255 255 255 / 0.05); }
        .bg-white\/8 { background-color: rgb(255 255 255 / 0.08); }
        .border-white\/8 { border-color: rgb(255 255 255 / 0.08); }
      `}</style>
    </div>
  );
}