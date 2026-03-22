import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return null;
  }
}

export async function checkSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) return false;
  if (subscription.status !== "active") return false;
  if (new Date() > subscription.currentPeriodEnd) return false;

  return true;
}