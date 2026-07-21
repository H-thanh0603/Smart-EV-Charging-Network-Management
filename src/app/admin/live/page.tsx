"use client";
import { useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";

type Slot = { id: string; status: string; connectorType: string; powerKw: number; slotNumber: string };
type LiveStation = {
  id: string; name: string; address: string; city: string;
  total: number; available: number; occupied: number; maintenance: number;
  occupancyRate: number; status: "FULL" | "BUSY" | "FREE";
  slots: Slot[];
  activeSessions: { slotNumber: string; elapsedMin: number; remainingMin: number }[];
};

const SLOT_STYLE: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700 border-emerald-300",
  OCCUPIED: "bg-amber-100 text-amber-700 border-amber-300",
  CHARGING: "bg-blue-100 text-blue-700 border-blue-300",
  MAINTENANCE: "bg-rose-100 text-rose-700 border-rose-300",
};
const SLOT_LABEL: Record<string, string> = {
  AVAILABLE: "Trống", OCCUPIED: "Đang dùng", CHARGING: "Đang sạc", MAINTENANCE: "Bảo trì",
};

export default function AdminLivePage() {
  const [stations, setStations] = useState<LiveStation[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // EventSource gửi cookie ev_token tự động (same-origin)
    const es = new EventSource("/api/stations/live/stream");
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.addEventListener("stations", (e) => {
      try {
        setStations(JSON.parse((e as MessageEvent).data));
        setLastUpdate(new Date());
        setConnected(true);
      } catch { /* ignore */ }
    });
    es.onerror = () => {
      setConnected(false);
      // EventSource tự reconnect; không cần xử lý thêm
    };

    return () => es.close();
  }, []);

  const totals = stations.reduce(
    (acc, s) => {
      acc.total += s.total; acc.available += s.available;
      acc.occupied += s.occupied; acc.maintenance += s.maintenance;
      return acc;
    },
    { total: 0, available: 0, occupied: 0, maintenance: 0 }
  );

  return (
    <AppShell title="Giám sát realtime">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-slate-800">Giám sát trạm sạc (realtime)</h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
              <span className={connected ? "text-emerald-600 font-medium" : "text-slate-400"}>
                {connected ? "Đang kết nối SSE" : "Mất kết nối..."}
              </span>
            </span>
            {lastUpdate && (
              <span className="text-slate-400">Cập nhật: {lastUpdate.toLocaleTimeString("vi-VN")}</span>
            )}
          </div>
        </div>

        {/* Tổng quan */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-5"><p className="text-xs text-slate-500 uppercase">Tổng trụ</p><p className="text-2xl font-bold text-slate-800 mt-1">{totals.total}</p></div>
          <div className="card p-5"><p className="text-xs text-slate-500 uppercase">Trống</p><p className="text-2xl font-bold text-emerald-600 mt-1">{totals.available}</p></div>
          <div className="card p-5"><p className="text-xs text-slate-500 uppercase">Đang dùng/sạc</p><p className="text-2xl font-bold text-blue-600 mt-1">{totals.occupied}</p></div>
          <div className="card p-5"><p className="text-xs text-slate-500 uppercase">Bảo trì</p><p className="text-2xl font-bold text-rose-600 mt-1">{totals.maintenance}</p></div>
        </div>

        {stations.length === 0 ? (
          <div className="card p-10 text-center text-slate-400 text-sm">Đang chờ dữ liệu realtime...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {stations.map((s) => (
              <div key={s.id} className="card p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">{s.name}</h3>
                    <p className="text-xs text-slate-500">{s.address}, {s.city}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    s.status === "FREE" ? "bg-emerald-100 text-emerald-700"
                    : s.status === "BUSY" ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-700"}`}>
                    {s.status === "FREE" ? "Còn chỗ" : s.status === "BUSY" ? "Sắp đầy" : "Hết chỗ"} • {s.occupancyRate}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.slots.map((sl) => (
                    <div key={sl.id}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border ${SLOT_STYLE[sl.status] || "bg-slate-100 text-slate-600 border-slate-300"}`}
                      title={`${sl.connectorType} • ${sl.powerKw}kW`}>
                      <span className="font-semibold">{sl.slotNumber}</span>
                      <span className="opacity-70"> · {SLOT_LABEL[sl.status] || sl.status}</span>
                    </div>
                  ))}
                </div>
                {s.activeSessions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                    {s.activeSessions.map((a, i) => (
                      <div key={i} className="flex justify-between">
                        <span>Trụ {a.slotNumber} đang sạc {a.elapsedMin}′</span>
                        <span className="text-blue-500">còn ~{a.remainingMin}′</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
