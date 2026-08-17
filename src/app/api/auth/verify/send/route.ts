import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createVerifyToken } from "@/lib/email-verify";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(`verify:${getClientIp(req)}`, 3, 60_000);
  if (limited) return limited;

  const { email } = await req.json().catch(() => ({}));
  if (!email) return NextResponse.json({ error: "Cần email" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  // Không rò detail — trả success đều
  if (!user || user.emailVerified) return NextResponse.json({ success: true, message: "Nếu email hợp lệ, link xác minh đã được gửi." });

  const verifyUrl = await createVerifyToken(user.id, req.nextUrl.origin);
  const res: Record<string, unknown> = { success: true, message: "Link xác minh đã được gửi tới email." };
  if (process.env.NODE_ENV !== "production") res.demoVerifyUrl = verifyUrl;
  return NextResponse.json(res);
}