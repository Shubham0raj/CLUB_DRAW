"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Stats = {
  totalUsers:       number;
  totalDraws:       number;
  totalEntries:     number;
  totalWinners:     number;
  openDraws:        number;
  completedDraws:   number;
  totalPrizePool:   number;
  totalPaidOut:     number;
  pendingWinners:   number;
  paidWinners:      number;
  rejectedWinners:  number;
};

type MatchBreakdown = {
  matchCount: number;
  _count:     { matchCount: number };
};

type RecentWinner = {
  id:         string;
  amount:     number;
  status:     string;
  matchCount: number;
  user:       { email: string };
  draw:       { month: string };
};

export default function AdminAnalyticsPage() {
  const router = useRouter();

  const [stats, setStats]                 = useState<Stats | null>(null);
  const [matchBreakdown, setMatchBreakdown] = useState<MatchBreakdown[]>([]);
  const [recentWinners, setRecentWinners]   = useState<RecentWinner[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState("");

  const getToken     = () => localStorage.getItem("adminToken");
  const adminHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  // ── Guard ───────────────────────────────────────────
  useEffect(() => {
    if (!getToken()) router.push("/admin/login");
  }, []);

  // ── Fetch analytics ─────────────────────────────────
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const res  = await fetch("/api/admin/analytics", { headers: adminHeaders() });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) { router.push("/admin/login"); return; }
        setError(data.error);
        return;
      }

      setStats(data.stats);
      setMatchBreakdown(data.matchBreakdown);
      setRecentWinners(data.recentWinners);

    } catch (err) {
      console.error(err);
      setError("Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getToken()) fetchAnalytics();
  }, []);

  // ── Stat card component ─────────────────────────────
  const StatCard = ({
    label, value, sub, color
  }: {
    label: string;
    value: string | number;
    sub?:  string;
    color: string;
  }) => (
    <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-5 shadow-xl">
      <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${color}`}>{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-slate-400 text-xs mt-1">{sub}</p>}
    </div>
  );

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
                  ${tab === "Analytics"
                    ? "bg-rose-500/20 border border-rose-500/30 text-rose-300"
                    : "text-slate-400 hover:text-slate-200 border border-transparent hover:border-white/10"
                  }`}
              >
                {tab}
              </button>
            ))}
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
            Loading analytics…
          </div>
        ) : stats && (
          <>
            {/* ── STAT GRID ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Users"   value={stats.totalUsers}     color="text-indigo-300" />
              <StatCard label="Total Draws"   value={stats.totalDraws}     sub={`${stats.openDraws} open · ${stats.completedDraws} completed`} color="text-blue-300" />
              <StatCard label="Total Entries" value={stats.totalEntries}   color="text-violet-300" />
              <StatCard label="Total Winners" value={stats.totalWinners}   color="text-amber-300" />
            </div>

            {/* ── PRIZE POOL ROW ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Total Prize Pool" value={`₹${stats.totalPrizePool}`}  color="text-emerald-300" />
              <StatCard label="Total Paid Out"   value={`₹${stats.totalPaidOut}`}    color="text-emerald-400" />
              <StatCard
                label="Pending Payout"
                value={`₹${stats.totalPrizePool - stats.totalPaidOut}`}
                sub={`${stats.pendingWinners} pending · ${stats.rejectedWinners} rejected`}
                color="text-amber-300"
              />
            </div>

            {/* ── BOTTOM ROW ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Match breakdown */}
              <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-5 shadow-xl">
                <p className="text-xs font-semibold text-rose-300 uppercase tracking-widest mb-4">
                  Match Breakdown
                </p>
                {matchBreakdown.length === 0 ? (
                  <p className="text-slate-500 text-sm">No data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {matchBreakdown.map((m) => (
                      <div key={m.matchCount} className="flex items-center gap-3">
                        <span className="text-white font-bold text-sm w-16">
                          {m.matchCount} match{m.matchCount !== 1 ? "es" : ""}
                        </span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgb(255 255 255 / 0.08)" }}>
                          <div
                            className="h-full bg-linear-to-r from-indigo-500 to-blue-400 rounded-full"
                            style={{
                              width: `${Math.min(
                                (m._count.matchCount / Math.max(...matchBreakdown.map(x => x._count.matchCount))) * 100,
                                100
                              )}%`
                            }}
                          />
                        </div>
                        <span className="text-slate-400 text-xs w-8 text-right">{m._count.matchCount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent winners */}
              <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-5 shadow-xl">
                <p className="text-xs font-semibold text-rose-300 uppercase tracking-widest mb-4">
                  Recent Winners
                </p>
                {recentWinners.length === 0 ? (
                  <p className="text-slate-500 text-sm">No winners yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentWinners.map((w) => (
                      <div key={w.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-400/30
                                          flex items-center justify-center text-xs font-bold text-indigo-300">
                            {w.user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white text-xs font-medium truncate max-w-30">{w.user.email}</p>
                            <p className="text-slate-500 text-xs">{w.draw.month} · {w.matchCount} matches</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-bold text-sm">₹{w.amount}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border
                            ${w.status === "PAID"
                              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                              : w.status === "REJECTED"
                              ? "bg-rose-500/20 border-rose-500/30 text-rose-300"
                              : "bg-amber-500/20 border-amber-500/30 text-amber-300"
                            }`}>
                            {w.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
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
      `}</style>
    </div>
  );
}