"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

type Fleet = {
  id: string;
  name: string;
  code: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  vehicleCount: number;
  walletShared: boolean;
  discountRate: number;
  active: boolean;
  createdAt: string;
  _count: { drivers: number; vehicles: number };
};

export default function AdminFleetsPage() {
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Fleet | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", code: "", contact: "", phone: "", email: "",
    discountRate: 0, walletShared: true, active: true,
  });

  async function load() {
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch("/api/admin/fleets", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setFleets(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startCreate() {
    setEditing(null);
    setForm({ name: "", code: "", contact: "", phone: "", email: "", discountRate: 0, walletShared: true, active: true });
    setError("");
    setShowForm(true);
  }

  function startEdit(f: Fleet) {
    setEditing(f);
    setForm({
      name: f.name, code: f.code,
      contact: f.contact || "", phone: f.phone || "", email: f.email || "",
      discountRate: f.discountRate, walletShared: f.walletShared, active: f.active,
    });
    setError("");
    setShowForm(true);
  }

  async function submit() {
    setError("");
    const token = localStorage.getItem("token");
    const url = editing ? `/api/admin/fleets/${editing.id}` : "/api/admin/fleets";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Lỗi không xác định");
      return;
    }
    setShowForm(false);
    load();
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Xoá fleet "${name}"? Tài xế và xe sẽ bị tách khỏi fleet.`)) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/fleets/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) load();
  }

  return (
    <AppShell title="Quản lý đội xe (Fleet)">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Đội xe đối tác</h2>
            <p className="text-sm text-slate-500 mt-1">Quản lý fleet như Xanh SM, Lazada Logistics — ưu đãi và ví dùng chung.</p>
          </div>
          <button onClick={startCreate} className="btn-primary">+ Thêm fleet</button>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-44"></div>)}
          </div>
        ) : fleets.length === 0 ? (
          <div className="card p-12 text-center text-slate-500">
            <div className="text-5xl mb-3">🚗</div>
            Chưa có fleet nào — nhấn "+ Thêm fleet" để tạo mới.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fleets.map((f) => (
              <div key={f.id} className="card p-5 relative">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800">{f.name}</h3>
                    <code className="text-xs text-emerald-600 font-mono">{f.code}</code>
                  </div>
                  <span className={f.active ? "badge-green" : "badge-red"}>{f.active ? "Hoạt động" : "Tạm dừng"}</span>
                </div>
                <div className="space-y-1.5 text-sm text-slate-600 mb-4">
                  {f.contact && <div>👤 {f.contact}</div>}
                  {f.phone && <div>📞 {f.phone}</div>}
                  {f.email && <div className="truncate">✉️ {f.email}</div>}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4 pt-3 border-t border-slate-100">
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-800">{f._count.drivers}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Tài xế</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-800">{f._count.vehicles}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Xe</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-emerald-600">-{f.discountRate}%</div>
                    <div className="text-[10px] text-slate-500 uppercase">Giảm giá</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(f)} className="btn-secondary flex-1 !py-1.5 text-xs">Sửa</button>
                  <button onClick={() => remove(f.id, f.name)} className="btn-danger !py-1.5 text-xs">Xoá</button>
                </div>
                {f.walletShared && (
                  <div className="absolute top-3 right-12 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">Ví chung</div>
                )}
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <div className="card p-6 max-w-lg w-full bg-white" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">{editing ? "Sửa fleet" : "Thêm fleet mới"}</h3>
              {error && <div className="mb-3 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tên fleet *</label>
                  <input className="input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="label">Mã fleet *</label>
                  <input className="input" disabled={!!editing} value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="VD: XANHSM" />
                </div>
                <div className="col-span-2">
                  <label className="label">Người liên hệ</label>
                  <input className="input" value={form.contact} onChange={(e) => setForm({...form, contact: e.target.value})} />
                </div>
                <div>
                  <label className="label">Điện thoại</label>
                  <input className="input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
                </div>
                <div>
                  <label className="label">Giảm giá (%)</label>
                  <input className="input" type="number" min={0} max={50} value={form.discountRate} onChange={(e) => setForm({...form, discountRate: Number(e.target.value)})} />
                </div>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.walletShared} onChange={(e) => setForm({...form, walletShared: e.target.checked})} />
                    Ví chung
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.active} onChange={(e) => setForm({...form, active: e.target.checked})} />
                    Hoạt động
                  </label>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Huỷ</button>
                <button onClick={submit} className="btn-primary flex-1">{editing ? "Cập nhật" : "Tạo mới"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
