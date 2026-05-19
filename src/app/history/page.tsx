"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

export default function HistoryPage() {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/sessions/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        setData(d.data);
        setStats({ totalEnergy: d.totalEnergy, totalSessions: d.totalSessions });
        setLoading(false);
      });
  }, []);

  const maxEnergy = Math.max(...data.map(d => d.energy), 1);
  const totalCost = data.reduce((s, d) => s + d.cost, 0);

  return (
    <AppShell title="Lịch sử sạc">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Tổng quan tiêu thụ điện</h2>

        {loading ? <div className="skeleton h-48"></div> : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="card p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
                <div className="text-3xl mb-2">⚡</div>
                <p className="text-xs text-emerald-700 uppercase font-semibold tracking-wider">Tổng năng lượng</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{stats?.totalEnergy.toFixed(1)} kWh</p>
                <p className="text-xs text-slate-500 mt-1">12 tháng qua</p>
              </div>
              <div className="card p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
                <div className="text-3xl mb-2">📊</div>
                <p className="text-xs text-blue-700 uppercase font-semibold tracking-wider">Tổng phiên</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{stats?.totalSessions}</p>
                <p className="text-xs text-slate-500 mt-1">Phiên đã hoàn thành</p>
              </div>
              <div className="card p-5 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
                <div className="text-3xl mb-2">💰</div>
                <p className="text-xs text-purple-700 uppercase font-semibold tracking-wider">Tổng chi phí</p>
                <p className="text-2xl font-bold text-purple-700 mt-1">{totalCost.toLocaleString("vi-VN")} ₫</p>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Tiêu thụ theo tháng</h3>
              {data.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-sm">Chưa có dữ liệu</p>
              ) : (
                <div className="space-y-4">
                  {data.map(d => (
                    <div key={d.month}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-slate-700">{d.month}</span>
                        <span className="text-slate-600">{d.energy.toFixed(1)} kWh • {d.cost.toLocaleString("vi-VN")} ₫ • {d.count} phiên</span>
                      </div>
                      <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full transition-all duration-500" style={{ width: `${(d.energy / maxEnergy) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
