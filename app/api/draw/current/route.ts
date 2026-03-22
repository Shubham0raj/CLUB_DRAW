import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const draw = await prisma.draw.findFirst({
      where: { status: "OPEN" },
      orderBy: { month: "desc" },
    });

    return NextResponse.json({ draw });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch draw" },
      { status: 500 }
    );
  }
}