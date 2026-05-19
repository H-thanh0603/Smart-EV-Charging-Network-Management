import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stations = await prisma.station.findMany({
    include: {
      slots: {
        select: { id: true, status: true, connectorType: true, powerKw: true, slotNumber: true }
      }
    }
  });

  // For each station, count slots by status + active sessions
  const result = await Promise.all(stations.map(async s => {
    const available = s.slots.filter(sl => sl.status === "AVAILABLE").length;
    const occupied = s.slots.filter(sl => sl.status === "OCCUPIED").length;
    const maintenance = s.slots.filter(sl => sl.status === "MAINTENANCE").length;
    const total = s.slots.length;

    const activeSessions = await prisma.chargingSession.findMany({
      where: { slotId: { in: s.slots.map(sl => sl.id) }, status: "ACTIVE" },
      select: { id: true, slotId: true, startTime: true, slot: { select: { powerKw: true, slotNumber: true } } }
    });

    // Calculate ETAs
    const sessionInfo = activeSessions.map(ses => {
      const elapsed = Date.now() - new Date(ses.startTime).getTime();
      const elapsedMin = Math.floor(elapsed / 60000);
      // Estimate done at ~80% of typical session (40min for fast)
      const typicalMin = ses.slot.powerKw >= 50 ? 35 : 90;
      const remainingMin = Math.max(0, typicalMin - elapsedMin);
      return { slotNumber: ses.slot.slotNumber, elapsedMin, remainingMin };
    });

    return {
      id: s.id, name: s.name, address: s.address, city: s.city, district: s.district,
      lat: s.lat, lng: s.lng, brand: s.brand, isPremium: s.isPremium,
      openHours: s.openHours, rating: s.rating, reviewCount: s.reviewCount,
      thumbnailUrl: s.thumbnailUrl, imageUrl: s.imageUrl,
      total, available, occupied, maintenance,
      occupancyRate: total > 0 ? +(((occupied + maintenance) / total) * 100).toFixed(0) : 0,
      activeSessions: sessionInfo,
      status: available === 0 ? "FULL" : available <= 2 ? "BUSY" : "FREE"
    };
  }));

  return NextResponse.json(result);
}
