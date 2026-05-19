import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "10.7765");
  const lng = parseFloat(searchParams.get("lng") || "106.7019");

  const vehicles = await prisma.vehicle.findMany({ where: { userId: u.id } });
  const connectorTypes = vehicles.length > 0 ? Array.from(new Set(vehicles.map(v => v.connectorType))) : ["CCS2"];

  const stations = await prisma.station.findMany({
    include: { slots: true }
  });

  const suggested = stations
    .map(s => {
      const distance = s.lat && s.lng ? haversine(lat, lng, s.lat, s.lng) : 999;
      const compatibleSlots = s.slots.filter(sl => connectorTypes.includes(sl.connectorType));
      const available = compatibleSlots.filter(sl => sl.status === "AVAILABLE").length;
      const score = (available > 0 ? 100 : 0) - distance * 10 + (s.isPremium ? 5 : 0) + (s.rating || 0) * 2;
      return {
        id: s.id, name: s.name, address: s.address, district: s.district,
        thumbnailUrl: s.thumbnailUrl, brand: s.brand, isPremium: s.isPremium,
        distance: +distance.toFixed(1), available, total: compatibleSlots.length,
        rating: s.rating, score
      };
    })
    .filter(s => s.total > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return NextResponse.json(suggested);
}
