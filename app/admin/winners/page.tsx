"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Winner = {
  id:     string;
  userId: string;
  drawId: string;
  match:  number;
  amount: number;
  status: string;
  user:   { email: string } | null;   // ← nullable
  draw:   { month: string; numbers: number[] } | null;  // ← nullable
};

export default function AdminWinnersPage() {
  const router = useRouter();

  const [winners, setWinners]     = useState<Winner[]>([]);
  const [loading, setLoading]     = useState(true);
  const [message, setMessage]     = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [updatingId, setUpdatingId]   = useState<string | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const getToken     = () => localStorage.getItem("adminToken");
  const adminHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  // ── Guard ───────────────────────────────────────────
  useEffect(() => {
    if (!getToken()) router.push("/admin/login");
  }, []);

  // ── Fetch winners ───────────────────────────────────
  const fetchWinners = async () => {
    try {
      setLoading(true);
      const res  = await fetch("/api/admin/winners", { headers: adminHeaders() });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) { router.push("/admin/login"); return; }
        setMessageType("error");
        setMessage(data.error);
        return;
      }

      setWinners(data.winners);
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Failed to load winners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getToken()) fetchWinners();
  }, []);

  // ── Update status ───────────────────────────────────
  const handleStatusUpdate = async (winnerId: string, status: string) => {
    try {
      setUpdatingId(winnerId);
      setMessage("");

      const res  = await fetch("/api/admin/winners", {
        method:  "PATCH",
        headers: adminHeaders(),
        body:    JSON.stringify({ winnerId, status }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessageType("error");
        setMessage(data.error);
        return;
      }

      setMessageType("success");
      setMessage(data.message);
      setWinners((prev) =>
        prev.map((w) => (w.id === winnerId ? { ...w, status } : w))
      );

    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Something went wrong.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Delete winner ───────────────────────────────────
  const handleDelete = async (winnerId: string) => {
    if (!confirm("Delete this winner record?")) return;

    try {
      setDeletingId(winnerId);
      setMessage("");

      const res  = await fetch("/api/admin/winners", {
        method:  "DELETE",
        headers: adminHeaders(),
        body:    JSON.stringify({ winnerId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessageType("error");
        setMessage(data.error);
        return;
      }

      setMessageType("success");
      setMessage("Winner deleted.");
      setWinners((prev) => prev.filter((w) => w.id !== winnerId));

    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Filter ──────────────────────────────────────────
  const filtered = filterStatus === "ALL"
    ? winners
    : winners.filter((w) => w.status === filterStatus);

  // ── Status style helper ─────────────────────────────
  const statusStyle = (status: string) => {
    if (status === "PAID")     return "bg-emerald-500/20 border-emerald-500/30 text-emerald-300";
    if (status === "REJECTED") return "bg-rose-500/20 border-rose-500/30 text-rose-300";
    return "bg-amber-500/20 border-amber-500/30 text-amber-300";
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-12">

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-600 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto space-y-6 animate-fade-in">

        {/* ── HEADER ── */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm px-8 py-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-lg">
                🛡️
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Admin Panel</h1>
                <p className="text-slate-400 text-sm">Golf Draw System</p>
              </div>
            </div>
            <button
              onClick={() => { localStorage.removeItem("adminToken"); router.push("/admin/login"); }}
              className="text-xs text-slate-400 hover:text-rose-400 font-medium
                         transition-colors duration-150 px-3 py-1.5 rounded-lg
                         border border-white/10 hover:border-rose-500/30"
            >
              Sign out
            </button>
          </div>

          {/* ── NAV TABS ── */}
          <div className="flex gap-2 mt-5">
            {["Users", "Draws", "Winners", "Charities", "Analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => router.push(`/admin/${tab.toLowerCase()}`)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150
                  ${tab === "Winners"
                    ? "bg-rose-500/20 border border-rose-500/30 text-rose-300"
                    : "text-slate-400 hover:text-slate-200 border border-transparent hover:border-white/10"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── MESSAGE ── */}
        {message && (
          <div className={`rounded-2xl px-6 py-4 border text-sm font-medium flex items-center gap-3 shadow-lg
            ${messageType === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            <span>{messageType === "success" ? "✅" : "⚠️"}</span>
            <span>{message}</span>
          </div>
        )}

        {/* ── WINNERS TABLE ── */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl overflow-hidden">

          <div className="px-8 py-5 border-b border-white/8 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-white font-bold text-lg">Winners</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {loading ? "Loading…" : `${filtered.length} record${filtered.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-2">
              {["ALL", "PENDING", "PAID", "REJECTED"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all duration-150
                    ${filterStatus === f
                      ? "bg-white/15 border border-white/20 text-white"
                      : "text-slate-400 hover:text-slate-200 border border-transparent hover:border-white/10"
                    }`}
                >
                  {f}
                </button>
              ))}
              <button
                onClick={fetchWinners}
                className="text-xs text-slate-400 hover:text-slate-200 font-medium px-3 py-1.5
                           rounded-lg border border-white/10 hover:border-white/20 transition-all duration-150 ml-1"
              >
                🔄
              </button>
            </div>
          </div>

          {loading ? (
            <div className="px-8 py-12 text-center text-slate-500 text-sm">Loading winners…</div>
          ) : filtered.length === 0 ? (
            <div className="px-8 py-12 text-center text-slate-500 text-sm">No winners found.</div>
          ) : (
            <div className="divide-y divide-white/5">

              {/* Column labels */}
              <div className="px-8 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                <span className="col-span-3">Player</span>
                <span className="col-span-2">Draw</span>
                <span className="col-span-2 text-center">Matches</span>
                <span className="col-span-2 text-center">Amount</span>
                <span className="col-span-1 text-center">Status</span>
                <span className="col-span-2 text-right">Actions</span>
              </div>

              {filtered.map((w) => (
                <div
                  key={w.id}
                  className="px-8 py-4 grid grid-cols-12 gap-4 items-center hover:bg-white/3 transition-colors duration-150"
                >
                  {/* Player — safe access with ?. */}
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-400/30
                                    flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                      {w.user?.email?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                    <span className="text-white text-sm font-medium truncate">
                      {w.user?.email ?? "Unknown"}
                    </span>
                  </div>

                  {/* Draw month — safe access with ?. */}
                  <div className="col-span-2">
                    <p className="text-white text-sm font-medium">
                      {w.draw?.month ?? "Unknown"}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {(w.draw?.numbers ?? []).map((n, i) => (
                        <span key={i} className="text-xs text-slate-400">{n}{i < 4 ? "," : ""}</span>
                      ))}
                    </div>
                  </div>

                  {/* Match count */}
                  <div className="col-span-2 text-center">
                    <span className="text-white font-bold text-sm">{w.match}</span>
                    <span className="text-slate-500 text-xs"> / 5</span>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 text-center">
                    <span className="text-emerald-400 font-bold text-sm">₹{w.amount}</span>
                  </div>

                  {/* Status badge */}
                  <div className="col-span-1 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold border ${statusStyle(w.status)}`}>
                      {w.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    {/* Mark Paid */}
                    {w.status !== "PAID" && (
                      <button
                        onClick={() => handleStatusUpdate(w.id, "PAID")}
                        disabled={updatingId === w.id}
                        className="text-xs px-2 py-1.5 rounded-lg
                                   bg-emerald-500/15 hover:bg-emerald-500/25
                                   border border-emerald-500/25 hover:border-emerald-500/40
                                   text-emerald-300 font-medium
                                   transition-all duration-150
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingId === w.id ? "…" : "Paid"}
                      </button>
                    )}

                    {/* Reject */}
                    {w.status === "PENDING" && (
                      <button
                        onClick={() => handleStatusUpdate(w.id, "REJECTED")}
                        disabled={updatingId === w.id}
                        className="text-xs px-2 py-1.5 rounded-lg
                                   bg-amber-500/15 hover:bg-amber-500/25
                                   border border-amber-500/25 hover:border-amber-500/40
                                   text-amber-300 font-medium
                                   transition-all duration-150
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reject
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(w.id)}
                      disabled={deletingId === w.id}
                      className="text-xs px-2 py-1.5 rounded-lg
                                 bg-rose-500/15 hover:bg-rose-500/25
                                 border border-rose-500/25 hover:border-rose-500/40
                                 text-rose-300 font-medium
                                 transition-all duration-150
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === w.id ? "…" : "Del"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.45s ease-out both; }
        .bg-white\/5  { background-color: rgb(255 255 255 / 0.05); }
        .bg-white\/3  { background-color: rgb(255 255 255 / 0.03); }
        .border-white\/8 { border-color: rgb(255 255 255 / 0.08); }
      `}</style>
    </div>
  );
}