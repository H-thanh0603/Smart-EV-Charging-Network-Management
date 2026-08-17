import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

async function checkAdmin(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u || u.role !== "ADMIN") return null;
  return u;
}

// Chống NaN: parseFloat rác thường trả NaN rồi lưu vào Float? → 500
function coord(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: NextRequest) {
  const u = await checkAdmin(req);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await req.json();
  const { name, address, city, district, lat, lng, brand, isPremium, openHours, phone, description, amenities, imageUrl, thumbnailUrl } = data;
  if (!name || !address || !city) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
  }

  const station = await prisma.station.create({
    data: {
      // id tự sinh cuid — không dùng tên làm ID (trùng tên crash, đổi tên gãy FK)
      name, address, city, district: district || null,
      lat: coord(lat),
      lng: coord(lng),
      brand: brand || "V-GREEN",
      isPremium: !!isPremium,
      openHours: openHours || "24/7",
      phone: phone || null,
      description: description || null,
      amenities: amenities || "",
      imageUrl: imageUrl || null,
      thumbnailUrl: thumbnailUrl || imageUrl || null,
    }
  });
  await audit({ actorId: u.id, role: u.role, action: "CREATE", entity: "Station", entityId: station.id, detail: `${name} @ ${city}`, ip: getClientIp(req) });
  return NextResponse.json(station);
}

export async function PUT(req: NextRequest) {
  const u = await checkAdmin(req);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await req.json();
  const { id, name, address, city, district, lat, lng, brand, isPremium, openHours, phone, description, amenities, imageUrl, thumbnailUrl } = data;
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  const station = await prisma.station.update({
    where: { id },
    data: {
      name, address, city, district: district || null,
      lat: coord(lat),
      lng: coord(lng),
      brand: brand || "V-GREEN",
      isPremium: !!isPremium,
      openHours, phone: phone || null,
      description: description || null,
      amenities: amenities || "",
      imageUrl: imageUrl || null,
      thumbnailUrl: thumbnailUrl || imageUrl || null,
    }
  });
  await audit({ actorId: u.id, role: u.role, action: "UPDATE", entity: "Station", entityId: id, detail: name, ip: getClientIp(req) });
  return NextResponse.json(station);
}

export async function DELETE(req: NextRequest) {
  const u = await checkAdmin(req);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  // Delete slots first (foreign key)
  await prisma.slot.deleteMany({ where: { stationId: id } });
  await prisma.station.delete({ where: { id } });
  await audit({ actorId: u.id, role: u.role, action: "DELETE", entity: "Station", entityId: id, ip: getClientIp(req) });
  return NextResponse.json({ ok: true });
}
