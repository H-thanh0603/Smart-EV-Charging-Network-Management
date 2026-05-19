"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");

  async function load() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/vouchers", { headers: { Authorization: `Bearer ${token}` } });
    setVouchers(await res.json()); setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function copy(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  }

  return (
    <AppShell title="Voucher">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">🎟️ Mã giảm giá</h2>
          <p className="text-sm" style={{color:"var(--text-muted)"}}>Áp dụng khi thanh toán hoá đơn</p>
        </div>

        {loading ? <div className="skeleton h-32"></div> : vouchers.length === 0 ? (
          <div className="card p-12 text-center" style={{color:"var(--text-muted)"}}>
            <div className="text-5xl mb-3">🎟️</div>
            <p>Chưa có voucher nào hiện hành</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vouchers.map(v => {
              const expDays = Math.floor((new Date(v.validUntil).getTime() - Date.now()) / 86400000);
              const used = v.usageLimit ? v.usedCount / v.usageLimit : 0;
              return (
                <div key={v.id} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-white p-6 shadow-lg">
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full"></div>
                  <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full"></div>
                  <div className="relative">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-3xl">🎟️</span>
                      <span className="text-xs bg-white/20 backdrop-blur px-2 py-0.5 rounded-full">
                        {v.type === "PERCENT" ? `${v.value}%` : `${(v.value/1000).toFixed(0)}k`}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg leading-tight mb-1">{v.name}</h3>
                    {v.description && <p className="text-xs opacity-90 mb-3">{v.description}</p>}

                    <div className="bg-white/10 backdrop-blur rounded-lg p-3 mb-3 border border-white/20 border-dashed">
                      <p className="text-xs opacity-75 mb-1">Mã code</p>
                      <div className="flex items-center justify-between">
                        <code className="font-mono font-bold text-lg tracking-wider">{v.code}</code>
                        <button onClick={() => copy(v.code)} className="bg-white text-amber-600 px-2 py-1 rounded text-xs font-semibold hover:bg-amber-50">
                          {copied === v.code ? "✓ Đã copy" : "Copy"}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs opacity-90">
                      {v.minAmount > 0 && <p>• Đơn tối thiểu {v.minAmount.toLocaleString("vi-VN")} ₫</p>}
                      {v.maxDiscount && <p>• Giảm tối đa {v.maxDiscount.toLocaleString("vi-VN")} ₫</p>}
                      <p>• {expDays > 0 ? `Còn ${expDays} ngày` : "Hết hạn hôm nay"}</p>
                      {v.usageLimit && <p>• Còn {Math.max(0, v.usageLimit - v.usedCount)}/{v.usageLimit} lượt</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
