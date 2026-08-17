import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// Tra cứu audit log — admin xem ai đã làm gì.
// GET /api/admin/audit?entity=Station&limit=50
export async function GET(req: NextRequest) {
  const user = await requireRole(req, ["ADMIN"]);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const entity = searchParams.get("entity");
  const action = searchParams.get("action");
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(entity ? { entity } : {}),
      ...(action ? { action } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json(logs);
}
