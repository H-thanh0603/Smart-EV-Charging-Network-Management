import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: "Thiếu token hoặc mật khẩu" }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });

  // DB lưu sha256(token) — lookup bằng hash (forgot-password ghi hash)
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await prisma.user.findFirst({
    where: { resetToken: tokenHash, resetTokenExp: { gt: new Date() } }
  });
  if (!user) return NextResponse.json({ error: "Token không hợp lệ hoặc đã hết hạn" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, resetToken: null, resetTokenExp: null }
  });

  return NextResponse.json({ success: true });
}
