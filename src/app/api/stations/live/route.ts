import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { getLiveStations } from "@/lib/live";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await getLiveStations();
  return NextResponse.json(result);
}
