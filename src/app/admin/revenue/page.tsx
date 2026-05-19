"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

export default function AdminRevenuePage() {
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load(p: string) {
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/revenue?period=${p}`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    setData(d.data); setStats({ totalRevenue: d.totalRevenue, totalEnergy: d.totalEnergy, totalSessions: d.totalSessions });
    setLoading(false);
  }

  useEffect(() => { load(period); }, [period]);

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  return (
    <AppShell title="Báo cáo doanh thu">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Báo cáo doanh thu</h2>
          <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200">
            {[{k:"day",l:"7 ngày"},{k:"week",l:"30 ngày"},{k:"month",l:"12 tháng"}].map(p => (
              <button key={p.k} onClick={() => setPeriod(p.k as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${period === p.k ? "bg-slate-100 text-slate-800" : "text-slate-500"}`}>{p.l}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card p-6 bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <p className="text-xs opacity-80 uppercase tracking-wider">Tổng doanh thu</p>
            <p className="text-3xl font-bold mt-1">{stats?.totalRevenue.toLocaleString("vi-VN")} ₫</p>
          </div>
          <div className="card p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <p className="text-xs opacity-80 uppercase tracking-wider">Tổng năng lượng</p>
            <p className="text-3xl font-bold mt-1">{stats?.totalEnergy.toFixed(1)} kWh</p>
          </div>
          <div className="card p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white">
            <p className="text-xs opacity-80 uppercase tracking-wider">Tổng phiên</p>
            <p className="text-3xl font-bold mt-1">{stats?.totalSessions}</p>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Biểu đồ doanh thu theo {period === "day" ? "ngày" : period === "week" ? "tuần" : "tháng"}</h3>
          {loading ? <div className="skeleton h-48"></div> : data.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">Chưa có dữ liệu</p>
          ) : (
            <div className="space-y-3">
              {data.map(d => (
                <div key={d.date}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-700">{d.date}</span>
                    <span className="text-slate-600">{d.revenue.toLocaleString("vi-VN")} ₫ • {d.count} phiên • {d.energy.toFixed(1)} kWh</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-400 to-cyan-500 h-full transition-all duration-500" style={{ width: `${(d.revenue / maxRevenue) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
