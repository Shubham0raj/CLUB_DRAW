import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin, unauthorizedResponse } from "@/lib/adminAuth";

export const runtime = "nodejs";

// ── GET all winners ───────────────────────────────────
export async function GET(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorizedResponse();

  try {
    const winners = await prisma.winner.findMany({
      orderBy: { id: "desc" },
      include: {
        user: { select: { email: true } },
        draw: { select: { month: true, numbers: true } },
      },
    });

    return NextResponse.json({ winners }, { status: 200 });

  } catch (error) {
    console.error("[GET /api/admin/winners]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// ── PATCH update winner status ────────────────────────
export async function PATCH(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorizedResponse();

  try {
    const { winnerId, status } = await req.json();

    if (!winnerId || typeof winnerId !== "string") {
      return NextResponse.json(
        { error: "winnerId is required." },
        { status: 400 }
      );
    }

    if (!["PENDING", "PAID", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be PENDING, PAID, or REJECTED." },
        { status: 400 }
      );
    }

    const updated = await prisma.winner.update({
      where: { id: winnerId },
      data:  { status },
    });

    return NextResponse.json(
      { message: `Winner marked as ${status}.`, winner: updated },
      { status: 200 }
    );

  } catch (error) {
    console.error("[PATCH /api/admin/winners]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// ── DELETE a winner ───────────────────────────────────
export async function DELETE(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorizedResponse();

  try {
    const { winnerId } = await req.json();

    if (!winnerId || typeof winnerId !== "string") {
      return NextResponse.json(
        { error: "winnerId is required." },
        { status: 400 }
      );
    }

    await prisma.winner.delete({ where: { id: winnerId } });

    return NextResponse.json(
      { message: "Winner deleted successfully." },
      { status: 200 }
    );

  } catch (error) {
    console.error("[DELETE /api/admin/winners]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}