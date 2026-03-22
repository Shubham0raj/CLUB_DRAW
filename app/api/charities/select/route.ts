import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

// ── GET current user's charity selection ──────────────
export async function GET(req: NextRequest) {
  try {
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

    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: {
        charityId:           true,
        charityContribution: true,
        charity: {
          select: {
            id:          true,
            name:        true,
            description: true,
            image:       true,
            featured:    true,
          },
        },
      },
    });

    return NextResponse.json({ user }, { status: 200 });

  } catch (error) {
    console.error("[GET /api/charities/select]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ── POST select charity ───────────────────────────────
export async function POST(req: NextRequest) {
  try {
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

    const { charityId, contribution } = await req.json();

    // ── Validate ──────────────────────────────────────
    if (!charityId || typeof charityId !== "string") {
      return NextResponse.json(
        { error: "charityId is required." },
        { status: 400 }
      );
    }

    const contributionValue = contribution ?? 10;

    if (
      typeof contributionValue !== "number" ||
      contributionValue < 10  ||
      contributionValue > 100
    ) {
      return NextResponse.json(
        { error: "Contribution must be between 10% and 100%." },
        { status: 400 }
      );
    }

    // ── Check charity exists ──────────────────────────
    const charity = await prisma.charity.findUnique({ where: { id: charityId } });
    if (!charity) {
      return NextResponse.json({ error: "Charity not found." }, { status: 404 });
    }

    // ── Update user ───────────────────────────────────
    const updated = await prisma.user.update({
      where: { id: userId },
      data:  {
        charityId,
        charityContribution: contributionValue,
      },
      select: {
        charityId:           true,
        charityContribution: true,
        charity: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(
      { message: "Charity selected successfully.", user: updated },
      { status: 200 }
    );

  } catch (error) {
    console.error("[POST /api/charities/select]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}