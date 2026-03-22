import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin, unauthorizedResponse } from "@/lib/adminAuth";

export const runtime = "nodejs";

// ── GET all charities ─────────────────────────────────
export async function GET(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorizedResponse();

  try {
    const charities = await prisma.charity.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true } },
      },
    });

    return NextResponse.json({ charities }, { status: 200 });

  } catch (error) {
    console.error("[GET /api/admin/charities]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ── POST create charity ───────────────────────────────
export async function POST(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorizedResponse();

  try {
    const { name, description, image, featured } = await req.json();

    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description are required." },
        { status: 400 }
      );
    }

    const charity = await prisma.charity.create({
      data: {
        name,
        description,
        image:    image    ?? null,
        featured: featured ?? false,
      },
    });

    return NextResponse.json({ charity }, { status: 201 });

  } catch (error) {
    console.error("[POST /api/admin/charities]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ── PATCH update charity ──────────────────────────────
export async function PATCH(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorizedResponse();

  try {
    const { charityId, name, description, image, featured } = await req.json();

    if (!charityId) {
      return NextResponse.json({ error: "charityId is required." }, { status: 400 });
    }

    const charity = await prisma.charity.update({
      where: { id: charityId },
      data:  {
        ...(name        !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(image       !== undefined && { image }),
        ...(featured    !== undefined && { featured }),
      },
    });

    return NextResponse.json({ charity }, { status: 200 });

  } catch (error) {
    console.error("[PATCH /api/admin/charities]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ── DELETE charity ────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorizedResponse();

  try {
    const { charityId } = await req.json();

    if (!charityId) {
      return NextResponse.json({ error: "charityId is required." }, { status: 400 });
    }

    // Unlink users before deleting
    await prisma.user.updateMany({
      where: { charityId },
      data:  { charityId: null },
    });

    await prisma.charity.delete({ where: { id: charityId } });

    return NextResponse.json({ message: "Charity deleted." }, { status: 200 });

  } catch (error) {
    console.error("[DELETE /api/admin/charities]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}