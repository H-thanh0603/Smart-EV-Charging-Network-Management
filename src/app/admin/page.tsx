"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user || JSON.parse(user).role !== "ADMIN") { router.push("/stations"); return; }
    const token = localStorage.getItem("token");
    fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setStats(d); setLoading(false); });
  }, []);

  const fmt = (t: string) => new Date(t).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

  return (
    <AppShell title="Admin Dashboard">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Tổng quan hệ thống quản lý sạc xe điện</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-28"></div>)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {[
                { l:"Người dùng", v:stats?.totalUsers, i:"👤", c:"from-blue-500 to-cyan-500" },
                { l:"Trạm sạc", v:stats?.totalStations, i:"🏢", c:"from-emerald-500 to-teal-500" },
                { l:"Trụ sạc", v:stats?.totalSlots, i:"🔌", c:"from-purple-500 to-indigo-500" },
                { l:"Đang sạc", v:stats?.activeSessions, i:"⚡", c:"from-amber-500 to-orange-500" },
                { l:"Doanh thu", v:(stats?.totalRevenue || 0).toLocaleString("vi-VN") + " ₫", i:"💰", c:"from-rose-500 to-pink-500" },
              ].map(card => (
                <div key={card.l} className="card p-4 hover:shadow-md transition">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.c} flex items-center justify-center text-white text-xl mb-3`}>{card.i}</div>
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">{card.l}</p>
                  <p className="text-xl font-bold text-slate-800 mt-1 truncate">{card.v}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {[
                { href:"/admin/stations", icon:"🏢", label:"Quản lý trạm", desc:"Trạm và trụ sạc" },
                { href:"/admin/users", icon:"👥", label:"Người dùng", desc:"Khách hàng & nhân viên" },
                { href:"/admin/maintenance", icon:"🔧", label:"Bảo trì", desc:"Tickets & sửa chữa" },
                { href:"/admin/tariffs", icon:"💡", label:"Giá điện", desc:"Khung giờ tariff" },
                { href:"/admin/revenue", icon:"📊", label:"Doanh thu", desc:"Báo cáo doanh thu" },
                { href:"/admin/webhooks", icon:"🔌", label:"API & Webhook", desc:"Tích hợp đối tác" },
              ].map(item => (
                <Link key={item.href} href={item.href}>
                  <div className="card-hover p-5 cursor-pointer">
                    <div className="text-3xl mb-3">{item.icon}</div>
                    <p className="font-semibold text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Phiên sạc gần đây</h3>
                <Link href="/admin/revenue" className="text-sm text-emerald-600 hover:underline">Xem tất cả →</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-100">
                      <th className="pb-3 pr-4 text-xs uppercase font-semibold tracking-wider">Khách hàng</th>
                      <th className="pb-3 pr-4 text-xs uppercase font-semibold tracking-wider">Trạm/Trụ</th>
                      <th className="pb-3 pr-4 text-xs uppercase font-semibold tracking-wider">Bắt đầu</th>
                      <th className="pb-3 text-xs uppercase font-semibold tracking-wider">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.recentSessions?.map((s: any) => (
                      <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <td className="py-3 pr-4 font-medium">{s.user.name}</td>
                        <td className="py-3 pr-4 text-slate-600">{s.slot.station.name} / Trụ {s.slot.slotNumber}</td>
                        <td className="py-3 pr-4 text-slate-600">{fmt(s.startTime)}</td>
                        <td className="py-3"><span className={s.status === "ACTIVE" ? "badge-green" : "badge-gray"}>{s.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
