import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Plan prices in paise (INR × 100)
const PLANS = {
  monthly: {
    amount:      100,   // ₹999/month
    description: "Golf Draw Monthly Plan",
    duration:    30,      // days
  },
  yearly: {
    amount:      799,  // ₹7999/year
    description: "Golf Draw Yearly Plan",
    duration:    365,     // days
  },
};

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const token   = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }

    const userId = (decoded as any).userId;

    // ── Body ──────────────────────────────────────────
    const { plan } = await req.json();

    if (!plan || !["monthly", "yearly"].includes(plan)) {
      return NextResponse.json(
        { error: "Plan must be monthly or yearly." },
        { status: 400 }
      );
    }

    // ── Check existing active subscription ────────────
    const existing = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (existing && existing.status === "active") {
      return NextResponse.json(
        { error: "You already have an active subscription." },
        { status: 400 }
      );
    }

    // ── Create Razorpay order ─────────────────────────
    const selectedPlan = PLANS[plan as "monthly" | "yearly"];

    const order = await razorpay.orders.create({
      amount:   selectedPlan.amount,
      currency: "INR",
      notes: {
        userId,
        plan,
      },
    });

    return NextResponse.json({
      orderId:     order.id,
      amount:      order.amount,
      currency:    order.currency,
      plan,
      description: selectedPlan.description,
      keyId:       process.env.RAZORPAY_KEY_ID,
    }, { status: 200 });

  } catch (error) {
    console.error("[POST /api/subscription/create-order]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}