"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";

const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export default function ReservationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"single" | "recurring">("single");
  const [reservations, setReservations] = useState<any[]>([]);
  const [recurring, setRecurring] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const token = localStorage.getItem("token");
    const [r1, r2] = await Promise.all([
      fetch("/api/reservations", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/reservations/recurring", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => [])
    ]);
    setReservations(r1); setRecurring(r2); setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function checkin(id: string) {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/reservations/${id}/checkin`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    if (!res.ok) { alert(d.error); return; }
    router.push("/sessions");
  }

  async function cancelRecurring(id: string) {
    if (!confirm("Huỷ lịch định kỳ này? Các lịch chưa diễn ra sẽ bị huỷ.")) return;
    const token = localStorage.getItem("token");
    await fetch(`/api/reservations/recurring/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    load();
  }

  const fmt = (t: string) => new Date(t).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
  const upcoming = reservations.filter(r => r.status === "PENDING" || r.status === "CONFIRMED");
  const past = reservations.filter(r => r.status === "CANCELLED" || r.status === "COMPLETED");

  return (
    <AppShell title="Đặt lịch sạc">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Lịch đặt sạc</h2>
            <p className="text-sm text-slate-500 mt-1">Quản lý lịch đặt và lịch định kỳ của bạn</p>
          </div>
          <Link href="/stations">
            <button className="btn-primary">+ Đặt lịch mới</button>
          </Link>
        </div>

        <div className="flex gap-1 mb-6 bg-white p-1 rounded-lg border border-slate-200 w-fit">
          <button onClick={() => setTab("single")} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === "single" ? "bg-slate-100 text-slate-800" : "text-slate-500"}`}>
            Đặt lịch ({reservations.length})
          </button>
          <button onClick={() => setTab("recurring")} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === "recurring" ? "bg-slate-100 text-slate-800" : "text-slate-500"}`}>
            Lịch định kỳ ({recurring.filter(r => r.active).length})
          </button>
        </div>

        {loading ? <div className="skeleton h-32"></div> : tab === "single" ? (
          <>
            {upcoming.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Sắp tới</h3>
                <div className="space-y-3">
                  {upcoming.map(r => (
                    <div key={r.id} className="card p-5">
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">📍</div>
                          <div>
                            <h4 className="font-semibold text-slate-800">{r.slot.station.name}</h4>
                            <p className="text-sm text-slate-500">Trụ {r.slot.slotNumber} • {r.slot.connectorType} • {r.slot.powerKw}kW</p>
                          </div>
                        </div>
                        <span className={r.status === "PENDING" ? "badge-yellow" : "badge-green"}>{r.status}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">🕐 {fmt(r.startTime)} → {fmt(r.endTime)}</p>
                      {r.status === "PENDING" && (
                        <button onClick={() => checkin(r.id)} className="btn-primary text-sm">Check-in ngay →</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Đã qua</h3>
                <div className="space-y-2">
                  {past.map(r => (
                    <div key={r.id} className="card p-4 opacity-60">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm text-slate-700">{r.slot.station.name} - Trụ {r.slot.slotNumber}</p>
                          <p className="text-xs text-slate-500">{fmt(r.startTime)}</p>
                        </div>
                        <span className={r.status === "CANCELLED" ? "badge-red" : "badge-gray"}>{r.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {reservations.length === 0 && (
              <div className="card p-12 text-center">
                <div className="text-5xl mb-3">📅</div>
                <p className="font-medium text-slate-700">Chưa có lịch đặt nào</p>
                <p className="text-sm text-slate-500 mt-1 mb-4">Đặt lịch để đảm bảo có chỗ sạc</p>
                <Link href="/stations"><button className="btn-primary">Đặt lịch ngay</button></Link>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="card p-4 mb-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <p className="text-sm text-emerald-800">💡 Tự động đặt lịch lặp lại theo các ngày trong tuần. Hệ thống sẽ tạo trước 4 tuần.</p>
            </div>
            {recurring.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="text-5xl mb-3">🔁</div>
                <p className="font-medium text-slate-700">Chưa có lịch định kỳ</p>
                <p className="text-sm text-slate-500 mt-1 mb-4">Tạo lịch định kỳ khi đặt lịch để tiết kiệm thời gian</p>
                <Link href="/stations"><button className="btn-primary">Đặt lịch định kỳ</button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recurring.map(r => (
                  <div key={r.id} className={`card p-5 ${!r.active ? "opacity-50" : ""}`}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-slate-800">Lịch định kỳ</h4>
                          <span className={r.active ? "badge-green" : "badge-gray"}>{r.active ? "Đang chạy" : "Đã huỷ"}</span>
                        </div>
                        <p className="text-sm text-slate-600">⏰ {String(r.startHour).padStart(2,"0")}:00 - {String(r.endHour).padStart(2,"0")}:00</p>
                        <div className="flex gap-1 mt-2">
                          {DAYS.map((d, i) => (
                            <span key={i} className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium ${r.daysOfWeek.split(",").includes(i.toString()) ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>{d}</span>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-3">Bắt đầu: {new Date(r.startDate).toLocaleDateString("vi-VN")}{r.endDate ? ` → ${new Date(r.endDate).toLocaleDateString("vi-VN")}` : ""}</p>
                      </div>
                      {r.active && (
                        <button onClick={() => cancelRecurring(r.id)} className="btn-ghost text-xs text-red-500 hover:bg-red-50">Huỷ</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
