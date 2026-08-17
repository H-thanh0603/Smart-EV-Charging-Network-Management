"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { Icon } from "@/components/ui/Icon";
import { toast } from "@/components/ui/Toaster";

const LIMIT = 20;

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageRef = useRef(1);

  async function load(p = 1, append = false) {
    const res = await fetch(`/api/sessions?page=${p}&limit=${LIMIT}`);
    const d = await res.json();
    setSessions(prev => append ? [...prev, ...d.items] : d.items);
    setTotal(d.total); pageRef.current = p; setLoading(false);
  }

  useEffect(() => {
    load(1);
    // Poll 10s cho phiên ACTIVE — chỉ refresh khi chưa "Tải thêm" (tránh reset danh sách)
    const t = setInterval(() => { if (pageRef.current === 1) load(1); }, 10000);
    return () => clearInterval(t);
  }, []);

  async function stop(id: string) {
    if (!confirm("Dừng phiên sạc này?")) return;
    const res = await fetch(`/api/sessions/${id}/stop`, { method: "POST" });
    const d = await res.json();
    if (!res.ok) { toast(d.error, "error"); return; }
    toast(`Phiên sạc kết thúc! ${d.invoice.energyKwh} kWh • ${d.invoice.amount.toLocaleString("vi-VN")} ₫`, "success");
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
            <strong>Demo mode:</strong> Năng lượng (kWh) được mô phỏng theo công thức <code className="bg-white px-1 rounded">thời_gian × công_suất × 0.9</code>.
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
                    <span className="badge-green flex items-center gap-1"><Icon name="bolt" className="w-3 h-3" /> Đang sạc</span>
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
                  <button onClick={() => stop(s.id)} className="btn-danger w-full flex items-center justify-center gap-2"><Icon name="x" className="w-4 h-4" /> Dừng sạc</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? <div className="skeleton h-32"></div> : (
          <>
            {completed.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Lịch sử ({completed.length}/{total})</h3>
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
            {sessions.length < total && (
              <button onClick={() => load(pageRef.current + 1, true)} className="btn-secondary w-full mt-4">Tải thêm</button>
            )}
            {sessions.length === 0 && (
              <div className="card p-12 text-center">
                <div className="mb-3 flex justify-center"><Icon name="bolt" className="w-12 h-12 text-emerald-500" /></div>
                <p className="font-medium">Chưa có phiên sạc nào</p>
                <Link href="/stations"><button className="btn-primary mt-4">Tìm trạm sạc</button></Link>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
