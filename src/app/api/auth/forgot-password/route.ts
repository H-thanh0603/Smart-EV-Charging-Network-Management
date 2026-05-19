import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Cần email" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to prevent email enumeration
  if (!user) return NextResponse.json({ success: true, message: "Nếu email tồn tại, link đã được gửi." });

  const token = crypto.randomBytes(32).toString("hex");
  const exp = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await prisma.user.update({ where: { id: user.id }, data: { resetToken: token, resetTokenExp: exp } });

  // In production: send email with link http://localhost:3000/reset-password?token=...
  // For demo: return token directly so user can copy
  const resetUrl = `${req.nextUrl.origin}/reset-password?token=${token}`;
  console.log(`[Demo] Reset link for ${email}: ${resetUrl}`);

  return NextResponse.json({
    success: true,
    message: "Link đặt lại đã được gửi tới email (demo: hiện ngay tại đây).",
    demoResetUrl: resetUrl
  });
}
