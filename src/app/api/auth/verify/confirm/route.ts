import { NextRequest, NextResponse } from "next/server";
import { confirmVerifyToken } from "@/lib/email-verify";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Thiếu token" }, { status: 400 });

  const result = await confirmVerifyToken(token);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Xác minh email thành công. Bạn có thể đăng nhập." });
}