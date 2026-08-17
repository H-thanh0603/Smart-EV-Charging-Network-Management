import { NextRequest, NextResponse } from "next/server";
import { cronTick } from "@/lib/cron";

// Chạy mỗi 1 phút - cancel lịch quá hạn + nhắc nhở reservation 15p và 5p trước
export async function GET(req: NextRequest) {
  // Chặn gọi từ ngoài: phải có header x-cron-secret khớp CRON_SECRET
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await cronTick();
  return NextResponse.json({ ...result, checkedAt: new Date().toISOString() });
}