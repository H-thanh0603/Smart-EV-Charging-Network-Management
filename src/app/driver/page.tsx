"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";

export default function DriverDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [suggested, setSuggested] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    const token = localStorage.getItem("token");
    const [w, s, v, sugg] = await Promise.all([
      fetch("/api/wallet", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/sessions", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/vehicles", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/stations/suggest", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]);
    const completed = Array.isArray(s) ? s.filter((x: any) => x.status === "COMPLETED") : [];
    const active = Array.isArray(s) ? s.find((x: any) => x.status === "ACTIVE") : null;
    const totalEnergy = completed.reduce((sum: number, x: any) => sum + (x.energyKwh || 0), 0);
    const today = completed.filter((x: any) => new Date(x.startTime).toDateString() === new Date().toDateString());
    setData({ wallet: w, sessions: completed, active, vehicles: v, todayCount: today.length, totalEnergy });
    setSuggested(Array.isArray(sugg) ? sugg : []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 20000);
    return () => clearInterval(interval);
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

      {data?.active && (
        <Link href="/sessions" className="block mb-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 text-white p-5 shadow-2xl animate-pulse">
            <div className="flex items-center gap-4">
              <div className="text-5xl">⚡</div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider opacity-90">Đang sạc</p>
                <p className="font-bold text-lg">{data.active.slot?.station?.name || "Trụ sạc"}</p>
                <p className="text-sm opacity-90">Bắt đầu lúc {new Date(data.active.startTime).toLocaleTimeString("vi-VN", {hour:"2-digit",minute:"2-digit"})}</p>
              </div>
              <span className="text-2xl">→</span>
            </div>
          </div>
        </Link>
      )}

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
            <Link href="/scan" className="flex-1 bg-white text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-50 text-center">⚡ Quét QR sạc</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-4 text-center"><p className="text-2xl mb-1">⚡</p><p className="text-2xl font-bold">{data?.todayCount || 0}</p><p className="text-xs" style={{color:"var(--text-muted)"}}>Hôm nay</p></div>
        <div className="card p-4 text-center"><p className="text-2xl mb-1">🔋</p><p className="text-2xl font-bold">{(data?.totalEnergy || 0).toFixed(0)}</p><p className="text-xs" style={{color:"var(--text-muted)"}}>kWh tổng</p></div>
        <div className="card p-4 text-center"><p className="text-2xl mb-1">⭐</p><p className="text-2xl font-bold">{user.loyaltyTier || "BRONZE"}</p><p className="text-xs" style={{color:"var(--text-muted)"}}>{user.loyaltyPoints || 0} pt</p></div>
      </div>

      {suggested.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">🔥 Trạm sạc gợi ý</h3>
            <Link href="/stations" className="text-sm text-emerald-600 hover:underline">Xem tất cả →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggested.slice(0, 4).map(s => (
              <Link key={s.id} href={`/stations/${s.id}`} className="card overflow-hidden hover:scale-105 transition group">
                {s.thumbnailUrl && <div className="relative h-28 overflow-hidden">
                  <img src={s.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-md font-bold ${s.available > 0 ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>● {s.available}/{s.total}</span>
                  {s.isPremium && <span className="absolute top-2 left-2 bg-gradient-to-r from-amber-400 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">⭐</span>}
                </div>}
                <div className="p-3">
                  <p className="font-semibold text-sm group-hover:text-emerald-600 line-clamp-1">{s.name}</p>
                  <p className="text-xs flex items-center gap-2" style={{color:"var(--text-muted)"}}>
                    <span>📍 {s.distance} km</span>
                    {(s.rating || 0) > 0 && <span className="text-amber-500">★ {s.rating.toFixed(1)}</span>}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="card p-5 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">🚗 Xe của tôi</h3>
          <Link href="/driver/vehicles" className="text-sm text-emerald-600 hover:underline">Quản lý →</Link>
        </div>
        {data?.vehicles?.length === 0 ? (
          <p className="text-sm text-center py-4" style={{color:"var(--text-muted)"}}>Thêm xe để theo dõi sạc</p>
        ) : (
          <div className="space-y-2">
            {data?.vehicles?.slice(0, 2).map((v: any) => (
              <div key={v.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-600 rounded-lg flex items-center justify-center text-white text-xl">🚗</div>
                <div className="flex-1">
                  <p className="font-semibold">{v.brand} {v.model}</p>
                  <p className="text-xs" style={{color:"var(--text-muted)"}}>{v.licensePlate} • {v.connectorType} • {v.batteryKwh} kWh</p>
                </div>
                {v.fleet && <span className="badge-purple">🏢 -{v.fleet.discountRate}%</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
