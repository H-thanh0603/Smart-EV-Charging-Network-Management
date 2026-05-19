"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

export default function DriverEarningsPage() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState<"week" | "month">("week");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/sessions", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const completed = Array.isArray(d) ? d.filter((s: any) => s.status === "COMPLETED") : [];
        const now = new Date();
        const days = period === "week" ? 7 : 30;
        const grouped: Record<string, { count: number; energy: number; cost: number }> = {};
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 86400000);
          const key = `${d.getDate()}/${d.getMonth() + 1}`;
          grouped[key] = { count: 0, energy: 0, cost: 0 };
        }
        completed.forEach((s: any) => {
          const d = new Date(s.startTime);
          const key = `${d.getDate()}/${d.getMonth() + 1}`;
          if (grouped[key]) {
            grouped[key].count++;
            grouped[key].energy += s.energyKwh || 0;
            grouped[key].cost += s.invoice?.amount || 0;
          }
        });
        const items = Object.entries(grouped).map(([k, v]) => ({ date: k, ...v }));
        const total = items.reduce((s, x) => ({ count: s.count + x.count, energy: s.energy + x.energy, cost: s.cost + x.cost }), { count: 0, energy: 0, cost: 0 });
        setData({ items, total });
      });
  }, [period]);

  if (!data) return <AppShell title="Doanh thu"><div className="skeleton h-32"></div></AppShell>;
  const max = Math.max(...data.items.map((d: any) => d.energy), 1);

  return (
    <AppShell title="Doanh thu sạc">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">📊 Thống kê sạc</h2>
        <div className="flex gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          {[{k:"week",l:"7 ngày"},{k:"month",l:"30 ngày"}].map(p => (
            <button key={p.k} onClick={() => setPeriod(p.k as any)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${period === p.k ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : ""}`}>{p.l}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="card p-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <p className="text-xs opacity-80 uppercase tracking-wider">Tổng phiên</p>
          <p className="text-3xl font-bold mt-1">{data.total.count}</p>
        </div>
        <div className="card p-5 bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
          <p className="text-xs opacity-80 uppercase tracking-wider">Năng lượng</p>
          <p className="text-3xl font-bold mt-1">{data.total.energy.toFixed(1)} <span className="text-base">kWh</span></p>
        </div>
        <div className="card p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <p className="text-xs opacity-80 uppercase tracking-wider">Chi phí</p>
          <p className="text-3xl font-bold mt-1">{(data.total.cost / 1000).toFixed(0)}K ₫</p>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <h3 className="font-semibold mb-4">Năng lượng sạc theo ngày</h3>
        <div className="space-y-3">
          {data.items.filter((d: any) => d.count > 0).map((d: any) => (
            <div key={d.date}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium">{d.date}</span>
                <span style={{color:"var(--text-muted)"}}>{d.energy.toFixed(1)} kWh • {d.cost.toLocaleString("vi-VN")} ₫</span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full transition-all" style={{ width: `${(d.energy / max) * 100}%` }}></div>
              </div>
            </div>
          ))}
          {data.items.filter((d: any) => d.count > 0).length === 0 && (
            <p className="text-center py-6 text-sm" style={{color:"var(--text-muted)"}}>Chưa có dữ liệu kỳ này</p>
          )}
        </div>
      </div>

      <div className="card p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-3">
          <div className="text-3xl">💡</div>
          <div>
            <p className="font-semibold mb-1">Mẹo tiết kiệm cho tài xế Xanh SM</p>
            <p className="text-sm" style={{color:"var(--text-muted)"}}>Sạc đêm (22h - 6h) tại trạm V-GREEN giảm ~20% so với giờ cao điểm. Dùng voucher <code className="badge-yellow">XANHSM20</code> để tiết kiệm thêm.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
