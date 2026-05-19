import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const slot = await prisma.slot.findFirst({
    where: { OR: [{ qrCode: params.code }, { id: params.code }] },
    include: { station: true }
  });
  if (!slot) return NextResponse.json({ error: "Không tìm thấy trụ" }, { status: 404 });
  return NextResponse.json(slot);
}
