import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Cần email" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to prevent email enumeration
  if (!user) return NextResponse.json({ success: true, message: "Nếu email tồn tại, link đã được gửi." });

  const token = crypto.randomBytes(32).toString("hex");
  const exp = new Date(Date.now() + 60 * 60 * 1000); // 1h
  // Chỉ lưu hash — DB leak không lộ token reset
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await prisma.user.update({ where: { id: user.id }, data: { resetToken: tokenHash, resetTokenExp: exp } });

  // Tránh lộ token cho attacker: chỉ trả link trong dev. Production phải gửi email/SMS.
  const resetUrl = `${req.nextUrl.origin}/reset-password?token=${token}`;
  if (process.env.NODE_ENV !== "production") {
    logger.info({ email, resetUrl }, "[Reset] password reset link generated");
    return NextResponse.json({
      success: true,
      message: "Link đặt lại đã được gửi tới email (demo: hiện ngay tại đây).",
      demoResetUrl: resetUrl
    });
  }
  return NextResponse.json({
    success: true,
    message: "Nếu email tồn tại, link đặt lại mật khẩu đã được gửi tới email của bạn."
  });
}
