import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

// ── GET subscription status ───────────────────────────
export async function GET(req: NextRequest) {
  try {
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

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    // ── Auto-expire if period ended ───────────────────
    if (
      subscription &&
      subscription.status === "active" &&
      new Date() > subscription.currentPeriodEnd
    ) {
      await prisma.subscription.update({
        where: { userId },
        data:  { status: "inactive" },
      });
      subscription.status = "inactive";
    }

    return NextResponse.json({ subscription }, { status: 200 });

  } catch (error) {
    console.error("[GET /api/subscription/status]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// ── DELETE cancel subscription ────────────────────────
export async function DELETE(req: NextRequest) {
  try {
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

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found." },
        { status: 404 }
      );
    }

    if (subscription.status === "cancelled") {
      return NextResponse.json(
        { error: "Subscription is already cancelled." },
        { status: 400 }
      );
    }

    // ── Mark as cancelled ─────────────────────────────
    // Access remains until currentPeriodEnd
    const updated = await prisma.subscription.update({
      where: { userId },
      data:  { status: "cancelled" },
    });

    return NextResponse.json(
      {
        message: "Subscription cancelled. Access remains until period end.",
        subscription: updated,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[DELETE /api/subscription/status]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}