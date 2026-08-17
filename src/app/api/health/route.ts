import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

// Liveness + readiness: kiểm tra DB + Redis có phản hồi.
export async function GET() {
  const checks: Record<string, "ok" | "down"> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = "ok";
  } catch {
    checks.db = "down";
  }

  try {
    await redis.ping();
    checks.redis = "ok";
  } catch {
    checks.redis = "down";
  }

  const healthy = checks.db === "ok" && checks.redis === "ok";
  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString(), checks },
    { status: healthy ? 200 : 503 }
  );
}