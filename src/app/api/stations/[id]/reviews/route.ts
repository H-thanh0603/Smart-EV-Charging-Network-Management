import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const reviews = await prisma.review.findMany({
    where: { stationId: params.id },
    include: { user: { select: { name: true, avatar: true } } },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rating, comment } = await req.json();
  if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: "Rating phải từ 1-5" }, { status: 400 });

  // VERIFIED PURCHASE: chỉ cho review nếu đã có session COMPLETED ở trạm này
  const hasCompleted = await prisma.chargingSession.findFirst({
    where: {
      userId: user.id,
      status: "COMPLETED",
      slot: { stationId: params.id }
    }
  });
  if (!hasCompleted) {
    return NextResponse.json({ error: "Bạn cần hoàn thành ít nhất 1 phiên sạc tại trạm này mới được đánh giá." }, { status: 403 });
  }

  const review = await prisma.review.upsert({
    where: { userId_stationId: { userId: user.id, stationId: params.id } },
    create: { userId: user.id, stationId: params.id, rating, comment, verified: true },
    update: { rating, comment }
  });

  const all = await prisma.review.findMany({ where: { stationId: params.id } });
  const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
  await prisma.station.update({ where: { id: params.id }, data: { rating: avg, reviewCount: all.length } });

  return NextResponse.json(review);
}
