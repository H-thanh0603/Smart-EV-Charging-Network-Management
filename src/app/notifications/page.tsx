"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";

export default function NotificationsPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setList(d); setLoading(false); });
  }, []);

  async function markRead(id: string) {
    const token = localStorage.getItem("token");
    await fetch(`/api/notifications/${id}/read`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    setList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  const fmt = (t: string) => new Date(t).toLocaleString("vi-VN");
  const unread = list.filter(n => !n.read).length;

  return (
    <AppShell title="Thông báo">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Thông báo</h2>
            <p className="text-sm text-slate-500 mt-1">{unread > 0 ? `${unread} chưa đọc` : "Tất cả đã đọc"}</p>
          </div>
        </div>

        {loading ? <div className="skeleton h-32"></div> : list.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-3">🔔</div>
            <p className="font-medium text-slate-700">Chưa có thông báo</p>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map(n => (
              <div key={n.id} onClick={() => !n.read && markRead(n.id)}
                className={`card p-4 cursor-pointer transition ${n.read ? "opacity-70" : "border-l-4 border-l-emerald-500"}`}>
                <div className="flex justify-between items-start gap-3 mb-1">
                  <span className={n.type === "ALERT" ? "badge-red" : n.type === "WARNING" ? "badge-yellow" : "badge-blue"}>
                    {n.type}
                  </span>
                  {!n.read && <span className="w-2 h-2 bg-emerald-500 rounded-full mt-1"></span>}
                </div>
                <h3 className="font-medium text-slate-800">{n.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-slate-400">{fmt(n.createdAt)}</p>
                  {n.link && <Link href={n.link} className="text-xs text-emerald-600 hover:underline">Xem chi tiết →</Link>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
