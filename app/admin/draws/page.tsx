"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Draw = {
  id:      string;
  month:   string;
  numbers: number[];
  status:  string;
  _count:  { entries: number };
};

export default function AdminDrawsPage() {
  const router = useRouter();

  const [draws, setDraws]         = useState<Draw[]>([]);
  const [loading, setLoading]     = useState(true);
  const [message, setMessage]     = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [runningId, setRunningId]     = useState<string | null>(null);

  const getToken    = () => localStorage.getItem("adminToken");
  const adminHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  // ── Guard ───────────────────────────────────────────
  useEffect(() => {
    if (!getToken()) router.push("/admin/login");
  }, []);

  // ── Fetch draws ─────────────────────────────────────
  const fetchDraws = async () => {
    try {
      setLoading(true);
      const res  = await fetch("/api/admin/draws", { headers: adminHeaders() });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) { router.push("/admin/login"); return; }
        setMessageType("error");
        setMessage(data.error);
        return;
      }

      setDraws(data.draws);
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Failed to load draws.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getToken()) fetchDraws();
  }, []);

  // ── Run draw ────────────────────────────────────────
  const handleRunDraw = async (drawId: string) => {
    if (!confirm("Run this draw now? This will calculate winners and mark it COMPLETED.")) return;

    try {
      setRunningId(drawId);
      setMessage("");

      const res  = await fetch("/api/draw/run", {
        method:  "POST",
        headers: adminHeaders(),
        body:    JSON.stringify({ drawId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessageType("error");
        setMessage(data.error);
        return;
      }

      setMessageType("success");
      setMessage(`${data.message}`);
      fetchDraws(); // refresh list

    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Something went wrong.");
    } finally {
      setRunningId(null);
    }
  };

  // ── Delete draw ─────────────────────────────────────
  const handleDelete = async (drawId: string) => {
    if (!confirm("Delete this draw and all its entries and winners?")) return;

    try {
      setDeletingId(drawId);
      setMessage("");

      const res  = await fetch("/api/admin/draws", {
        method:  "DELETE",
        headers: adminHeaders(),
        body:    JSON.stringify({ drawId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessageType("error");
        setMessage(data.error);
        return;
      }

      setMessageType("success");
      setMessage("Draw deleted successfully.");
      setDraws((prev) => prev.filter((d) => d.id !== drawId));

    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Something went wrong.");
    } finally {
      setDeletingId(null);
    }
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
                  ${tab === "Draws"
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

        {/* ── DRAWS TABLE ── */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl overflow-hidden">

          <div className="px-8 py-5 border-b border-white/8 flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">Draws</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {loading ? "Loading…" : `${draws.length} draw${draws.length !== 1 ? "s" : ""} total`}
              </p>
            </div>
            <button
              onClick={fetchDraws}
              className="text-xs text-slate-400 hover:text-slate-200 font-medium px-3 py-1.5
                         rounded-lg border border-white/10 hover:border-white/20 transition-all duration-150"
            >
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <div className="px-8 py-12 text-center text-slate-500 text-sm">Loading draws…</div>
          ) : draws.length === 0 ? (
            <div className="px-8 py-12 text-center text-slate-500 text-sm">No draws found.</div>
          ) : (
            <div className="divide-y divide-white/5">

              {/* Column labels */}
              <div className="px-8 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                <span className="col-span-2">Month</span>
                <span className="col-span-4">Numbers</span>
                <span className="col-span-2 text-center">Status</span>
                <span className="col-span-2 text-center">Entries</span>
                <span className="col-span-2 text-right">Actions</span>
              </div>

              {draws.map((draw) => (
                <div
                  key={draw.id}
                  className="px-8 py-4 grid grid-cols-12 gap-4 items-center hover:bg-white/3 transition-colors duration-150"
                >
                  {/* Month */}
                  <div className="col-span-2">
                    <p className="text-white font-semibold text-sm">{draw.month}</p>
                    <p className="text-slate-500 text-xs mt-0.5 font-mono truncate">{draw.id.slice(0, 8)}…</p>
                  </div>

                  {/* Numbers */}
                  <div className="col-span-4 flex gap-1.5 flex-wrap">
                    {draw.numbers.map((n, i) => (
                      <span
                        key={i}
                        className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-400/30
                                   flex items-center justify-center text-xs font-bold text-indigo-300"
                      >
                        {n}
                      </span>
                    ))}
                  </div>

                  {/* Status */}
                  <div className="col-span-2 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold
                      ${draw.status === "OPEN"
                        ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                        : "bg-slate-500/20 border border-slate-500/30 text-slate-400"
                      }`}>
                      {draw.status}
                    </span>
                  </div>

                  {/* Entry count */}
                  <div className="col-span-2 text-center">
                    <span className="text-white font-semibold text-sm">{draw._count.entries}</span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    {/* Run draw — only for OPEN draws */}
                    {draw.status === "OPEN" && (
                      <button
                        onClick={() => handleRunDraw(draw.id)}
                        disabled={runningId === draw.id}
                        className="text-xs px-2.5 py-1.5 rounded-lg
                                   bg-emerald-500/15 hover:bg-emerald-500/25
                                   border border-emerald-500/25 hover:border-emerald-500/40
                                   text-emerald-300 font-medium
                                   transition-all duration-150
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {runningId === draw.id ? "…" : "▶ Run"}
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(draw.id)}
                      disabled={deletingId === draw.id}
                      className="text-xs px-2.5 py-1.5 rounded-lg
                                 bg-rose-500/15 hover:bg-rose-500/25
                                 border border-rose-500/25 hover:border-rose-500/40
                                 text-rose-300 font-medium
                                 transition-all duration-150
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === draw.id ? "…" : "Delete"}
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