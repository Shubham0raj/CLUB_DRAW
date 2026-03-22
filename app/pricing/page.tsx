"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Subscription = {
  plan:            string;
  status:          string;
  currentPeriodEnd: string;
} | null;

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingPage() {
  const router = useRouter();

  const [subscription, setSubscription] = useState<Subscription>(null);
  const [loading, setLoading]           = useState(true);
  const [paying, setPaying]             = useState<string | null>(null);
  const [cancelling, setCancelling]     = useState(false);
  const [message, setMessage]           = useState("");
  const [messageType, setMessageType]   = useState<"success" | "error">("success");

  const getToken    = () => localStorage.getItem("token");
  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  // ── Guard ───────────────────────────────────────────
  useEffect(() => {
    if (!getToken()) router.push("/login");
  }, []);

  // ── Load Razorpay script ────────────────────────────
  useEffect(() => {
    const script    = document.createElement("script");
    script.src      = "https://checkout.razorpay.com/v1/checkout.js";
    script.async    = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // ── Fetch subscription status ───────────────────────
  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res  = await fetch("/api/subscription/status", { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setSubscription(data.subscription);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getToken()) fetchSubscription();
  }, []);

  // ── Handle Subscribe ────────────────────────────────
  const handleSubscribe = async (plan: "monthly" | "yearly") => {
    try {
      setPaying(plan);
      setMessage("");

      // Step 1: Create order
      const res  = await fetch("/api/subscription/create-order", {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ plan }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessageType("error");
        setMessage(data.error);
        return;
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key:         data.keyId,
        amount:      data.amount,
        currency:    data.currency,
        name:        "Golf Draw System",
        description: data.description,
        order_id:    data.orderId,
        handler: async (response: any) => {
          // Step 3: Verify payment
          const verifyRes = await fetch("/api/subscription/verify", {
            method:  "POST",
            headers: authHeaders(),
            body:    JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              plan,
            }),
          });

          const verifyData = await verifyRes.json();

          if (!verifyRes.ok) {
            setMessageType("error");
            setMessage(verifyData.error);
            return;
          }

          setMessageType("success");
          setMessage("🎉 Subscription activated successfully!");
          fetchSubscription();
        },
        prefill: {
          name:  "",
          email: "",
        },
        theme: { color: "#6366f1" },
        modal: {
          ondismiss: () => {
            setPaying(null);
            setMessage("");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setPaying(null);
    }
  };

  // ── Handle Cancel ───────────────────────────────────
  const handleCancel = async () => {
    if (!confirm("Cancel your subscription? You'll keep access until the period ends.")) return;

    try {
      setCancelling(true);
      setMessage("");

      const res  = await fetch("/api/subscription/status", {
        method:  "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessageType("error");
        setMessage(data.error);
        return;
      }

      setMessageType("success");
      setMessage(data.message);
      fetchSubscription();

    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Something went wrong.");
    } finally {
      setCancelling(false);
    }
  };

  const isActive = subscription?.status === "active" || subscription?.status === "cancelled";

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-indigo-950 to-slate-900 px-4 py-12">

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto space-y-8 animate-fade-in">

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
              💳
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Subscription Plans</h1>
              <p className="text-slate-400 text-sm">Choose a plan to access the Golf Draw System</p>
            </div>
          </div>
        </div>

        {/* ── CURRENT SUBSCRIPTION ── */}
        {!loading && subscription && (
          <div className={`rounded-2xl px-8 py-6 border shadow-xl
            ${subscription.status === "active"
              ? "bg-emerald-500/10 border-emerald-500/30"
              : subscription.status === "cancelled"
              ? "bg-amber-500/10 border-amber-500/30"
              : "bg-rose-500/10 border-rose-500/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-widest mb-1
                  ${subscription.status === "active" ? "text-emerald-300"
                    : subscription.status === "cancelled" ? "text-amber-300"
                    : "text-rose-300"
                  }`}>
                  Current Subscription
                </p>
                <p className="text-white font-bold text-lg capitalize">
                  {subscription.plan} Plan
                  <span className={`ml-3 text-xs px-2.5 py-1 rounded-full font-semibold border
                    ${subscription.status === "active"
                      ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                      : subscription.status === "cancelled"
                      ? "bg-amber-500/20 border-amber-500/30 text-amber-300"
                      : "bg-rose-500/20 border-rose-500/30 text-rose-300"
                    }`}>
                    {subscription.status.toUpperCase()}
                  </span>
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  {subscription.status === "cancelled"
                    ? "Access until: "
                    : "Renews on: "
                  }
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-IN", {
                    day: "numeric", month: "long", year: "numeric"
                  })}
                </p>
              </div>

              {subscription.status === "active" && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="text-xs px-4 py-2 rounded-xl
                             bg-rose-500/15 hover:bg-rose-500/25
                             border border-rose-500/25 hover:border-rose-500/40
                             text-rose-300 font-medium transition-all duration-150
                             disabled:opacity-50"
                >
                  {cancelling ? "Cancelling…" : "Cancel Plan"}
                </button>
              )}
            </div>
          </div>
        )}

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

        {/* ── PRICING CARDS ── */}
        {!isActive && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Monthly */}
            <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm px-8 py-8 shadow-xl space-y-6">
              <div>
                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest mb-2">Monthly</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">₹1</span>
                  <span className="text-slate-400 text-sm mb-1">/month</span>
                </div>
                <p className="text-slate-400 text-sm mt-2">Billed monthly. Cancel anytime.</p>
              </div>

              <ul className="space-y-3">
                {[
                  "Unlimited score entries",
                  "Monthly draw participation",
                  "Winner prize eligibility",
                  "Charity contribution",
                  "Full dashboard access",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-slate-300 text-sm">
                    <span className="text-emerald-400 text-xs">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe("monthly")}
                disabled={paying !== null}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500
                           text-white font-semibold text-sm shadow-lg shadow-indigo-900/40
                           transition-all duration-200 hover:scale-[1.02]
                           disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {paying === "monthly" ? "Processing…" : "Subscribe Monthly"}
              </button>
            </div>

            {/* Yearly */}
            <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/30 backdrop-blur-sm px-8 py-8 shadow-xl space-y-6 relative overflow-hidden">
              {/* Best value badge */}
              <div className="absolute top-4 right-4">
                <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold">
                  Best Value
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest mb-2">Yearly</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">₹7.99</span>
                  <span className="text-slate-400 text-sm mb-1">/year</span>
                </div>
                <p className="text-emerald-400 text-sm mt-2 font-medium">
                  Save ₹3.98 vs monthly (33% off)
                </p>
              </div>

              <ul className="space-y-3">
                {[
                  "Everything in Monthly",
                  "2 months free",
                  "Priority draw entry",
                  "Increased charity contribution",
                  "Early access to features",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-slate-300 text-sm">
                    <span className="text-emerald-400 text-xs">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe("yearly")}
                disabled={paying !== null}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500
                           text-white font-semibold text-sm shadow-lg shadow-indigo-900/40
                           transition-all duration-200 hover:scale-[1.02]
                           disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {paying === "yearly" ? "Processing…" : "Subscribe Yearly"}
              </button>
            </div>
          </div>
        )}

        {/* ── TEST MODE NOTICE ── */}
        <div className="rounded-2xl bg-amber-500/8 border border-amber-500/20 px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="text-amber-400 text-base mt-0.5">ℹ️</span>
            <div>
              <p className="text-amber-200 text-sm font-semibold">Test Mode Active</p>
              <p className="text-amber-300/70 text-xs mt-1">
                Use test card: <span className="font-mono">4111 1111 1111 1111</span> · Expiry: any future date · CVV: any 3 digits
              </p>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.45s ease-out both; }
        .bg-white\/5 { background-color: rgb(255 255 255 / 0.05); }
        .bg-amber-500\/8 { background-color: rgb(245 158 11 / 0.08); }
      `}</style>
    </div>
  );
}