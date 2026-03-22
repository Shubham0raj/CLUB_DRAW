import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Count matching numbers
function countMatches(snapshot: number[], drawNumbers: number[]): number {
  const drawSet = new Set(drawNumbers);
  return snapshot.filter((n) => drawSet.has(n)).length;
}

// Simple prize logic
function calculateAmount(match: number): number {
  return match * 100;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { drawId } = body;

    // 1. Validate input
    if (!drawId || typeof drawId !== "string") {
      return NextResponse.json(
        { error: "drawId is required and must be a string." },
        { status: 400 }
      );
    }

    // 2. Fetch draw
    const draw = await prisma.draw.findUnique({
      where: { id: drawId },
    });

    if (!draw) {
      return NextResponse.json(
        { error: "Draw not found." },
        { status: 404 }
      );
    }

    // 3. Prevent re-running draw
    if (draw.status !== "OPEN") {
      return NextResponse.json(
        { error: "Draw already processed." },
        { status: 400 }
      );
    }

    // 4. Prevent duplicate winners
    const existingWinners = await prisma.winner.findFirst({
      where: { drawId },
    });

    if (existingWinners) {
      return NextResponse.json(
        { error: "Winners already calculated for this draw." },
        { status: 400 }
      );
    }

    // 5. Fetch entries
    const entries = await prisma.entry.findMany({
      where: { drawId },
    });

    if (entries.length === 0) {
      return NextResponse.json(
        { message: "No entries for this draw.", winners: [] },
        { status: 200 }
      );
    }

    // 6. Compute winners
    const winnersToCreate = [];

    for (const entry of entries) {
      const match = countMatches(entry.snapshot, draw.numbers);

      if (match >= 3) {
        winnersToCreate.push({
          userId: entry.userId,
          drawId: entry.drawId,
          match,
          amount: calculateAmount(match),
          status: "PENDING",
        });
      }
    }

    // 7. Insert winners
    const createdWinners = await prisma.$transaction(
      winnersToCreate.map((w) =>
        prisma.winner.create({
          data: w,
        })
      )
    );

    // 8. Update draw status
    await prisma.draw.update({
      where: { id: drawId },
      data: { status: "COMPLETED" },
    });

    // 9. Return response
    return NextResponse.json(
      {
        message: `Draw completed. ${createdWinners.length} winner(s) found.`,
        winners: createdWinners,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("[POST /api/draw/run]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}