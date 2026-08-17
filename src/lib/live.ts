import { prisma } from "./prisma";

export type LiveStation = {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string | null;
  lat: number | null;
  lng: number | null;
  brand: string | null;
  isPremium: boolean;
  openHours: string | null;
  rating: number;
  reviewCount: number;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  slots: { id: string; status: string; connectorType: string; powerKw: number; slotNumber: string }[];
  connectorTypes: string[];
  powerKws: number[];
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
  occupancyRate: number;
  activeSessions: { slotNumber: string; elapsedMin: number; remainingMin: number }[];
  status: "FULL" | "BUSY" | "FREE";
};

/**
 * Tính trạng thái realtime của tất cả trạm sạc: đếm slot theo trạng thái,
 * phiên đang sạc + ETA. Dùng chung cho route polling và SSE stream.
 */
export async function getLiveStations(): Promise<LiveStation[]> {
  const stations = await prisma.station.findMany({
    include: {
      slots: {
        select: { id: true, status: true, connectorType: true, powerKw: true, slotNumber: true },
      },
    },
  });

  // 1 query cho toàn bộ session ACTIVE, group theo slotId — bỏ N+1 query-per-station
  const allActive = await prisma.chargingSession.findMany({
    where: { status: "ACTIVE" },
    select: { slotId: true, startTime: true, slot: { select: { powerKw: true, slotNumber: true } } },
  });
  const bySlot = new Map<string, typeof allActive>();
  for (const ses of allActive) {
    const list = bySlot.get(ses.slotId) ?? [];
    list.push(ses);
    bySlot.set(ses.slotId, list);
  }

  return stations.map((s) => {
      // OCCUPIED và CHARGING đều tính là đang bận
      const busyStatuses = ["OCCUPIED", "CHARGING"];
      const available = s.slots.filter((sl) => sl.status === "AVAILABLE").length;
      const occupied = s.slots.filter((sl) => busyStatuses.includes(sl.status)).length;
      const maintenance = s.slots.filter((sl) => sl.status === "MAINTENANCE").length;
      const total = s.slots.length;

      const activeSessions = s.slots.flatMap((sl) => bySlot.get(sl.id) ?? []);

      const sessionInfo = activeSessions.map((ses) => {
        const elapsedMin = Math.floor((Date.now() - new Date(ses.startTime).getTime()) / 60000);
        const typicalMin = ses.slot.powerKw >= 50 ? 35 : 90;
        const remainingMin = Math.max(0, typicalMin - elapsedMin);
        return { slotNumber: ses.slot.slotNumber, elapsedMin, remainingMin };
      });

      return {
        id: s.id,
        name: s.name,
        address: s.address,
        city: s.city,
        district: s.district,
        lat: s.lat,
        lng: s.lng,
        brand: s.brand,
        isPremium: s.isPremium,
        openHours: s.openHours,
        rating: s.rating,
        reviewCount: s.reviewCount,
        thumbnailUrl: s.thumbnailUrl,
        imageUrl: s.imageUrl,
        slots: s.slots,
        connectorTypes: Array.from(new Set(s.slots.map((sl) => sl.connectorType))),
        powerKws: Array.from(new Set(s.slots.map((sl) => sl.powerKw))),
        total,
        available,
        occupied,
        maintenance,
        occupancyRate: total > 0 ? +(((occupied + maintenance) / total) * 100).toFixed(0) : 0,
        activeSessions: sessionInfo,
        status: available === 0 ? "FULL" : available <= 2 ? "BUSY" : "FREE",
      };
  });
}
