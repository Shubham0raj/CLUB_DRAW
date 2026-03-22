// /app/api/scores/add/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // ── Auth: extract userId from token ───────────────
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }

    const userId = (decoded as any).userId; // ← from token, not body

    // ── Body: only value and date ─────────────────────
    const { value, date } = await req.json();

    // ── Validate ──────────────────────────────────────
    if (value === undefined || typeof value !== "number" || value < 1 || value > 45) {
      return NextResponse.json(
        { error: "value is required and must be a number between 1 and 45." },
        { status: 400 }
      );
    }

    const parsedDate = new Date(date);
    if (!date || isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "date is required and must be a valid date string." },
        { status: 400 }
      );
    }

    // ── Insert the new score ──────────────────────────
    await prisma.score.create({
      data: {
        userId,       // ← comes from token
        value,
        date: parsedDate,
      },
    });

    // ── Fetch all scores for the user, oldest first ───
    const scores = await prisma.score.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      take: 6,
    });

    // ── Keep only latest 5, delete oldest if needed ───
    if (scores.length > 5) {
      const oldest = scores[0];
      await prisma.score.delete({
        where: { id: oldest.id },
      });
    }

    // ── Return success ────────────────────────────────
    return NextResponse.json(
      { message: "Score added successfully." },
      { status: 201 }
    );

  } catch (error) {
    console.error("[POST /api/scores/add]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}