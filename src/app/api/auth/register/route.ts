import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { parseBody, registerSchema } from "@/lib/validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createVerifyToken } from "@/lib/email-verify";

export async function POST(req: NextRequest) {
  try {
    const limited = await checkRateLimit(`register:${getClientIp(req)}`, 3, 60_000);
    if (limited) return limited;

    const parsed = await parseBody(req, registerSchema);
    if (!parsed.ok) return parsed.response;
    const { email, password, name, phone } = parsed.data;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "Email đã tồn tại" }, { status: 400 });
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, phone: phone || null, role: "CUSTOMER" },
    });

    const verifyUrl = await createVerifyToken(user.id, req.nextUrl.origin);
    const res: Record<string, unknown> = { id: user.id, email: user.email, name: user.name, message: "Vui lòng xác minh email để kích hoạt tài khoản." };
    if (process.env.NODE_ENV !== "production") res.demoVerifyUrl = verifyUrl;
    return NextResponse.json(res);
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
