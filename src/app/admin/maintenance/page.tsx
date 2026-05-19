"use client";
import { useEffect, useState, useMemo } from "react";
import AppShell from "@/components/AppShell";

const PAGE_SIZE = 10;

export default function AdminMaintenancePage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [techs, setTechs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ stationId: "", slotId: "", title: "", description: "", priority: "MEDIUM", assignedToId: "" });
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  async function load() {
    const token = localStorage.getItem("token");
    const [t, s, u] = await Promise.all([
      fetch("/api/maintenance", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/stations").then(r => r.json()),
      fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => [])
    ]);
    setTickets(t); setStations(s);
    setTechs(Array.isArray(u) ? u.filter((x: any) => x.role === "TECHNICIAN") : []);
    setLoading(false);
  }

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    load();
  }, []);

  async function create() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    if (res.ok) { setShowForm(false); setForm({ stationId: "", slotId: "", title: "", description: "", priority: "MEDIUM", assignedToId: "" }); load(); }
  }

  async function updateStatus(id: string, status: string) {
    const token = localStorage.getItem("token");
    await fetch(`/api/maintenance/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    load();
  }

  const filtered = useMemo(() => filter === "ALL" ? tickets : tickets.filter(t => t.status === filter), [tickets, filter]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [filter]);

  const selectedStation = stations.find(s => s.id === form.stationId);
  const priColor = (p: string) => ({ LOW:"badge-gray", MEDIUM:"badge-yellow", HIGH:"badge-red", CRITICAL:"badge-red" }[p] || "");
  const statusColor = (s: string) => ({ OPEN:"badge-blue", IN_PROGRESS:"badge-yellow", RESOLVED:"badge-green", CLOSED:"badge-gray" }[s] || "");

  return (
    <AppShell title="Quản lý bảo trì">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Bảo trì hệ thống</h2>
            <p className="text-sm text-slate-500 mt-1">{filtered.length} ticket</p>
          </div>
          {user?.role === "ADMIN" && (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              {showForm ? "Đóng" : "+ Tạo ticket"}
            </button>
          )}
        </div>

        {showForm && (
          <div className="card p-6 mb-6 animate-fadeIn">
            <h3 className="font-semibold mb-4">Tạo ticket bảo trì</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={form.stationId} onChange={e => setForm({...form, stationId: e.target.value, slotId: ""})} className="input">
                <option value="">Chọn trạm...</option>
                {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={form.slotId} onChange={e => setForm({...form, slotId: e.target.value})} className="input" disabled={!form.stationId}>
                <option value="">Chọn trụ (tuỳ chọn)...</option>
                {selectedStation?.slots?.map((sl: any) => <option key={sl.id} value={sl.id}>Trụ {sl.slotNumber}</option>)}
              </select>
              <input type="text" placeholder="Tiêu đề" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input col-span-2" />
              <textarea placeholder="Mô tả chi tiết" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input col-span-2" rows={3}></textarea>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="input">
                <option value="LOW">🟢 Thấp</option><option value="MEDIUM">🟡 Trung bình</option><option value="HIGH">🟠 Cao</option><option value="CRITICAL">🔴 Khẩn cấp</option>
              </select>
              <select value={form.assignedToId} onChange={e => setForm({...form, assignedToId: e.target.value})} className="input">
                <option value="">Chưa giao</option>
                {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <button onClick={create} disabled={!form.stationId || !form.title || !form.description} className="btn-primary mt-4">Tạo ticket</button>
          </div>
        )}

        <div className="flex gap-1 mb-4 bg-white p-1 rounded-lg border border-slate-200 w-fit overflow-x-auto">
          {[{k:"ALL",l:"Tất cả"},{k:"OPEN",l:"Mở"},{k:"IN_PROGRESS",l:"Đang xử lý"},{k:"RESOLVED",l:"Đã sửa"},{k:"CLOSED",l:"Đóng"}].map(s => (
            <button key={s.k} onClick={() => setFilter(s.k)} className={`px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${filter === s.k ? "bg-slate-100 text-slate-800" : "text-slate-500"}`}>{s.l}</button>
          ))}
        </div>

        {loading ? <div className="skeleton h-32"></div> : paged.length === 0 ? (
          <div className="card p-12 text-center text-slate-400">Không có ticket</div>
        ) : (
          <>
            <div className="space-y-3">
              {paged.map(t => (
                <div key={t.id} className="card p-5">
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-800">{t.title}</h3>
                      <p className="text-sm text-slate-500">{t.station.name}{t.slot ? ` / Trụ ${t.slot.slotNumber}` : ""}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <span className={priColor(t.priority)}>{t.priority}</span>
                      <span className={statusColor(t.status)}>{t.status}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{t.description}</p>
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-3">
                    <span>👤 {t.createdBy.name}{t.assignedTo ? ` → 🔧 ${t.assignedTo.name}` : ""}</span>
                    <span>{new Date(t.createdAt).toLocaleString("vi-VN")}</span>
                  </div>
                  {t.status !== "CLOSED" && t.status !== "RESOLVED" && (
                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      {t.status === "OPEN" && <button onClick={() => updateStatus(t.id, "IN_PROGRESS")} className="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg font-medium hover:bg-amber-200">▶ Bắt đầu</button>}
                      {t.status === "IN_PROGRESS" && <button onClick={() => updateStatus(t.id, "RESOLVED")} className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg font-medium hover:bg-emerald-200">✓ Hoàn tất</button>}
                      {user?.role === "ADMIN" && <button onClick={() => updateStatus(t.id, "CLOSED")} className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-medium hover:bg-slate-200">Đóng</button>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-slate-500">Trang {page} / {totalPages}</p>
                <div className="flex gap-1">
                  <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn-secondary text-xs px-3 py-1">‹ Trước</button>
                  <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="btn-secondary text-xs px-3 py-1">Sau ›</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
