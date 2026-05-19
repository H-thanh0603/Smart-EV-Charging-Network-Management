import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function checkApiKey(req: NextRequest) {
  const key = req.headers.get("x-api-key");
  if (!key) return null;
  const apiKey = await prisma.apiKey.findUnique({ where: { key } });
  if (!apiKey || !apiKey.active) return null;
  await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsed: new Date() } });
  return apiKey;
}

export async function GET(req: NextRequest) {
  const apiKey = await checkApiKey(req);
  if (!apiKey) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  const stations = await prisma.station.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true, name: true, address: true, city: true, district: true,
      lat: true, lng: true, openHours: true, phone: true, rating: true,
      slots: { select: { id: true, slotNumber: true, connectorType: true, powerKw: true, status: true } }
    }
  });
  return NextResponse.json({ stations, count: stations.length });
}
