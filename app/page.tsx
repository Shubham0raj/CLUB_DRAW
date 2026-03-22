"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ── Lightweight JWT decoder (no library needed) ──────
function decodeToken(token: string): any {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export default function Home() {
  const router = useRouter();

  const [userId, setUserId]       = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole]   = useState("");   // ← tracks admin/user role
  const [drawId, setDrawId]       = useState("");
  const [winners, setWinners]     = useState<any[]>([]);
  const [message, setMessage]     = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [isCreating, setIsCreating]   = useState(false);
  const [isRunning, setIsRunning]     = useState(false);
  const [isEntering, setIsEntering]   = useState(false);

  // ── Helper: get token ───────────────────────────────
  const getToken = () => localStorage.getItem("token");

  // ── Helper: auth headers (always reads fresh token) ─
  const authHeaders = () => {
    const token = getToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // ── Guard + decode userId from token on mount ───────
  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    // Decode token to get userId, email and role
    const decoded = decodeToken(token);
    if (decoded) {
      setUserId(decoded.userId ?? "");
      setUserEmail(decoded.email ?? "");
      setUserRole(decoded.role ?? "");   // ← set role from token
    }
  }, []);

  // ── Fetch current draw on mount ─────────────────────
  useEffect(() => {
    const fetchCurrentDraw = async () => {
      try {
        const res = await fetch("/api/draw/current", {
          headers: authHeaders(),
        });
        const data = await res.json();

        if (res.ok && data.draw) {
          setDrawId(data.draw.id);
        }
      } catch (err) {
        console.error("Failed to fetch current draw on mount:", err);
      }
    };

    if (getToken()) fetchCurrentDraw();
  }, []);

  // ── Logout ──────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  // ── Create Draw ─────────────────────────────────────
  const createDraw = async () => {
    try {
      setIsCreating(true);
      setMessage("");

      const res = await fetch("/api/draw/create", {
        method: "POST",
        headers: authHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessageType("error");
        setMessage(data.error);
        return;
      }

      const currentRes = await fetch("/api/draw/current", {
        headers: authHeaders(),
      });
      const currentData = await currentRes.json();

      if (!currentRes.ok || !currentData.draw) {
        setMessageType("error");
        setMessage("Draw created but failed to load it. Please refresh.");
        return;
      }

      setDrawId(currentData.draw.id);
      setMessageType("success");
      setMessage("Draw created successfully!");
      setWinners([]);

    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // ── Enter Competition ───────────────────────────────
  const enterCompetition = async () => {
    try {
      setIsEntering(true);
      setMessage("");

      const currentRes = await fetch("/api/draw/current", {
        headers: authHeaders(),
      });
      const currentData = await currentRes.json();

      if (!currentRes.ok || !currentData.draw) {
        setMessageType("error");
        setMessage("No active draw found. Please create a draw first.");
        return;
      }

      const currentDrawId = currentData.draw.id;
      setDrawId(currentDrawId);

      router.push(`/enter?drawId=${currentDrawId}`);

    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsEntering(false);
    }
  };

  // ── Run Draw ────────────────────────────────────────
  const runDraw = async () => {
    try {
      setIsRunning(true);
      setMessage("");
      setWinners([]);

      const currentRes = await fetch("/api/draw/current", {
        headers: authHeaders(),
      });
      const currentData = await currentRes.json();

      if (!currentRes.ok || !currentData.draw) {
        setMessageType("error");
        setMessage("No active draw found. Please create a draw first.");
        return;
      }

      const currentDrawId = currentData.draw.id;
      setDrawId(currentDrawId);

      const res = await fetch("/api/draw/run", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ drawId: currentDrawId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessageType("error");
        setMessage(data.error);
        return;
      }

      setWinners(data.winners || []);
      setMessageType("success");
      setMessage(data.message);

    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-start justify-center px-4 py-12">

      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg space-y-6 animate-fade-in">

        {/* ── HEADER CARD ── */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm px-8 py-7 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-lg">
                🎯
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Golf Draw System</h1>
                <p className="text-slate-400 text-sm">Manage draws, scores, and competition entries</p>
              </div>
            </div>
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-rose-400 font-medium
                         transition-colors duration-150 px-3 py-1.5 rounded-lg
                         border border-white/10 hover:border-rose-500/30"
            >
              Sign out
            </button>
          </div>

          {/* ── Logged-in user pill ── */}
          {userEmail && (
            <div className="mt-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-400/30
                              flex items-center justify-center text-xs font-bold text-indigo-300">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <span className="text-slate-400 text-xs truncate">{userEmail}</span>
              {/* Admin badge */}
              {userRole === "ADMIN" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold">
                  ADMIN
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── ACTIONS CARD ── */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm px-8 py-6 shadow-xl space-y-3">
          <label className="block text-xs font-semibold text-indigo-300 uppercase tracking-widest mb-4">
            Actions
          </label>

          {/* Create Draw */}
          <button
            onClick={createDraw}
            disabled={isCreating}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl
                       bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                       text-white font-semibold text-sm shadow-lg shadow-indigo-900/40
                       transition-all duration-200 hover:scale-[1.02] hover:shadow-indigo-700/40
                       disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 group"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">🎲</span>
              {isCreating ? "Creating Draw…" : "Create Draw"}
            </span>
            <span className="text-indigo-300 group-hover:translate-x-0.5 transition-transform duration-150">→</span>
          </button>

          {/* Add Score */}
          <button
            onClick={() => router.push("/score")}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl
                       bg-white/8 hover:bg-white/12 active:bg-white/5
                       border border-white/10 hover:border-white/20
                       text-slate-200 font-semibold text-sm
                       transition-all duration-200 hover:scale-[1.02] group"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">⛳</span>
              Add Score
            </span>
            <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform duration-150">→</span>
          </button>

          {/* Manage Subscription */}
          <button
            onClick={() => router.push("/pricing")}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl
                      bg-indigo-500/20 hover:bg-indigo-500/30
                      border border-indigo-500/30 hover:border-indigo-400/50
                      text-indigo-300 font-semibold text-sm
                      transition-all duration-200 hover:scale-[1.02] group"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">💳</span>
              Manage Subscription
            </span>
            <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform duration-150">→</span>
          </button>

          {/* Choose Charity */}
          <button
            onClick={() => router.push("/charities")}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl
                      bg-emerald-600/20 hover:bg-emerald-500/30 active:bg-emerald-700/20
                      border border-emerald-500/30 hover:border-emerald-400/50
                      text-emerald-300 font-semibold text-sm
                      transition-all duration-200 hover:scale-[1.02] group"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">💚</span>
              Choose Charity
            </span>
            <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform duration-150">→</span>
          </button>

          {/* Enter Competition */}
          <button
            onClick={enterCompetition}
            disabled={isEntering}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl
                       bg-emerald-600/20 hover:bg-emerald-500/30 active:bg-emerald-700/20
                       border border-emerald-500/30 hover:border-emerald-400/50
                       text-emerald-300 font-semibold text-sm
                       transition-all duration-200 hover:scale-[1.02] group
                       disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">🏌️</span>
              {isEntering ? "Loading Draw…" : "Enter Competition"}
            </span>
            <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform duration-150">→</span>
          </button>

          {/* Run Draw */}
          <button
            onClick={runDraw}
            disabled={isRunning}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl
                       bg-rose-600/20 hover:bg-rose-500/30 active:bg-rose-700/20
                       border border-rose-500/30 hover:border-rose-400/50
                       text-rose-300 font-semibold text-sm
                       transition-all duration-200 hover:scale-[1.02] group
                       disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">🏆</span>
              {isRunning ? "Running Draw…" : "Run Draw"}
            </span>
            <span className="text-rose-400 group-hover:translate-x-0.5 transition-transform duration-150">→</span>
          </button>

          {/* Admin Panel — only visible to ADMIN role users */}
          {userRole === "ADMIN" && (
            <button
              onClick={() => router.push("/admin/users")}
              className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl
                         bg-rose-600/20 hover:bg-rose-500/30 active:bg-rose-700/20
                         border border-rose-500/30 hover:border-rose-400/50
                         text-rose-300 font-semibold text-sm
                         transition-all duration-200 hover:scale-[1.02] group"
            >
              <span className="flex items-center gap-2">
                <span className="text-base">🛡️</span>
                Admin Panel
              </span>
              <span className="text-rose-400 group-hover:translate-x-0.5 transition-transform duration-150">→</span>
            </button>
          )}
        </div>

        {/* ── INLINE MESSAGE ── */}
        {message && (
          <div className={`rounded-2xl px-6 py-4 border text-sm font-medium flex items-start gap-3 shadow-lg transition-all duration-300
            ${messageType === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : messageType === "error"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
            }`}
          >
            <span className="text-base mt-0.5">
              {messageType === "success" ? "✅" : messageType === "error" ? "⚠️" : "ℹ️"}
            </span>
            <span>{message}</span>
          </div>
        )}

        {/* ── WINNERS CARD ── */}
        {winners.length > 0 && (
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm px-8 py-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🏆</span>
              <h2 className="text-white font-bold text-lg tracking-tight">Winners</h2>
              <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {winners.length} winner{winners.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-3">
              {winners.map((w, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-4 rounded-xl
                             bg-white/5 border border-white/8 hover:border-white/15
                             transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-400/30
                                    flex items-center justify-center text-xs font-bold text-indigo-300">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm truncate max-w-[140px]">
                        {w.userId}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {w.matchCount ?? w.match} match{(w.matchCount ?? w.match) !== 1 ? "es" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-bold text-base">₹{w.amount}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25 font-medium">
                      {w.status ?? "PENDING"}
                    </span>
                  </div>
                </div>
              ))}
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
        .bg-white\/8  { background-color: rgb(255 255 255 / 0.08); }
        .bg-white\/12 { background-color: rgb(255 255 255 / 0.12); }
        .bg-white\/5  { background-color: rgb(255 255 255 / 0.05); }
        .border-white\/8  { border-color: rgb(255 255 255 / 0.08); }
      `}</style>
    </div>
  );
}