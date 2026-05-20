"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newKey, setNewKey] = useState<any>(null);
  const [form, setForm] = useState({ name: "", partnerId: "", rateLimit: 1000 });

  async function load() {
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch("/api/apikeys", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setKeys(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/apikeys", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const k = await res.json();
      setNewKey(k);
      setForm({ name: "", partnerId: "", rateLimit: 1000 });
      load();
    }
  }

  async function toggleActive(id: string, active: boolean) {
    const token = localStorage.getItem("token");
    await fetch(`/api/apikeys/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: !active }),
    });
    load();
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Xoá API key "${name}"?`)) return;
    const token = localStorage.getItem("token");
    await fetch(`/api/apikeys/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    load();
  }

  return (
    <AppShell title="API Keys">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">API Keys cho đối tác</h2>
            <p className="text-sm text-slate-500 mt-1">Cấp quyền truy cập API cho hệ thống đối tác (fleet, third-party).</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">+ Tạo key mới</button>
        </div>

        {newKey && (
          <div className="card p-5 mb-6 bg-emerald-50 border-emerald-200">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🔑</div>
              <div className="flex-1">
                <h4 className="font-semibold text-emerald-900 mb-1">API Key mới — chỉ hiển thị một lần!</h4>
                <p className="text-xs text-emerald-700 mb-2">Lưu ngay vào nơi an toàn. Nếu mất, phải tạo key mới.</p>
                <code className="block p-3 bg-white rounded-lg border border-emerald-200 font-mono text-sm break-all">{newKey.key}</code>
                <button onClick={() => { navigator.clipboard.writeText(newKey.key); alert("Đã copy!"); }} className="btn-secondary !py-1 mt-2 text-xs">📋 Copy</button>
                <button onClick={() => setNewKey(null)} className="btn-secondary !py-1 mt-2 ml-2 text-xs">Đóng</button>
              </div>
            </div>
          </div>
        )}

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Đang tải...</div>
          ) : keys.length === 0 ? (
            <div className="p-12 text-center text-slate-500"><div className="text-4xl mb-3">🔐</div>Chưa có API key nào.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left p-3 font-medium text-slate-600">Tên</th>
                    <th className="text-left p-3 font-medium text-slate-600">Partner</th>
                    <th className="text-left p-3 font-medium text-slate-600">Key (preview)</th>
                    <th className="text-right p-3 font-medium text-slate-600">Rate limit</th>
                    <th className="text-center p-3 font-medium text-slate-600">Trạng thái</th>
                    <th className="text-left p-3 font-medium text-slate-600">Dùng lần cuối</th>
                    <th className="text-right p-3 font-medium text-slate-600">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => (
                    <tr key={k.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 font-medium">{k.name}</td>
                      <td className="p-3 text-xs text-slate-500">{k.partnerId || "-"}</td>
                      <td className="p-3"><code className="text-xs">{k.key?.slice(0, 12)}...{k.key?.slice(-4)}</code></td>
                      <td className="p-3 text-right">{k.rateLimit}/h</td>
                      <td className="p-3 text-center">
                        <button onClick={() => toggleActive(k.id, k.active)} className={k.active ? "badge-green" : "badge-red"}>
                          {k.active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="p-3 text-xs text-slate-500">{k.lastUsed ? new Date(k.lastUsed).toLocaleString("vi-VN") : "Chưa dùng"}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => remove(k.id, k.name)} className="text-xs text-red-600 hover:underline">Xoá</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <div className="card p-6 max-w-md w-full bg-white" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">Tạo API Key mới</h3>
              <div className="space-y-3">
                <div>
                  <label className="label">Tên *</label>
                  <input className="input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="VD: Xanh SM Production" />
                </div>
                <div>
                  <label className="label">Partner ID</label>
                  <input className="input" value={form.partnerId} onChange={(e) => setForm({...form, partnerId: e.target.value})} placeholder="Optional" />
                </div>
                <div>
                  <label className="label">Rate limit (req/h)</label>
                  <input className="input" type="number" value={form.rateLimit} onChange={(e) => setForm({...form, rateLimit: Number(e.target.value)})} />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Huỷ</button>
                <button onClick={() => { create(); setShowForm(false); }} className="btn-primary flex-1">Tạo key</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
