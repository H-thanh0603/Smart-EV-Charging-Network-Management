import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "Sai email hoặc mật khẩu" }, { status: 401 });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ error: "Sai email hoặc mật khẩu" }, { status: 401 });
    const token = signToken({ id: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    response.cookies.set("ev_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
