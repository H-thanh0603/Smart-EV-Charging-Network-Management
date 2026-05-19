"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

export default function AdminTariffsPage() {
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", startHour: 0, endHour: 6, ratePerKwh: 2000, isPeak: false, active: true });

  async function load() {
    const res = await fetch("/api/tariffs");
    setTariffs(await res.json()); setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function create() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/tariffs", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    if (res.ok) { setForm({ name: "", startHour: 0, endHour: 6, ratePerKwh: 2000, isPeak: false, active: true }); load(); }
  }

  async function del(id: string) {
    if (!confirm("Xoá tariff này?")) return;
    const token = localStorage.getItem("token");
    await fetch(`/api/tariffs/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    load();
  }

  return (
    <AppShell title="Quản lý giá điện">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Khung giá điện</h2>

        <div className="card p-6 mb-6">
          <h3 className="font-semibold mb-4">Thêm khung giá</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input type="text" placeholder="Tên khung" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" />
            <input type="number" placeholder="Giờ bắt đầu (0-23)" value={form.startHour} onChange={e => setForm({...form, startHour: parseInt(e.target.value)})} className="input" min="0" max="23" />
            <input type="number" placeholder="Giờ kết thúc (1-24)" value={form.endHour} onChange={e => setForm({...form, endHour: parseInt(e.target.value)})} className="input" min="1" max="24" />
            <input type="number" placeholder="Giá VND/kWh" value={form.ratePerKwh} onChange={e => setForm({...form, ratePerKwh: parseFloat(e.target.value)})} className="input" />
            <label className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <input type="checkbox" checked={form.isPeak} onChange={e => setForm({...form, isPeak: e.target.checked})} />
              <span className="text-sm">⚡ Cao điểm</span>
            </label>
            <button onClick={create} disabled={!form.name} className="btn-primary">Thêm</button>
          </div>
        </div>

        {loading ? <div className="skeleton h-32"></div> : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left">
                  <th className="px-6 py-3 text-xs uppercase font-semibold tracking-wider text-slate-500">Tên</th>
                  <th className="px-6 py-3 text-xs uppercase font-semibold tracking-wider text-slate-500">Khung giờ</th>
                  <th className="px-6 py-3 text-xs uppercase font-semibold tracking-wider text-slate-500">Giá</th>
                  <th className="px-6 py-3 text-xs uppercase font-semibold tracking-wider text-slate-500">Loại</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {tariffs.map(t => (
                  <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium">{t.name}</td>
                    <td className="px-6 py-4 text-slate-500">{String(t.startHour).padStart(2,"0")}:00 - {String(t.endHour).padStart(2,"0")}:00</td>
                    <td className="px-6 py-4 font-semibold">{t.ratePerKwh.toLocaleString("vi-VN")} ₫</td>
                    <td className="px-6 py-4"><span className={t.isPeak ? "badge-red" : "badge-green"}>{t.isPeak ? "Cao điểm" : "Thấp điểm"}</span></td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => del(t.id)} className="text-xs text-red-500 hover:underline font-medium">Xoá</button>
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
