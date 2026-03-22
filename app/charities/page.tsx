"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Charity = {
  id:          string;
  name:        string;
  description: string;
  image:       string | null;
  featured:    boolean;
};

export default function CharitiesPage() {
  const router = useRouter();

  const [charities, setCharities]   = useState<Charity[]>([]);
  const [filtered, setFiltered]     = useState<Charity[]>([]);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [selecting, setSelecting]   = useState<string | null>(null);
  const [selected, setSelected]     = useState<string | null>(null);
  const [contribution, setContribution] = useState<number>(10);
  const [message, setMessage]       = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const getToken     = () => localStorage.getItem("token");
  const authHeaders  = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  // ── Guard ───────────────────────────────────────────
  useEffect(() => {
    if (!getToken()) router.push("/login");
  }, []);

  // ── Fetch charities ─────────────────────────────────
  useEffect(() => {
    const fetchCharities = async () => {
      try {
        setLoading(true);
        const res  = await fetch("/api/charities");
        const data = await res.json();
        setCharities(data.charities ?? []);
        setFiltered(data.charities  ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch current selection
    const fetchCurrentSelection = async () => {
      try {
        const res  = await fetch("/api/charities/select", { headers: authHeaders() });
        const data = await res.json();
        if (res.ok && data.user?.charityId) {
          setSelected(data.user.charityId);
          setContribution(data.user.charityContribution);
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (getToken()) {
      fetchCharities();
      fetchCurrentSelection();
    }
  }, []);

  // ── Search filter ───────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      charities.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      )
    );
  }, [search, charities]);

  // ── Select charity ──────────────────────────────────
  const handleSelect = async (charityId: string) => {
    try {
      setSelecting(charityId);
      setMessage("");

      const res  = await fetch("/api/charities/select", {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ charityId, contribution }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessageType("error");
        setMessage(data.error);
        return;
      }

      setSelected(charityId);
      setMessageType("success");
      setMessage(`Charity selected! Contributing ${contribution}% of your subscription.`);

    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Something went wrong.");
    } finally {
      setSelecting(null);
    }
  };

  const featured  = filtered.filter((c) => c.featured);
  const regular   = filtered.filter((c) => !c.featured);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-indigo-950 to-slate-900 px-4 py-12">

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto space-y-6 animate-fade-in">

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
              💚
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Choose Your Charity</h1>
              <p className="text-slate-400 text-sm">A portion of your subscription goes directly to your chosen charity</p>
            </div>
          </div>
        </div>

        {/* ── CONTRIBUTION SLIDER ── */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm px-8 py-6 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">
              Your Contribution
            </p>
            <span className="text-white font-bold text-lg">{contribution}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={contribution}
            onChange={(e) => setContribution(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>10% (minimum)</span>
            <span>100%</span>
          </div>
        </div>

        {/* ── SEARCH ── */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search charities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-500/60
                       text-white placeholder-slate-500 text-sm
                       rounded-xl px-5 py-3.5 outline-none transition-all duration-200"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
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

        {loading ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 px-8 py-16 text-center text-slate-500 text-sm">
            Loading charities…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 px-8 py-16 text-center text-slate-500 text-sm">
            No charities found.
          </div>
        ) : (
          <>
            {/* ── FEATURED ── */}
            {featured.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest px-1">
                  ⭐ Featured
                </p>
                {featured.map((c) => (
                  <CharityCard
                    key={c.id}
                    charity={c}
                    isSelected={selected === c.id}
                    isSelecting={selecting === c.id}
                    onSelect={() => handleSelect(c.id)}
                  />
                ))}
              </div>
            )}

            {/* ── ALL CHARITIES ── */}
            {regular.length > 0 && (
              <div className="space-y-3">
                {featured.length > 0 && (
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-1">
                    All Charities
                  </p>
                )}
                {regular.map((c) => (
                  <CharityCard
                    key={c.id}
                    charity={c}
                    isSelected={selected === c.id}
                    isSelecting={selecting === c.id}
                    onSelect={() => handleSelect(c.id)}
                  />
                ))}
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
      `}</style>
    </div>
  );
}

// ── Charity Card Component ────────────────────────────
function CharityCard({
  charity,
  isSelected,
  isSelecting,
  onSelect,
}: {
  charity:    { id: string; name: string; description: string; image: string | null; featured: boolean };
  isSelected: boolean;
  isSelecting: boolean;
  onSelect:   () => void;
}) {
  return (
    <div className={`rounded-2xl border backdrop-blur-sm px-6 py-5 shadow-xl
                     transition-all duration-200
                     ${isSelected
                       ? "bg-indigo-500/10 border-indigo-500/40"
                       : "bg-white/5 border-white/10 hover:border-white/20"
                     }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          {/* Icon / Image */}
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30
                          flex items-center justify-center text-2xl shrink-0">
            {charity.image ? (
              <img src={charity.image} alt={charity.name} className="w-full h-full object-cover rounded-xl" />
            ) : "💚"}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-semibold text-base">{charity.name}</h3>
              {charity.featured && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-medium">
                  Featured
                </span>
              )}
              {isSelected && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-medium">
                  ✓ Selected
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">{charity.description}</p>
          </div>
        </div>

        {/* Select button */}
        <button
          onClick={onSelect}
          disabled={isSelecting || isSelected}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold
                     transition-all duration-200 hover:scale-[1.02]
                     disabled:cursor-not-allowed disabled:hover:scale-100
                     ${isSelected
                       ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 opacity-60"
                       : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40"
                     }`}
        >
          {isSelecting ? "…" : isSelected ? "Selected" : "Select"}
        </button>
      </div>
    </div>
  );
}