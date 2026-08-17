import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { buildEinvoiceXml } from "@/lib/einvoice";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const inv = await prisma.invoice.findUnique({ where: { id: params.id }, select: { userId: true } });
  if (!inv || (inv.userId !== u.id && u.role !== "ADMIN")) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await buildEinvoiceXml(params.id);
  if (!result) return NextResponse.json({ error: "Không tạo được hóa đơn điện tử" }, { status: 400 });

  const { xml, qr } = result;
  const fmt = req.nextUrl.searchParams.get("format");
  if (fmt === "xml") {
    return new NextResponse(xml, {
      headers: { "Content-Type": "application/xml; charset=utf-8", "Content-Disposition": `attachment; filename="invoice-${params.id}.xml"` },
    });
  }
  return NextResponse.json({ xml, qr, message: "Hóa đơn điện tử (bản demo, chưa ký số / chưa có mã cơ quan thuế)" });
}