import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin, unauthorizedResponse } from "@/lib/adminAuth";

export const runtime = "nodejs";

// ── GET all users ─────────────────────────────────────
export async function GET(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorizedResponse();

  try {
    const users = await prisma.user.findMany({
      select: {
        id:        true,
        email:     true,
        role:      true,
        _count: {
          select: {
            scores:  true,
            entries: true,
          },
        },
      },
      orderBy: { email: "asc" },
    });

    return NextResponse.json({ users }, { status: 200 });

  } catch (error) {
    console.error("[GET /api/admin/users]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// ── DELETE a user ─────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorizedResponse();

  try {
    const { userId } = await req.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId is required." },
        { status: 400 }
      );
    }

    // Delete in correct order to respect FK constraints
    await prisma.winner.deleteMany({ where: { userId } });
    await prisma.entry.deleteMany({  where: { userId } });
    await prisma.subscription.deleteMany({ where: { userId } });
    await prisma.score.deleteMany({  where: { userId } });
    await prisma.user.delete({       where: { id: userId } });

    return NextResponse.json(
      { message: "User deleted successfully." },
      { status: 200 }
    );

  } catch (error) {
    console.error("[DELETE /api/admin/users]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// ── PATCH update user role ────────────────────────────
export async function PATCH(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorizedResponse();

  try {
    const { userId, role } = await req.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId and role are required." },
        { status: 400 }
      );
    }

    if (!["USER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be USER or ADMIN." },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data:  { role },
    });

    return NextResponse.json(
      { message: "User role updated.", user: updated },
      { status: 200 }
    );

  } catch (error) {
    console.error("[PATCH /api/admin/users]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}