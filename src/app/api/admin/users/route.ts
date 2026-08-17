import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import bcrypt from "bcryptjs";

async function checkAdmin(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u || u.role !== "ADMIN") return null;
  return u;
}

export async function GET(req: NextRequest) {
  const u = await checkAdmin(req);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, phone: true, role: true, fleetId: true, createdAt: true },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const u = await checkAdmin(req);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, password, name, phone, role, fleetId } = await req.json();
  if (!email || !password || !name) return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists && !exists.deletedAt) return NextResponse.json({ error: "Email đã tồn tại" }, { status: 400 });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hash, name, phone: phone || null, role: role || "CUSTOMER", fleetId: fleetId || null }
  });
  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role });
}

export async function PUT(req: NextRequest) {
  const u = await checkAdmin(req);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, name, phone, role, fleetId, password } = await req.json();
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  const data: any = {};
  if (name !== undefined) data.name = name;
  if (phone !== undefined) data.phone = phone;
  if (role !== undefined) data.role = role;
  if (fleetId !== undefined) data.fleetId = fleetId || null;
  if (password) data.password = await bcrypt.hash(password, 10);

  const user = await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role });
}

export async function DELETE(req: NextRequest) {
  const u = await checkAdmin(req);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
  if (id === u.id) return NextResponse.json({ error: "Không thể xoá chính mình" }, { status: 400 });

  await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
