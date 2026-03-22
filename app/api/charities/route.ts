import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// ── GET all charities (public) ────────────────────────
export async function GET(req: NextRequest) {
  try {
    const charities = await prisma.charity.findMany({
      orderBy: [
        { featured: "desc" }, // featured first
        { name: "asc" },
      ],
      select: {
        id:          true,
        name:        true,
        description: true,
        image:       true,
        featured:    true,
      },
    });

    return NextResponse.json({ charities }, { status: 200 });

  } catch (error) {
    console.error("[GET /api/charities]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}