"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/sessions", { headers: { Authorization: `Bearer ${token}` } });
    setSessions(await res.json()); setLoading(false);
  }

  useEffect(() => {
    load();
    // Poll every 10s for active sessions
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  async function stop(id: string) {
    if (!confirm("Dừng phiên sạc này?")) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/sessions/${id}/stop`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    if (!res.ok) { alert(d.error); return; }
    alert(`Phiên sạc kết thúc!\n${d.invoice.energyKwh} kWh • ${d.invoice.amount.toLocaleString("vi-VN")} ₫\n+${d.pointsEarned} điểm thưởng`);
    router.push("/invoices");
  }

  const fmt = (t: string) => new Date(t).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
  const dur = (s: string, e?: string) => {
    const ms = (e ? new Date(e) : new Date()).getTime() - new Date(s).getTime();
    const m = Math.floor(ms / 60000);
    return `${Math.floor(m/60)}h ${m%60}p`;
  };

  // simulated kWh (matches stop logic): durationHours × powerKw × 0.9
  const simulatedKwh = (s: any) => {
    const h = (Date.now() - new Date(s.startTime).getTime()) / 3600000;
    return (h * s.slot.powerKw * 0.9).toFixed(2);
  };

  const active = sessions.filter(s => s.status === "ACTIVE");
  const completed = sessions.filter(s => s.status === "COMPLETED");

  return (
    <AppShell title="Phiên sạc">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Phiên sạc</h2>

        <div className="card p-3 mb-6 bg-amber-50 border-amber-200">
          <p className="text-xs text-amber-800">
            ℹ️ <strong>Demo mode:</strong> Năng lượng (kWh) được mô phỏng theo công thức <code className="bg-white px-1 rounded">thời_gian × công_suất × 0.9</code>.
            Hệ thống thật dùng OCPP 1.6/2.0 để đọc dữ liệu meter realtime từ trụ qua WebSocket (MeterValues mỗi 15s).
          </p>
        </div>

        {active.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Đang sạc
            </h3>
            <div className="space-y-3">
              {active.map(s => (
                <div key={s.id} className="card p-6 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white animate-pulse-glow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-slate-800 text-lg">{s.slot.station.name}</h4>
                      <p className="text-sm text-slate-500">Trụ {s.slot.slotNumber} • {s.slot.powerKw}kW</p>
                    </div>
                    <span className="badge-green">⚡ Đang sạc</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white rounded-lg p-3 border border-emerald-100">
                      <p className="text-xs text-slate-500">Bắt đầu</p>
                      <p className="font-semibold text-sm text-slate-800">{fmt(s.startTime)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-emerald-100">
                      <p className="text-xs text-slate-500">Thời gian</p>
                      <p className="font-semibold text-sm text-slate-800">{dur(s.startTime)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-emerald-100">
                      <p className="text-xs text-slate-500">~ kWh hiện tại</p>
                      <p className="font-semibold text-sm text-emerald-700">{simulatedKwh(s)} kWh</p>
                    </div>
                  </div>
                  <button onClick={() => stop(s.id)} className="btn-danger w-full">⏹ Dừng sạc</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? <div className="skeleton h-32"></div> : (
          <>
            {completed.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Lịch sử ({completed.length})</h3>
                <div className="space-y-3">
                  {completed.map(s => (
                    <div key={s.id} className="card p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-slate-800">{s.slot.station.name}</h4>
                          <p className="text-sm text-slate-500">Trụ {s.slot.slotNumber} • {fmt(s.startTime)}</p>
                        </div>
                        <span className="badge-gray">Hoàn thành</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                        <div><p className="text-xs text-slate-500">Năng lượng</p><p className="font-semibold">{s.energyKwh} kWh</p></div>
                        <div><p className="text-xs text-slate-500">Thời gian</p><p className="font-semibold">{dur(s.startTime, s.endTime)}</p></div>
                        <div><p className="text-xs text-slate-500">Số tiền</p><p className="font-semibold">{s.invoice?.amount.toLocaleString("vi-VN")} ₫</p></div>
                      </div>
                      {s.invoice && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className={s.invoice.status === "PAID" ? "badge-green" : "badge-yellow"}>
                            {s.invoice.status === "PAID" ? "✓ Đã thanh toán" : "Chưa thanh toán"}
                          </span>
                          {s.invoice.status === "UNPAID" && <Link href="/invoices" className="text-emerald-600 hover:underline text-xs">Thanh toán →</Link>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {sessions.length === 0 && (
              <div className="card p-12 text-center">
                <div className="text-5xl mb-3">⚡</div>
                <p className="font-medium text-slate-700">Chưa có phiên sạc nào</p>
                <Link href="/stations"><button className="btn-primary mt-4">Tìm trạm sạc</button></Link>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
