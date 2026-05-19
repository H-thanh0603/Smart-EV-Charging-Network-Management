import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
export async function POST(req: NextRequest) {
  try {
    const { email, password, name, phone } = await req.json();
    if (!email || !password || !name) return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "Email đã tồn tại" }, { status: 400 });
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashed, name, phone, role: "CUSTOMER" } });
    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch { return NextResponse.json({ error: "Lỗi server" }, { status: 500 }); }
}
