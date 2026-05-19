"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";

export default function TechnicianDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const token = localStorage.getItem("token");
    const [tickets, stations] = await Promise.all([
      fetch("/api/maintenance", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/stations/live", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const myTickets = Array.isArray(tickets) ? tickets.filter((t: any) => t.assignedToId === user.id) : [];
    const open = myTickets.filter((t: any) => t.status === "OPEN");
    const inProgress = myTickets.filter((t: any) => t.status === "IN_PROGRESS");
    const resolved = myTickets.filter((t: any) => t.status === "RESOLVED");
    const critical = myTickets.filter((t: any) => t.priority === "CRITICAL" && t.status !== "RESOLVED");
    const stationsWithMaint = Array.isArray(stations) ? stations.filter((s: any) => s.maintenance > 0) : [];
    setData({ myTickets, open, inProgress, resolved, critical, stationsWithMaint });
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <AppShell title="Bảng điều khiển"><div className="skeleton h-32"></div></AppShell>;

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <AppShell title="Bảng điều khiển kỹ thuật">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Chào, {user.name?.split(" ")[0]} 🔧</h2>
        <p className="text-sm" style={{color:"var(--text-muted)"}}>Bạn có {data.open.length + data.inProgress.length} ticket đang xử lý</p>
      </div>

      {data.critical.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 text-white p-5 mb-6 shadow-2xl animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🚨</span>
            <div className="flex-1">
              <p className="font-bold text-lg">{data.critical.length} ticket CRITICAL</p>
              <p className="text-sm opacity-90">Yêu cầu xử lý ngay lập tức</p>
            </div>
            <Link href="/admin/maintenance" className="bg-white text-red-600 px-4 py-2 rounded-lg font-bold text-sm">Xử lý →</Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card p-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <p className="text-3xl font-bold">{data.open.length}</p>
          <p className="text-xs opacity-90 uppercase tracking-wider">Mở</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <p className="text-3xl font-bold">{data.inProgress.length}</p>
          <p className="text-xs opacity-90 uppercase tracking-wider">Đang xử lý</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <p className="text-3xl font-bold">{data.resolved.length}</p>
          <p className="text-xs opacity-90 uppercase tracking-wider">Hoàn thành</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-red-500 to-rose-600 text-white">
          <p className="text-3xl font-bold">{data.critical.length}</p>
          <p className="text-xs opacity-90 uppercase tracking-wider">Critical</p>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">📋 Việc cần làm hôm nay</h3>
          <Link href="/admin/maintenance" className="text-sm text-orange-600 hover:underline font-semibold">Tất cả →</Link>
        </div>
        {data.open.length === 0 && data.inProgress.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-sm" style={{color:"var(--text-muted)"}}>Tất cả việc đã hoàn thành. Nghỉ ngơi nhé!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...data.inProgress, ...data.open].slice(0, 5).map((t: any) => (
              <Link key={t.id} href={`/admin/maintenance`} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <div className={`w-1 self-stretch rounded-full ${t.priority === "CRITICAL" ? "bg-red-500" : t.priority === "HIGH" ? "bg-orange-500" : t.priority === "MEDIUM" ? "bg-amber-400" : "bg-slate-300"}`}></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{t.title}</p>
                  <div className="flex items-center gap-2 text-xs mt-1">
                    <span className={t.status === "IN_PROGRESS" ? "badge-blue" : "badge-yellow"}>{t.status === "IN_PROGRESS" ? "🔧 Đang xử lý" : "📋 Chờ"}</span>
                    <span style={{color:"var(--text-muted)"}}>📍 {t.station?.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {data.stationsWithMaint.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold mb-3">🏢 Trạm có trụ đang bảo trì</h3>
          <div className="space-y-2">
            {data.stationsWithMaint.slice(0, 4).map((s: any) => (
              <Link key={s.id} href={`/stations/${s.id}`} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                {s.thumbnailUrl && <img src={s.thumbnailUrl} className="w-12 h-12 rounded-lg object-cover" alt="" />}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{s.name}</p>
                  <p className="text-xs" style={{color:"var(--text-muted)"}}>{s.maintenance} trụ bảo trì • {s.available}/{s.total} trụ trống</p>
                </div>
                <span className="text-xl">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
