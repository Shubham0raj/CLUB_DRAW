import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin, unauthorizedResponse } from "@/lib/adminAuth";

export const runtime = "nodejs";

// ── GET all draws ─────────────────────────────────────
export async function GET(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorizedResponse();

  try {
    const draws = await prisma.draw.findMany({
      orderBy: { month: "desc" },
      include: {
        _count: {
          select: { entries: true },
        },
      },
    });

    return NextResponse.json({ draws }, { status: 200 });

  } catch (error) {
    console.error("[GET /api/admin/draws]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// ── DELETE a draw ─────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorizedResponse();

  try {
    const { drawId } = await req.json();

    if (!drawId || typeof drawId !== "string") {
      return NextResponse.json(
        { error: "drawId is required." },
        { status: 400 }
      );
    }

    // Delete in correct FK order
    await prisma.winner.deleteMany({ where: { drawId } });
    await prisma.entry.deleteMany({  where: { drawId } });
    await prisma.draw.delete({       where: { id: drawId } });

    return NextResponse.json(
      { message: "Draw deleted successfully." },
      { status: 200 }
    );

  } catch (error) {
    console.error("[DELETE /api/admin/draws]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}