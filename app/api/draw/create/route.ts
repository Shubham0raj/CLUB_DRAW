// /app/api/draws/create/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function generateUniqueNumbers(count: number, min: number, max: number): number[] {
  const picked = new Set<number>();

  while (picked.size < count) {
    const n = Math.floor(Math.random() * (max - min + 1)) + min;
    picked.add(n);
  }

  // Sort ascending before returning
  return Array.from(picked).sort((a, b) => a - b);
}

function getCurrentMonth(): string {
  return new Date()
    .toLocaleString("en-US", { month: "long", year: "numeric" })
    .replace(" ", "-");
  // e.g. "March-2026"
}

export async function POST(_req: NextRequest) {
  try {
    // 1. Build current month string e.g. "March-2026"
    const month: string = getCurrentMonth();

    // 2. Check if a draw already exists for this month
    const existing = await prisma.draw.findFirst({
      where: { month },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Draw already exists for this month." },
        { status: 400 }
      );
    }

    // 3. Generate 5 unique random numbers (1–45), sorted ascending
    const numbers: number[] = generateUniqueNumbers(5, 1, 45);

    // 4. Insert new draw into database
    const draw = await prisma.draw.create({
      data: {
        numbers,
        month,
        status: "OPEN",
      },
    });

    // 5. Return the created draw
    return NextResponse.json({ draw }, { status: 201 });

  } catch (error) {
    console.error("[POST /api/draws/create]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}