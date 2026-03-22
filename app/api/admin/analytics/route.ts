import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin, unauthorizedResponse } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorizedResponse();

  try {
    // ── Counts ────────────────────────────────────────
    const [
      totalUsers,
      totalDraws,
      totalEntries,
      totalWinners,
      openDraws,
      completedDraws,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.draw.count(),
      prisma.entry.count(),
      prisma.winner.count(),
      prisma.draw.count({ where: { status: "OPEN" } }),
      prisma.draw.count({ where: { status: "COMPLETED" } }),
    ]);

    // ── Prize pool ────────────────────────────────────
    const prizeData = await prisma.winner.aggregate({
      _sum: { amount: true },
    });
    const totalPrizePool = prizeData._sum.amount ?? 0;

    // ── Paid out ──────────────────────────────────────
    const paidData = await prisma.winner.aggregate({
      where: { status: "PAID" },
      _sum:  { amount: true },
    });
    const totalPaidOut = paidData._sum.amount ?? 0;

    // ── Winners by status ─────────────────────────────
    const [pendingWinners, paidWinners, rejectedWinners] = await Promise.all([
      prisma.winner.count({ where: { status: "PENDING" } }),
      prisma.winner.count({ where: { status: "PAID" } }),
      prisma.winner.count({ where: { status: "REJECTED" } }),
    ]);

    // ── Match breakdown ───────────────────────────────
    const matchBreakdown = await prisma.winner.groupBy({
        by:      ["match"],
        _count:  { _all: true },
        orderBy: { match: "desc" },
    });

    // ── Recent winners (last 5) ───────────────────────
    const recentWinners = await prisma.winner.findMany({
      take:    5,
      orderBy: { id: "desc" },
      include: {
        user: { select: { email: true } },
        draw: { select: { month: true } },
      },
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalDraws,
        totalEntries,
        totalWinners,
        openDraws,
        completedDraws,
        totalPrizePool,
        totalPaidOut,
        pendingWinners,
        paidWinners,
        rejectedWinners,
      },
      matchBreakdown,
      recentWinners,
    }, { status: 200 });

  } catch (error) {
    console.error("[GET /api/admin/analytics]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}