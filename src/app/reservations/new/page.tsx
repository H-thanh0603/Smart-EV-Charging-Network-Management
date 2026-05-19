"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";

const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function NewReservationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slotId = searchParams.get("slotId") || "";
  const stationName = searchParams.get("stationName") || "";
  const [mode, setMode] = useState<"single" | "recurring">("single");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [days, setDays] = useState<number[]>([]);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(10);
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    setStartTime(now.toISOString().slice(0, 16));
    setEndTime(end.toISOString().slice(0, 16));
    const ed = new Date(now.getTime() + 28 * 86400000);
    setEndDate(ed.toISOString().slice(0, 10));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const token = localStorage.getItem("token");

    if (mode === "single") {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slotId, startTime, endTime })
      });
      const d = await res.json();
      setLoading(false);
      if (!res.ok) { setError(d.error); return; }
    } else {
      if (days.length === 0) { setError("Chọn ít nhất 1 ngày"); setLoading(false); return; }
      const res = await fetch("/api/reservations/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          slotId,
          daysOfWeek: days.join(","),
          startHour, endHour,
          startDate: new Date().toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : null
        })
      });
      setLoading(false);
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
    }
    router.push("/reservations");
  }

  return (
    <AppShell title="Đặt lịch sạc">
      <div className="max-w-xl mx-auto">
        <div className="card p-6 mb-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">Đang đặt cho</p>
          <h3 className="text-lg font-bold text-slate-800 mt-1">📍 {stationName}</h3>
        </div>

        <div className="card p-6">
          <div className="flex gap-1 mb-6 bg-slate-50 p-1 rounded-lg">
            <button onClick={() => setMode("single")} className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${mode === "single" ? "bg-white shadow-sm text-slate-800" : "text-slate-500"}`}>
              Đặt 1 lần
            </button>
            <button onClick={() => setMode("recurring")} className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${mode === "recurring" ? "bg-white shadow-sm text-slate-800" : "text-slate-500"}`}>
              🔁 Định kỳ
            </button>
          </div>

          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "single" ? (
              <>
                <div>
                  <label className="label">Thời gian bắt đầu</label>
                  <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="input" required />
                </div>
                <div>
                  <label className="label">Thời gian kết thúc</label>
                  <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="input" required />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="label">Các ngày trong tuần</label>
                  <div className="flex gap-2 flex-wrap">
                    {DAYS.map((d, i) => (
                      <button key={i} type="button" onClick={() => setDays(days.includes(i) ? days.filter(x => x !== i) : [...days, i])}
                        className={`w-12 h-12 rounded-lg font-medium text-sm transition ${days.includes(i) ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Giờ bắt đầu</label>
                    <input type="number" min="0" max="23" value={startHour} onChange={e => setStartHour(parseInt(e.target.value))} className="input" />
                  </div>
                  <div>
                    <label className="label">Giờ kết thúc</label>
                    <input type="number" min="0" max="23" value={endHour} onChange={e => setEndHour(parseInt(e.target.value))} className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">Áp dụng đến (tuỳ chọn)</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
                  <p className="text-xs text-slate-500 mt-1">Hệ thống tạo trước lịch trong 4 tuần</p>
                </div>
              </>
            )}

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800">
              ⚠️ Bạn có 15 phút để check-in sau giờ đặt, nếu không lịch sẽ bị huỷ.
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? "Đang xử lý..." : mode === "single" ? "Xác nhận đặt lịch" : "Tạo lịch định kỳ"}
              </button>
              <button type="button" onClick={() => router.back()} className="btn-secondary">Huỷ</button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

export default function NewReservationPage() {
  return <Suspense><NewReservationForm /></Suspense>;
}
