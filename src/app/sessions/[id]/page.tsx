"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stopping, setStopping] = useState(false);
  const [tick, setTick] = useState(0);

  async function load() {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/sessions/${params.id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      setError("Không tìm thấy phiên sạc");
      setLoading(false);
      return;
    }
    const d = await res.json();
    setSession(d);
    setLoading(false);
  }

  useEffect(() => { load(); }, [params.id]);

  // Auto refresh every 5s if active
  useEffect(() => {
    if (!session || session.status !== "ACTIVE") return;
    const t = setInterval(() => { setTick(x => x + 1); load(); }, 5000);
    return () => clearInterval(t);
  }, [session?.status]);

  async function stopCharging() {
    if (!confirm("Dừng phiên sạc và xuất hoá đơn?")) return;
    setStopping(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/sessions/${params.id}/stop`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setStopping(false);
    if (res.ok) {
      const d = await res.json();
      if (d.invoiceId) router.push(`/invoices/${d.invoiceId}`);
      else load();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Không dừng được phiên sạc");
    }
  }

  if (loading) return <AppShell title="Phiên sạc"><div className="card p-8 text-center text-slate-500">Đang tải...</div></AppShell>;
  if (error || !session) return <AppShell title="Phiên sạc"><div className="card p-8 text-center text-red-500">{error || "Không tìm thấy"}</div></AppShell>;

  const start = new Date(session.startTime);
  const end = session.endTime ? new Date(session.endTime) : new Date();
  const durMs = end.getTime() - start.getTime();
  const durMin = Math.floor(durMs / 60000);
  const hours = Math.floor(durMin / 60);
  const mins = durMin % 60;
  const energy = session.energyKwh || (session.status === "ACTIVE" ? Math.min(60, durMin * 0.6) : 0);
  const power = session.slot?.powerKw || 60;
  const progress = Math.min(100, (energy / 60) * 100);
  const isActive = session.status === "ACTIVE";

  return (
    <AppShell title={`Phiên sạc #${session.id.slice(-6).toUpperCase()}`}>
      <div className="max-w-4xl mx-auto">
        <Link href="/sessions" className="text-sm text-slate-500 hover:text-emerald-600 mb-3 inline-block">← Quay lại danh sách</Link>

        <div className="card p-6 mb-4 bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10"></div>
          <div className="relative flex items-start justify-between mb-6">
            <div>
              <div className="text-sm text-emerald-50 mb-1">Trụ {session.slot?.slotNumber} · {session.slot?.station?.name}</div>
              <div className="flex items-center gap-2 mt-2">
                {isActive ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse"></span>
                    <span className="text-sm font-medium">Đang sạc</span>
                  </>
                ) : session.status === "COMPLETED" ? (
                  <span className="text-sm font-medium">✅ Đã hoàn thành</span>
                ) : (
                  <span className="text-sm font-medium">⏸ {session.status}</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{energy.toFixed(2)}</div>
              <div className="text-sm text-emerald-100">kWh</div>
            </div>
          </div>

          <div className="relative">
            <div className="flex justify-between text-xs text-emerald-50 mb-1">
              <span>{progress.toFixed(0)}%</span>
              <span>~60 kWh full</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500 shadow-lg" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
            <div>
              <div className="text-xs text-emerald-100">Thời gian sạc</div>
              <div className="text-xl font-bold mt-1">{hours}h {String(mins).padStart(2,"0")}m</div>
            </div>
            <div>
              <div className="text-xs text-emerald-100">Công suất</div>
              <div className="text-xl font-bold mt-1">{power} kW</div>
            </div>
            <div>
              <div className="text-xs text-emerald-100">Tốc độ TB</div>
              <div className="text-xl font-bold mt-1">{durMin > 0 ? (energy * 60 / durMin).toFixed(1) : "0.0"} kW</div>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="card p-5">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Thông tin trụ</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Trạm</span><span className="font-medium">{session.slot?.station?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Số trụ</span><span className="font-medium">{session.slot?.slotNumber}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Loại đầu</span><span className="font-medium">{session.slot?.connectorType}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Công suất</span><span className="font-medium">{session.slot?.powerKw} kW</span></div>
              {session.slot?.station?.address && (
                <div className="pt-2 mt-2 border-t border-slate-100 text-xs text-slate-500">📍 {session.slot.station.address}</div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Thời gian</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Bắt đầu</span><span className="font-medium">{start.toLocaleString("vi-VN")}</span></div>
              {session.endTime ? (
                <div className="flex justify-between"><span className="text-slate-500">Kết thúc</span><span className="font-medium">{new Date(session.endTime).toLocaleString("vi-VN")}</span></div>
              ) : (
                <div className="flex justify-between"><span className="text-slate-500">Hiện tại</span><span className="font-medium text-emerald-600">Đang sạc...</span></div>
              )}
              <div className="flex justify-between"><span className="text-slate-500">Tổng thời lượng</span><span className="font-medium">{hours}h {String(mins).padStart(2,"0")}m</span></div>
              {isActive && (
                <div className="pt-2 mt-2 border-t border-slate-100 text-xs text-emerald-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Tự cập nhật mỗi 5 giây
                </div>
              )}
            </div>
          </div>
        </div>

        {isActive && (
          <div className="card p-5 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900 mb-1">Đang sạc xe</h4>
                <p className="text-sm text-amber-700 mb-3">Nhấn "Dừng sạc" khi xe đã đầy hoặc bạn muốn kết thúc. Hệ thống sẽ xuất hoá đơn tự động.</p>
                <button onClick={stopCharging} disabled={stopping} className="btn-danger">
                  {stopping ? "Đang dừng..." : "🛑 Dừng sạc & xuất hoá đơn"}
                </button>
              </div>
            </div>
          </div>
        )}

        {session.status === "COMPLETED" && session.invoice && (
          <Link href={`/invoices/${session.invoice.id}`} className="card p-5 hover:shadow-md transition block">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Hoá đơn</div>
                <div className="font-bold text-lg mt-1">#{session.invoice.invoiceNo || session.invoice.id.slice(-6).toUpperCase()}</div>
                <div className="text-emerald-600 font-bold mt-1">{(session.invoice.amount || 0).toLocaleString("vi-VN")} ₫</div>
              </div>
              <div className="text-emerald-500 text-2xl">→</div>
            </div>
          </Link>
        )}
      </div>
    </AppShell>
  );
}
