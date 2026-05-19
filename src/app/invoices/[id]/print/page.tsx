"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function InvoicePrintPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`/api/invoices/${params.id}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setData(d));
  }, [params.id]);

  function handlePrint() { window.print(); }

  if (!data) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  const inv = data.invoice;

  return (
    <div className="min-h-screen bg-white text-slate-900 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white">
        <div className="mb-6 no-print flex justify-between items-center">
          <a href="/invoices" className="text-emerald-600 hover:underline text-sm">← Quay lại hoá đơn</a>
          <button onClick={handlePrint} className="btn-primary">🖨 In / Lưu PDF</button>
        </div>

        <div className="border-2 border-slate-200 rounded-2xl p-8 print:border-0 print:p-4">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center text-white text-xl">⚡</div>
                <span className="font-bold text-xl">EV Charge</span>
              </div>
              <p className="text-sm text-slate-500">Smart EV Charging Network</p>
              <p className="text-xs text-slate-400 mt-1">Ho Chi Minh City, Vietnam</p>
              <p className="text-xs text-slate-400">support@evcharge.com</p>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold mb-1">HOÁ ĐƠN</h1>
              <p className="font-mono text-sm text-slate-500">#{data.invoiceNo}</p>
              <p className={`text-xs mt-1 inline-block px-2 py-0.5 rounded ${inv.status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {inv.status === "PAID" ? "✓ Đã thanh toán" : "Chưa thanh toán"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-200">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Khách hàng</p>
              <p className="font-semibold">{inv.user.name}</p>
              <p className="text-sm text-slate-500">{inv.user.email}</p>
              {inv.user.phone && <p className="text-sm text-slate-500">{inv.user.phone}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Ngày phát hành</p>
              <p className="font-semibold">{new Date(inv.createdAt).toLocaleDateString("vi-VN")}</p>
              {inv.paidAt && <>
                <p className="text-xs text-slate-400 uppercase tracking-wider mt-2 mb-1">Ngày thanh toán</p>
                <p className="font-semibold">{new Date(inv.paidAt).toLocaleDateString("vi-VN")}</p>
              </>}
            </div>
          </div>

          <div className="mb-6 pb-6 border-b border-slate-200">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Chi tiết phiên sạc</p>
            <p className="font-semibold mb-1">{inv.session.slot.station.name}</p>
            <p className="text-sm text-slate-500">{inv.session.slot.station.address}</p>
            <p className="text-sm text-slate-500">Trụ {inv.session.slot.slotNumber} • {inv.session.slot.connectorType} • {inv.session.slot.powerKw} kW</p>
            <div className="grid grid-cols-2 mt-3 text-sm gap-2">
              <div><span className="text-slate-500">Bắt đầu:</span> <span className="font-medium">{new Date(inv.session.startTime).toLocaleString("vi-VN")}</span></div>
              <div><span className="text-slate-500">Kết thúc:</span> <span className="font-medium">{inv.session.endTime ? new Date(inv.session.endTime).toLocaleString("vi-VN") : "—"}</span></div>
            </div>
          </div>

          <table className="w-full mb-6">
            <thead>
              <tr className="border-b-2 border-slate-200 text-sm">
                <th className="text-left py-2">Mô tả</th>
                <th className="text-right py-2">SL</th>
                <th className="text-right py-2">Đơn giá</th>
                <th className="text-right py-2">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-3">
                  <p className="font-medium">Sạc xe điện</p>
                  <p className="text-xs text-slate-500">Tại {inv.session.slot.station.name}</p>
                </td>
                <td className="text-right">{inv.energyKwh.toFixed(2)} kWh</td>
                <td className="text-right text-sm">{inv.subtotal && inv.energyKwh ? Math.round(inv.subtotal / inv.energyKwh).toLocaleString("vi-VN") : "—"} ₫</td>
                <td className="text-right font-semibold">{(inv.subtotal || inv.amount).toLocaleString("vi-VN")} ₫</td>
              </tr>
            </tbody>
          </table>

          <div className="ml-auto max-w-xs space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Tạm tính</span>
              <span>{(inv.subtotal || inv.amount).toLocaleString("vi-VN")} ₫</span>
            </div>
            {inv.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Giảm giá {inv.voucherCode ? `(${inv.voucherCode})` : ""}</span>
                <span>-{inv.discount.toLocaleString("vi-VN")} ₫</span>
              </div>
            )}
            {inv.pointsRedeemed > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Đổi điểm ({inv.pointsRedeemed} pts)</span>
                <span>-{(inv.pointsRedeemed * 100).toLocaleString("vi-VN")} ₫</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 flex justify-between text-lg font-bold">
              <span>Tổng cộng</span>
              <span className="text-emerald-600">{inv.amount.toLocaleString("vi-VN")} ₫</span>
            </div>
            {inv.pointsEarned > 0 && (
              <div className="flex justify-between text-xs text-amber-600 pt-1">
                <span>Điểm thưởng nhận được</span>
                <span>+{inv.pointsEarned} pts</span>
              </div>
            )}
          </div>

          <div className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
            <p className="mb-1">Cảm ơn quý khách đã sử dụng EV Charge.</p>
            <p>Mọi thắc mắc liên hệ: support@evcharge.com</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .btn-primary { display: none; }
        }
      `}</style>
    </div>
  );
}
