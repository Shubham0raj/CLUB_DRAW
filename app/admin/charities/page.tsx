"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Charity = {
  id:          string;
  name:        string;
  description: string;
  image:       string | null;
  featured:    boolean;
  _count:      { users: number };
};

export default function AdminCharitiesPage() {
  const router = useRouter();

  const [charities, setCharities]   = useState<Charity[]>([]);
  const [loading, setLoading]       = useState(true);
  const [message, setMessage]       = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [togglingId, setTogglingId]   = useState<string | null>(null);

  // ── Add form state ──────────────────────────────────
  const [showForm, setShowForm]       = useState(false);
  const [formName, setFormName]       = useState("");
  const [formDesc, setFormDesc]       = useState("");
  const [formImage, setFormImage]     = useState("");
  const [formFeatured, setFormFeatured] = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  const getToken     = () => localStorage.getItem("adminToken");
  const adminHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  useEffect(() => {
    if (!getToken()) router.push("/admin/login");
  }, []);

  // ── Fetch charities ─────────────────────────────────
  const fetchCharities = async () => {
    try {
      setLoading(true);
      const res  = await fetch("/api/admin/charities", { headers: adminHeaders() });
      const data = await res.json();
      if (!res.ok) { if (res.status === 403) { router.push("/admin/login"); return; } return; }
      setCharities(data.charities);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (getToken()) fetchCharities(); }, []);

  // ── Create charity ──────────────────────────────────
  const handleCreate = async () => {
    if (!formName || !formDesc) {
      setMessageType("error");
      setMessage("Name and description are required.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const res  = await fetch("/api/admin/charities", {
        method:  "POST",
        headers: adminHeaders(),
        body:    JSON.stringify({
          name:        formName,
          description: formDesc,
          image:       formImage || null,
          featured:    formFeatured,
        }),
      });
      const data = await res.json();

      if (!res.ok) { setMessageType("error"); setMessage(data.error); return; }

      setMessageType("success");
      setMessage("Charity created successfully.");
      setShowForm(false);
      setFormName(""); setFormDesc(""); setFormImage(""); setFormFeatured(false);
      fetchCharities();

    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle featured ─────────────────────────────────
  const handleToggleFeatured = async (charityId: string, current: boolean) => {
    try {
      setTogglingId(charityId);
      setMessage("");

      const res  = await fetch("/api/admin/charities", {
        method:  "PATCH",
        headers: adminHeaders(),
        body:    JSON.stringify({ charityId, featured: !current }),
      });
      const data = await res.json();

      if (!res.ok) { setMessageType("error"); setMessage(data.error); return; }

      setMessageType("success");
      setMessage(`Charity ${!current ? "featured" : "unfeatured"}.`);
      setCharities((prev) =>
        prev.map((c) => (c.id === charityId ? { ...c, featured: !current } : c))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  // ── Delete charity ──────────────────────────────────
  const handleDelete = async (charityId: string) => {
    if (!confirm("Delete this charity? Users linked to it will be unlinked.")) return;

    try {
      setDeletingId(charityId);
      setMessage("");

      const res  = await fetch("/api/admin/charities", {
        method:  "DELETE",
        headers: adminHeaders(),
        body:    JSON.stringify({ charityId }),
      });
      const data = await res.json();

      if (!res.ok) { setMessageType("error"); setMessage(data.error); return; }

      setMessageType("success");
      setMessage("Charity deleted.");
      setCharities((prev) => prev.filter((c) => c.id !== charityId));

    } catch (err) {
      console.error(err);
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
          <div className="flex gap-2 mt-5 flex-wrap">
            {["Users", "Draws", "Winners", "Charities", "Analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => router.push(`/admin/${tab.toLowerCase()}`)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150
                  ${tab === "Charities"
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

        {/* ── ADD FORM ── */}
        {showForm && (
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm px-8 py-6 shadow-xl space-y-4">
            <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">Add New Charity</p>

            <input
              type="text" placeholder="Charity name"
              value={formName} onChange={(e) => setFormName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/60
                         text-white placeholder-slate-500 text-sm rounded-xl px-4 py-3 outline-none transition-all duration-200"
            />
            <textarea
              placeholder="Description"
              value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/60
                         text-white placeholder-slate-500 text-sm rounded-xl px-4 py-3 outline-none transition-all duration-200 resize-none"
            />
            <input
              type="text" placeholder="Image URL (optional)"
              value={formImage} onChange={(e) => setFormImage(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/60
                         text-white placeholder-slate-500 text-sm rounded-xl px-4 py-3 outline-none transition-all duration-200"
            />
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox" checked={formFeatured}
                onChange={(e) => setFormFeatured(e.target.checked)}
                className="accent-indigo-500 w-4 h-4"
              />
              <span className="text-slate-300 text-sm">Mark as featured</span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={handleCreate} disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm
                           transition-all duration-200 disabled:opacity-60"
              >
                {submitting ? "Creating…" : "Create Charity"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/20
                           text-slate-300 font-semibold text-sm transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── CHARITIES TABLE ── */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl overflow-hidden">

          <div className="px-8 py-5 border-b border-white/8 flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">Charities</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {loading ? "Loading…" : `${charities.length} charit${charities.length !== 1 ? "ies" : "y"}`}
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-xs font-semibold px-4 py-2 rounded-xl
                         bg-indigo-600 hover:bg-indigo-500 text-white
                         transition-all duration-150 hover:scale-[1.02]"
            >
              + Add Charity
            </button>
          </div>

          {loading ? (
            <div className="px-8 py-12 text-center text-slate-500 text-sm">Loading charities…</div>
          ) : charities.length === 0 ? (
            <div className="px-8 py-12 text-center text-slate-500 text-sm">No charities yet. Add one above.</div>
          ) : (
            <div className="divide-y divide-white/5">
              <div className="px-8 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                <span className="col-span-4">Name</span>
                <span className="col-span-4">Description</span>
                <span className="col-span-1 text-center">Users</span>
                <span className="col-span-1 text-center">Featured</span>
                <span className="col-span-2 text-right">Actions</span>
              </div>

              {charities.map((c) => (
                <div key={c.id} className="px-8 py-4 grid grid-cols-12 gap-4 items-center hover:bg-white/3 transition-colors duration-150">

                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30
                                    flex items-center justify-center text-sm shrink-0">
                      💚
                    </div>
                    <span className="text-white font-semibold text-sm truncate">{c.name}</span>
                  </div>

                  <div className="col-span-4">
                    <p className="text-slate-400 text-xs truncate">{c.description}</p>
                  </div>

                  <div className="col-span-1 text-center">
                    <span className="text-white font-semibold text-sm">{c._count.users}</span>
                  </div>

                  <div className="col-span-1 text-center">
                    {c.featured
                      ? <span className="text-amber-400 text-sm">⭐</span>
                      : <span className="text-slate-600 text-sm">—</span>
                    }
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleToggleFeatured(c.id, c.featured)}
                      disabled={togglingId === c.id}
                      className="text-xs px-2.5 py-1.5 rounded-lg
                                 bg-amber-500/15 hover:bg-amber-500/25
                                 border border-amber-500/25 hover:border-amber-500/40
                                 text-amber-300 font-medium transition-all duration-150
                                 disabled:opacity-50"
                    >
                      {togglingId === c.id ? "…" : c.featured ? "Unfeature" : "Feature"}
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="text-xs px-2.5 py-1.5 rounded-lg
                                 bg-rose-500/15 hover:bg-rose-500/25
                                 border border-rose-500/25 hover:border-rose-500/40
                                 text-rose-300 font-medium transition-all duration-150
                                 disabled:opacity-50"
                    >
                      {deletingId === c.id ? "…" : "Delete"}
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
        .bg-white\/5 { background-color: rgb(255 255 255 / 0.05); }
        .bg-white\/3 { background-color: rgb(255 255 255 / 0.03); }
        .border-white\/8 { border-color: rgb(255 255 255 / 0.08); }
      `}</style>
    </div>
  );
}