"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";

export default function DriverDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    Promise.all([
      fetch("/api/wallet", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/sessions", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/vehicles", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([wallet, sessions, vehicles]) => {
      const completed = Array.isArray(sessions) ? sessions.filter((s: any) => s.status === "COMPLETED") : [];
      const totalEnergy = completed.reduce((s: number, x: any) => s + (x.energyKwh || 0), 0);
      const today = completed.filter((s: any) => {
        const d = new Date(s.startTime); const t = new Date();
        return d.toDateString() === t.toDateString();
      });
      setData({ wallet, sessions: completed, vehicles, todayCount: today.length, totalEnergy });
      setLoading(false);
    });
  }, []);

  if (loading) return <AppShell title="Tổng quan"><div className="skeleton h-48"></div></AppShell>;

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const greeting = (() => { const h = new Date().getHours(); return h < 11 ? "Chào buổi sáng" : h < 14 ? "Chào buổi trưa" : h < 18 ? "Chào buổi chiều" : "Chào buổi tối"; })();

  return (
    <AppShell title="Tổng quan">
      <div className="mb-6">
        <p className="text-sm" style={{color:"var(--text-muted)"}}>{greeting},</p>
        <h2 className="text-2xl font-bold">{user.name?.split(" (")[0]} 👋</h2>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 text-white p-6 mb-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs opacity-80 uppercase tracking-wider mb-1">Số dư ví Xanh SM</p>
              <p className="text-3xl font-bold">{data?.wallet?.wallet?.balance?.toLocaleString("vi-VN") || 0} ₫</p>
            </div>
            <span className="text-3xl">💳</span>
          </div>
          <div className="flex gap-2 mt-4">
            <Link href="/wallet" className="flex-1 bg-white/20 backdrop-blur text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/30 text-center">Nạp tiền</Link>
            <Link href="/stations" className="flex-1 bg-white text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-50 text-center">Sạc ngay →</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl mb-1">⚡</p>
          <p className="text-2xl font-bold">{data?.todayCount || 0}</p>
          <p className="text-xs" style={{color:"var(--text-muted)"}}>Sạc hôm nay</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl mb-1">🔋</p>
          <p className="text-2xl font-bold">{(data?.totalEnergy || 0).toFixed(0)}</p>
          <p className="text-xs" style={{color:"var(--text-muted)"}}>kWh tổng</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl mb-1">⭐</p>
          <p className="text-2xl font-bold">{user.loyaltyTier || "BRONZE"}</p>
          <p className="text-xs" style={{color:"var(--text-muted)"}}>{user.loyaltyPoints || 0} pts</p>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Xe của tôi</h3>
          <Link href="/driver/vehicles" className="text-sm text-emerald-600 hover:underline">Quản lý →</Link>
        </div>
        {data?.vehicles?.length === 0 ? (
          <p className="text-sm text-center py-4" style={{color:"var(--text-muted)"}}>Chưa có xe — Thêm xe để theo dõi sạc</p>
        ) : (
          <div className="space-y-2">
            {data?.vehicles?.slice(0, 2).map((v: any) => (
              <div key={v.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-600 rounded-lg flex items-center justify-center text-white text-xl">🚗</div>
                <div className="flex-1">
                  <p className="font-semibold">{v.brand} {v.model}</p>
                  <p className="text-xs" style={{color:"var(--text-muted)"}}>{v.licensePlate} • {v.connectorType} • {v.batteryKwh} kWh</p>
                </div>
                {v.fleet && <span className="badge-purple">🏢 {v.fleet.code}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/scan" className="card p-4 text-center hover:scale-105 transition group">
          <div className="text-3xl mb-2 group-hover:scale-110 transition">📷</div>
          <p className="font-semibold text-sm">Quét QR sạc</p>
        </Link>
        <Link href="/driver/earnings" className="card p-4 text-center hover:scale-105 transition group">
          <div className="text-3xl mb-2 group-hover:scale-110 transition">📊</div>
          <p className="font-semibold text-sm">Doanh thu</p>
        </Link>
      </div>
    </AppShell>
  );
}
