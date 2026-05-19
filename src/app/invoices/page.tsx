"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPay, setShowPay] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherInfo, setVoucherInfo] = useState<any>(null);
  const [voucherError, setVoucherError] = useState("");

  async function load() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/invoices", { headers: { Authorization: `Bearer ${token}` } });
    setInvoices(await res.json()); setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function checkVoucher(amount: number) {
    setVoucherError(""); setVoucherInfo(null);
    if (!voucherCode) return;
    const token = localStorage.getItem("token");
    const res = await fetch("/api/vouchers/validate", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: voucherCode, amount })
    });
    const d = await res.json();
    if (!d.valid) setVoucherError(d.error);
    else setVoucherInfo(d);
  }

  async function pay(id: string) {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/invoices/${id}/pay`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ method: "wallet", voucherCode: voucherInfo ? voucherCode : undefined })
    });
    const d = await res.json();
    if (!res.ok) { alert(d.error); return; }
    setShowPay(null); setVoucherCode(""); setVoucherInfo(null);
    load();
  }

  const fmt = (t: string) => new Date(t).toLocaleDateString("vi-VN");

  return (
    <AppShell title="Hoá đơn">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Hoá đơn ({invoices.length})</h2>

        {loading ? <div className="skeleton h-32"></div> : invoices.length === 0 ? (
          <div className="card p-12 text-center"><div className="text-5xl mb-3">🧾</div><p style={{color:"var(--text-muted)"}}>Chưa có hoá đơn nào</p></div>
        ) : (
          <div className="space-y-3">
            {invoices.map(inv => {
              const isPay = showPay === inv.id;
              const finalAmount = voucherInfo && isPay ? inv.amount - voucherInfo.discount : inv.amount;
              return (
                <div key={inv.id} className="card p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{inv.session.slot.station.name}</h3>
                      <p className="text-sm" style={{color:"var(--text-muted)"}}>Trụ {inv.session.slot.slotNumber} • {fmt(inv.createdAt)}</p>
                    </div>
                    <span className={inv.status === "PAID" ? "badge-green" : "badge-yellow"}>
                      {inv.status === "PAID" ? "✓ Đã thanh toán" : "Chưa thanh toán"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div><p className="text-xs" style={{color:"var(--text-muted)"}}>Năng lượng</p><p className="font-medium">{inv.energyKwh.toFixed(2)} kWh</p></div>
                    <div><p className="text-xs" style={{color:"var(--text-muted)"}}>Số tiền</p><p className="font-bold text-emerald-600">{inv.amount.toLocaleString("vi-VN")} ₫</p></div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-3" style={{borderTop:"1px solid var(--border)"}}>
                    <Link href={`/invoices/${inv.id}/print`} className="btn-secondary text-xs">🖨 In / PDF</Link>
                    {inv.status === "UNPAID" && (
                      <button onClick={() => { setShowPay(isPay ? null : inv.id); setVoucherCode(""); setVoucherInfo(null); setVoucherError(""); }} className="btn-primary text-xs">
                        {isPay ? "Đóng" : "💳 Thanh toán bằng ví"}
                      </button>
                    )}
                  </div>
                  {isPay && (
                    <div className="mt-3 pt-3 animate-fadeIn" style={{borderTop:"1px solid var(--border)"}}>
                      <div className="flex gap-2 mb-3">
                        <input type="text" value={voucherCode} onChange={e => setVoucherCode(e.target.value.toUpperCase())} placeholder="Nhập mã voucher (tuỳ chọn)" className="input flex-1" />
                        <button onClick={() => checkVoucher(inv.amount)} className="btn-secondary text-sm">Áp dụng</button>
                      </div>
                      {voucherError && <p className="text-xs text-red-500 mb-2">⚠️ {voucherError}</p>}
                      {voucherInfo && <p className="text-xs text-emerald-600 mb-2">✓ Voucher hợp lệ — giảm {voucherInfo.discount.toLocaleString("vi-VN")} ₫</p>}
                      <div className="flex justify-between text-sm mb-2">
                        <span style={{color:"var(--text-muted)"}}>Tạm tính</span><span>{inv.amount.toLocaleString("vi-VN")} ₫</span>
                      </div>
                      {voucherInfo && <div className="flex justify-between text-sm text-emerald-600 mb-2"><span>Giảm</span><span>-{voucherInfo.discount.toLocaleString("vi-VN")} ₫</span></div>}
                      <div className="flex justify-between font-bold mb-3"><span>Tổng</span><span className="text-emerald-600">{finalAmount.toLocaleString("vi-VN")} ₫</span></div>
                      <button onClick={() => pay(inv.id)} className="btn-primary w-full">Thanh toán {finalAmount.toLocaleString("vi-VN")} ₫</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
