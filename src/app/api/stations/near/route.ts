import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") || "0");
  const lng = parseFloat(req.nextUrl.searchParams.get("lng") || "0");
  const radius = parseFloat(req.nextUrl.searchParams.get("radius") || "10");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");

  if (!lat || !lng) return NextResponse.json({ error: "Cần lat & lng" }, { status: 400 });

  const stations = await prisma.station.findMany({
    where: { status: "ACTIVE", lat: { not: null }, lng: { not: null } },
    include: { slots: true }
  });

  const withDistance = stations
    .map(s => ({ ...s, distance: haversine(lat, lng, s.lat!, s.lng!) }))
    .filter(s => s.distance <= radius)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  return NextResponse.json(withDistance);
}
