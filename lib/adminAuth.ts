import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// ── Call this at the top of every admin API route ────
export function verifyAdmin(req: NextRequest): {
  userId: string;
  email: string;
  role: string;
} | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) return null;

  const user = decoded as any;
  if (user.role !== "ADMIN") return null;

  return {
    userId: user.userId,
    email:  user.email,
    role:   user.role,
  };
}

// ── Reusable unauthorized response ───────────────────
export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Access denied. Admins only." },
    { status: 403 }
  );
}