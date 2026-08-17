import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const where = { userId: user.id };
  const orderBy = { createdAt: "desc" as const };

  // Không ?page → trả toàn bộ (backward-compat: CustomerShell đếm unread cần đủ rows)
  const url = new URL(req.url);
  const pageParam = url.searchParams.get("page");
  if (!pageParam) {
    const list = await prisma.notification.findMany({ where, orderBy, take: 50 });
    return NextResponse.json(list);
  }

  const page = Math.max(parseInt(pageParam) || 1, 1);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20") || 20, 1), 100);
  const [items, total] = await Promise.all([
    prisma.notification.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.notification.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, limit });
}
