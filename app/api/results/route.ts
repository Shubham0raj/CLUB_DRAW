import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
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

    // ── Get latest completed draw ─────────────────────
    const latestDraw = await prisma.draw.findFirst({
      where:   { status: "COMPLETED" },
      orderBy: { month: "desc" },
    });

    // ── Get current open draw ─────────────────────────
    const currentDraw = await prisma.draw.findFirst({
      where:   { status: "OPEN" },
      orderBy: { month: "desc" },
    });

    const draw = latestDraw ?? currentDraw;

    if (!draw) {
      return NextResponse.json(
        { message: "No draws found yet.", draw: null, entry: null, winner: null },
        { status: 200 }
      );
    }

    // ── Get user's entry for this draw ────────────────
    const entry = await prisma.entry.findFirst({
      where: { userId, drawId: draw.id },
    });

    // ── Get user's winner record for this draw ────────
    const winner = await prisma.winner.findFirst({
      where: { userId, drawId: draw.id },
    });

    return NextResponse.json({ draw, entry, winner }, { status: 200 });

  } catch (error) {
    console.error("[GET /api/results]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}