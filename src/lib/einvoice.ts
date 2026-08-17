// Hóa đơn điện tử NĐ123 — demo offline, không ký số.
// Production phải qua nhà cung cấp T-Van (MISA/VNPT/Viettel) để ký số + lấy mã cơ quan thuế.
import { prisma } from "./prisma";

function esc(s: any) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Sinh XML hóa đơn chuẩn NĐ123 (format hóa đơn GTGT, mẫu số 01GTKT0/001,
 * ký hiệu EV/23E). Không mã xác thực cơ quan thuế — bản demo.
 */
export async function buildEinvoiceXml(invoiceId: string): Promise<{ xml: string; qr: string } | null> {
  const inv = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { user: true, session: { include: { slot: { include: { station: true } } } } },
  });
  if (!inv) return null;

  const no = inv.invoiceNo || `EV${inv.id.slice(-8).toUpperCase()}`;
  const amount = inv.amount;
  const subtotal = inv.subtotal || amount;
  const discount = inv.discount || 0;
  const vat = 0; // dịch vụ sạc xe điện — VAT 0%
  const total = amount;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<HDon>
  <TTChung>
    <TDLHDon>01GTKT0/001</TDLHDon>
    <KHMSHDon>01GTKT0/001</KHMSHDon>
    <KHHDon>EV/23E</KHHDon>
    <SHDon>${esc(no)}</SHDon>
    <NLap>${esc(inv.createdAt.toISOString())}</NLap>
    <DVTTe>VND</DVTTe>
  </TTChung>
  <NDHDon>
    <NBan>
      <Ten>EV Charge Network</Ten>
      <MST>0312345678</MST>
      <DChi>Ho Chi Minh City, Vietnam</DChi>
    </NBan>
    <NMua>
      <Ten>${esc(inv.user.name)}</Ten>
      <MST>${esc(inv.user.email)}</MST>
    </NMua>
    <DSHHDVu>
      <HHDVu>
        <TChat>1</TChat>
        <Ten>${esc(`Sạc xe điện tại ${inv.session.slot.station.name} - trụ ${inv.session.slot.slotNumber}`)}</Ten>
        <SLuong>${esc(inv.energyKwh.toFixed(2))}</SLuong>
        <DGia>${esc(Math.round(subtotal / Math.max(inv.energyKwh, 0.001)).toFixed(0))}</DGia>
        <ThTien>${esc(subtotal.toFixed(0))}</ThTien>
      </HHDVu>
    </DSHHDVu>
    <TTCToan>
      <TgTCap>${esc((subtotal + discount).toFixed(0))}</TgTCap>
      <TGiamLai>${esc(discount.toFixed(0))}</TGiamLai>
      <TGTCTThue>${esc(vat.toFixed(0))}</TGTCTThue>
      <TTCKTMai>0</TTCKTMai>
      <TTCKhac>0</TTCKhac>
      <TGTCTThue_TTCKTMai_TTCKhac>${esc(vat.toFixed(0))}</TGTCTThue_TTCKTMai_TTCKhac>
      <TTTBSo>${esc(total.toFixed(0))}</TTTBSo>
      <TTTBTCT>${esc(total.toFixed(0))}</TTTBTCT>
    </TTCToan>
  </NDHDon>
</HDon>`;

  const qr = `EV|${no}|${inv.user.email}|${total}|${inv.id}`;
  return { xml, qr };
}