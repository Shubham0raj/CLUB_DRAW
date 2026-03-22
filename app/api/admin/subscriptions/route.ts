import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin, unauthorizedResponse } from "@/lib/adminAuth";

export const runtime = "nodejs";

// ── GET all subscriptions ─────────────────────────────
export async function GET(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorizedResponse();

  try {
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true } },
      },
    });

    // ── Summary stats ─────────────────────────────────
    const total    = subscriptions.length;
    const active   = subscriptions.filter((s) => s.status === "active").length;
    const cancelled = subscriptions.filter((s) => s.status === "cancelled").length;
    const inactive = subscriptions.filter((s) => s.status === "inactive").length;
    const monthly  = subscriptions.filter((s) => s.plan === "monthly").length;
    const yearly   = subscriptions.filter((s) => s.plan === "yearly").length;

    return NextResponse.json({
      subscriptions,
      stats: { total, active, cancelled, inactive, monthly, yearly },
    }, { status: 200 });

  } catch (error) {
    console.error("[GET /api/admin/subscriptions]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ── PATCH update subscription status ──────────────────
export async function PATCH(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorizedResponse();

  try {
    const { subscriptionId, status } = await req.json();

    if (!subscriptionId || !status) {
      return NextResponse.json(
        { error: "subscriptionId and status are required." },
        { status: 400 }
      );
    }

    if (!["active", "inactive", "cancelled", "past_due"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status." },
        { status: 400 }
      );
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data:  { status },
    });

    return NextResponse.json(
      { message: `Subscription marked as ${status}.`, subscription: updated },
      { status: 200 }
    );

  } catch (error) {
    console.error("[PATCH /api/admin/subscriptions]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}