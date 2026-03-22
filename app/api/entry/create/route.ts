import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, checkSubscription } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = (decoded as any).userId;

    // ── Check subscription ────────────────────────────
    const hasSubscription = await checkSubscription(userId);
    if (!hasSubscription) {
      return NextResponse.json(
        { error: "Active subscription required to enter the draw." },
        { status: 403 }
      );
    }

    // ── Body ─────────────────────────────────────────────
    const { drawId } = await req.json();

    // ── Validate drawId ──────────────────────────────────
    if (!drawId || typeof drawId !== "string") {
      return NextResponse.json(
        { error: "drawId is required and must be a string." },
        { status: 400 }
      );
    }

    // ── Check if draw exists ─────────────────────────────
    const draw = await prisma.draw.findUnique({
      where: { id: drawId },
    });

    if (!draw) {
      return NextResponse.json(
        { error: "Draw not found." },
        { status: 404 }
      );
    }

    // ── Check if draw is OPEN ────────────────────────────
    if (draw.status !== "OPEN") {
      return NextResponse.json(
        { error: "Draw is not open for entry." },
        { status: 400 }
      );
    }

    // ── Prevent duplicate entry ──────────────────────────
    const existingEntry = await prisma.entry.findFirst({
      where: { userId, drawId },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: "User already entered this draw." },
        { status: 400 }
      );
    }

    // ── Fetch latest 5 scores ────────────────────────────
    const recentScores = await prisma.score.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 5,
    });

    // ── Ensure user has at least 5 scores ────────────────
    if (recentScores.length < 5) {
      return NextResponse.json(
        {
          error: "User does not have enough score history. At least 5 scores are required.",
          found: recentScores.length,
        },
        { status: 400 }
      );
    }

    // ── Create snapshot from scores ──────────────────────
    const snapshot: number[] = recentScores.map((s) => s.value);

    // ── Create entry ─────────────────────────────────────
    const entry = await prisma.entry.create({
      data: {
        userId,
        drawId,
        snapshot,
      },
    });

    // ── Return response ───────────────────────────────────
    return NextResponse.json(
      { message: "Entry created successfully", entry },
      { status: 201 }
    );

  } catch (error) {
    console.error("[POST /api/entry/create]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}