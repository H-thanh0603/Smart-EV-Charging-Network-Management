"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

export default function AdminStationsPage() {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/stations", { headers: { Authorization: `Bearer ${token}` } });
    setStations(await res.json()); setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggle(id: string, current: string) {
    const token = localStorage.getItem("token");
    const newStatus = current === "ACTIVE" ? "MAINTENANCE" : "ACTIVE";
    await fetch(`/api/stations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus })
    });
    load();
  }

  return (
    <AppShell title="Quản lý trạm">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Quản lý trạm sạc</h2>
        {loading ? <div className="skeleton h-64"></div> : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left">
                  <th className="px-6 py-3 text-xs uppercase font-semibold tracking-wider text-slate-500">Tên trạm</th>
                  <th className="px-6 py-3 text-xs uppercase font-semibold tracking-wider text-slate-500">Địa chỉ</th>
                  <th className="px-6 py-3 text-xs uppercase font-semibold tracking-wider text-slate-500">Trụ</th>
                  <th className="px-6 py-3 text-xs uppercase font-semibold tracking-wider text-slate-500">Trạng thái</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {stations.map(s => (
                  <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">⚡</div>
                        <span className="font-medium">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{s.address}, {s.city}</td>
                    <td className="px-6 py-4 font-medium">{s.slots?.length || 0}</td>
                    <td className="px-6 py-4"><span className={s.status === "ACTIVE" ? "badge-green" : "badge-yellow"}>{s.status}</span></td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => toggle(s.id, s.status)} className="text-xs text-blue-600 hover:underline font-medium">
                        {s.status === "ACTIVE" ? "Bảo trì" : "Kích hoạt"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
