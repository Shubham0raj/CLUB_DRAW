"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id:    string;
  email: string;
  role:  string;
  _count: {
    scores:  number;
    entries: number;
  };
};

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [message, setMessage]   = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [updatingId, setUpdatingId]   = useState<string | null>(null);

  // ── Admin token helper ──────────────────────────────
  const getToken = () => localStorage.getItem("adminToken");

  const adminHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  // ── Guard ───────────────────────────────────────────
  useEffect(() => {
    if (!getToken()) {
      router.push("/admin/login");
    }
  }, []);

  // ── Fetch users ─────────────────────────────────────
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res  = await fetch("/api/admin/users", { headers: adminHeaders() });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) { router.push("/admin/login"); return; }
        setMessageType("error");
        setMessage(data.error);
        return;
      }

      setUsers(data.users);
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getToken()) fetchUsers();
  }, []);

  // ── Delete user ─────────────────────────────────────
  const handleDelete = async (userId: string) => {
    if (!confirm("Delete this user and all their data?")) return;

    try {
      setDeletingId(userId);
      setMessage("");

      const res  = await fetch("/api/admin/users", {
        method:  "DELETE",
        headers: adminHeaders(),
        body:    JSON.stringify({ userId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessageType("error");
        setMessage(data.error);
        return;
      }

      setMessageType("success");
      setMessage("User deleted successfully.");
      setUsers((prev) => prev.filter((u) => u.id !== userId));

    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Toggle role ─────────────────────────────────────
  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";

    try {
      setUpdatingId(userId);
      setMessage("");

      const res  = await fetch("/api/admin/users", {
        method:  "PATCH",
        headers: adminHeaders(),
        body:    JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessageType("error");
        setMessage(data.error);
        return;
      }

      setMessageType("success");
      setMessage(`Role updated to ${newRole}.`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );

    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Something went wrong.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Logout ──────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-12">

      {/* Background orbs */}
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
              onClick={handleLogout}
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
                onClick={() => tab !== "Users" && router.push(`/admin/${tab.toLowerCase()}`)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150
                  ${tab === "Users"
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

        {/* ── USERS TABLE ── */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl overflow-hidden">

          {/* Table header */}
          <div className="px-8 py-5 border-b border-white/8 flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">Users</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {loading ? "Loading…" : `${users.length} registered user${users.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <button
              onClick={fetchUsers}
              className="text-xs text-slate-400 hover:text-slate-200 font-medium px-3 py-1.5
                         rounded-lg border border-white/10 hover:border-white/20 transition-all duration-150"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="px-8 py-12 text-center text-slate-500 text-sm">
              Loading users…
            </div>
          ) : users.length === 0 ? (
            <div className="px-8 py-12 text-center text-slate-500 text-sm">
              No users found.
            </div>
          ) : (
            <div className="divide-y divide-white/5">

              {/* Column labels */}
              <div className="px-8 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                <span className="col-span-4">Email</span>
                <span className="col-span-2">Role</span>
                <span className="col-span-2 text-center">Scores</span>
                <span className="col-span-2 text-center">Entries</span>
                <span className="col-span-2 text-right">Actions</span>
              </div>

              {users.map((user) => (
                <div
                  key={user.id}
                  className="px-8 py-4 grid grid-cols-12 gap-4 items-center hover:bg-white/3 transition-colors duration-150"
                >
                  {/* Email */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-400/30
                                    flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white text-sm font-medium truncate">{user.email}</span>
                  </div>

                  {/* Role badge */}
                  <div className="col-span-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold
                      ${user.role === "ADMIN"
                        ? "bg-rose-500/20 border border-rose-500/30 text-rose-300"
                        : "bg-slate-500/20 border border-slate-500/30 text-slate-300"
                      }`}>
                      {user.role}
                    </span>
                  </div>

                  {/* Score count */}
                  <div className="col-span-2 text-center">
                    <span className="text-white font-semibold text-sm">{user._count.scores}</span>
                  </div>

                  {/* Entry count */}
                  <div className="col-span-2 text-center">
                    <span className="text-white font-semibold text-sm">{user._count.entries}</span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    {/* Toggle role */}
                    <button
                      onClick={() => handleRoleToggle(user.id, user.role)}
                      disabled={updatingId === user.id}
                      className="text-xs px-2.5 py-1.5 rounded-lg
                                 bg-indigo-500/15 hover:bg-indigo-500/25
                                 border border-indigo-500/25 hover:border-indigo-500/40
                                 text-indigo-300 font-medium
                                 transition-all duration-150
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingId === user.id ? "…" : user.role === "ADMIN" ? "→ User" : "→ Admin"}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={deletingId === user.id}
                      className="text-xs px-2.5 py-1.5 rounded-lg
                                 bg-rose-500/15 hover:bg-rose-500/25
                                 border border-rose-500/25 hover:border-rose-500/40
                                 text-rose-300 font-medium
                                 transition-all duration-150
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === user.id ? "…" : "Delete"}
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