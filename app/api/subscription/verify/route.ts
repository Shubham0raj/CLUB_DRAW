import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

const PLAN_DURATION: Record<string, number> = {
  monthly: 30,
  yearly:  365,
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
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      return NextResponse.json(
        { error: "Missing payment details." },
        { status: 400 }
      );
    }

    // ── Verify signature ──────────────────────────────
    const body      = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected  = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return NextResponse.json(
        { error: "Payment verification failed. Invalid signature." },
        { status: 400 }
      );
    }

    // ── Calculate period end ──────────────────────────
    const days           = PLAN_DURATION[plan] ?? 30;
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + days);

    // ── Upsert subscription in DB ─────────────────────
    const subscription = await prisma.subscription.upsert({
      where:  { userId },
      create: {
        userId,
        plan,
        status:           "active",
        razorpayOrderId:  razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        currentPeriodEnd,
      },
      update: {
        plan,
        status:           "active",
        razorpayOrderId:  razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        currentPeriodEnd,
      },
    });

    return NextResponse.json(
      { message: "Payment verified. Subscription activated!", subscription },
      { status: 200 }
    );

  } catch (error) {
    console.error("[POST /api/subscription/verify]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}