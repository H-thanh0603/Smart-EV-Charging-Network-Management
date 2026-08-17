import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { parseBody, loginSchema } from "@/lib/validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const limited = checkRateLimit(`login:${getClientIp(req)}`, 5, 60_000);
    if (limited) return limited;

    const parsed = await parseBody(req, loginSchema);
    if (!parsed.ok) return parsed.response;
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) return NextResponse.json({ error: "Sai email hoặc mật khẩu" }, { status: 401 });
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
