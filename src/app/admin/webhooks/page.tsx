"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

export default function AdminWebhooksPage() {
  const [tab, setTab] = useState<"webhooks" | "apikeys">("webhooks");
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWh, setShowWh] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [whForm, setWhForm] = useState({ name: "", url: "", events: "session.end,invoice.paid" });
  const [keyForm, setKeyForm] = useState({ name: "", partnerId: "" });
  const [newKey, setNewKey] = useState<string | null>(null);

  async function load() {
    const token = localStorage.getItem("token");
    const [w, k] = await Promise.all([
      fetch("/api/webhooks", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/apikeys", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]);
    setWebhooks(w); setKeys(k); setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createWh() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(whForm)
    });
    if (res.ok) { setShowWh(false); setWhForm({ name: "", url: "", events: "session.end,invoice.paid" }); load(); }
  }

  async function delWh(id: string) {
    if (!confirm("Xoá webhook này?")) return;
    const token = localStorage.getItem("token");
    await fetch(`/api/webhooks/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    load();
  }

  async function toggleWh(id: string, active: boolean) {
    const token = localStorage.getItem("token");
    await fetch(`/api/webhooks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: !active })
    });
    load();
  }

  async function createKey() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/apikeys", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(keyForm)
    });
    if (res.ok) {
      const d = await res.json();
      setNewKey(d.key);
      setKeyForm({ name: "", partnerId: "" });
      load();
    }
  }

  async function delKey(id: string) {
    if (!confirm("Xoá API key này? Đối tác sẽ không thể truy cập nữa.")) return;
    const token = localStorage.getItem("token");
    await fetch(`/api/apikeys/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    load();
  }

  return (
    <AppShell title="API & Webhook">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Tích hợp đối tác</h2>
        <p className="text-sm text-slate-500 mb-6">API public cho đối tác và webhook real-time event</p>

        <div className="flex gap-1 mb-6 bg-white p-1 rounded-lg border border-slate-200 w-fit">
          <button onClick={() => setTab("webhooks")} className={`px-4 py-2 rounded-md text-sm font-medium ${tab === "webhooks" ? "bg-slate-100 text-slate-800" : "text-slate-500"}`}>🔌 Webhooks</button>
          <button onClick={() => setTab("apikeys")} className={`px-4 py-2 rounded-md text-sm font-medium ${tab === "apikeys" ? "bg-slate-100 text-slate-800" : "text-slate-500"}`}>🔑 API Keys</button>
        </div>

        {newKey && (
          <div className="card p-4 mb-4 border-amber-300 bg-amber-50 animate-fadeIn">
            <p className="text-sm font-semibold text-amber-900">⚠️ Lưu lại API key này — không hiển thị lại sau khi đóng</p>
            <code className="block bg-white p-3 rounded mt-2 text-xs font-mono break-all">{newKey}</code>
            <button onClick={() => setNewKey(null)} className="text-xs text-amber-700 hover:underline mt-2">Đã lưu, đóng →</button>
          </div>
        )}

        {tab === "webhooks" ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-slate-600">Webhook gửi POST request khi event xảy ra. Có HMAC-SHA256 signature trong header X-Webhook-Signature.</p>
              <button onClick={() => setShowWh(!showWh)} className="btn-primary">{showWh ? "Đóng" : "+ Webhook mới"}</button>
            </div>

            {showWh && (
              <div className="card p-6 mb-4 animate-fadeIn">
                <div className="space-y-3">
                  <div><label className="label">Tên</label><input type="text" value={whForm.name} onChange={e => setWhForm({...whForm, name: e.target.value})} className="input" placeholder="Partner App Webhook" /></div>
                  <div><label className="label">URL</label><input type="url" value={whForm.url} onChange={e => setWhForm({...whForm, url: e.target.value})} className="input" placeholder="https://partner.com/webhook" /></div>
                  <div>
                    <label className="label">Events (cách nhau dấu phẩy)</label>
                    <input type="text" value={whForm.events} onChange={e => setWhForm({...whForm, events: e.target.value})} className="input" placeholder="session.end,invoice.paid" />
                    <p className="text-xs text-slate-500 mt-1">Available: session.start, session.end, invoice.paid, station.maintenance</p>
                  </div>
                  <button onClick={createWh} disabled={!whForm.name || !whForm.url} className="btn-primary">Tạo webhook</button>
                </div>
              </div>
            )}

            {loading ? <div className="skeleton h-32"></div> : webhooks.length === 0 ? (
              <div className="card p-12 text-center text-slate-400"><div className="text-5xl mb-3">🔌</div>Chưa có webhook</div>
            ) : (
              <div className="space-y-3">
                {webhooks.map(w => (
                  <div key={w.id} className="card p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{w.name}</h3>
                          <span className={w.active ? "badge-green" : "badge-gray"}>{w.active ? "Active" : "Disabled"}</span>
                          {w.failureCount > 0 && <span className="badge-red">{w.failureCount} lỗi</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 truncate">{w.url}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => toggleWh(w.id, w.active)} className="text-xs text-blue-600 hover:underline">{w.active ? "Tắt" : "Bật"}</button>
                        <button onClick={() => delWh(w.id)} className="text-xs text-red-500 hover:underline">Xoá</button>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {w.events.split(",").map((e: string) => <span key={e} className="badge-blue">{e.trim()}</span>)}
                    </div>
                    {w.lastTriggered && <p className="text-xs text-slate-400 mt-2">Lần cuối: {new Date(w.lastTriggered).toLocaleString("vi-VN")}</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-slate-600">API key cho đối tác. Endpoint: <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">GET /api/v1/stations</code> với header <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">X-API-Key</code></p>
              <button onClick={() => setShowKey(!showKey)} className="btn-primary">{showKey ? "Đóng" : "+ API Key mới"}</button>
            </div>

            {showKey && (
              <div className="card p-6 mb-4 animate-fadeIn">
                <div className="space-y-3">
                  <div><label className="label">Tên</label><input type="text" value={keyForm.name} onChange={e => setKeyForm({...keyForm, name: e.target.value})} className="input" placeholder="VinFast Mobile App" /></div>
                  <div><label className="label">Partner ID (tuỳ chọn)</label><input type="text" value={keyForm.partnerId} onChange={e => setKeyForm({...keyForm, partnerId: e.target.value})} className="input" placeholder="vinfast-app-v2" /></div>
                  <button onClick={createKey} disabled={!keyForm.name} className="btn-primary">Tạo API Key</button>
                </div>
              </div>
            )}

            {loading ? <div className="skeleton h-32"></div> : keys.length === 0 ? (
              <div className="card p-12 text-center text-slate-400"><div className="text-5xl mb-3">🔑</div>Chưa có API key</div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left">
                      <th className="px-6 py-3 text-xs uppercase font-semibold tracking-wider text-slate-500">Tên</th>
                      <th className="px-6 py-3 text-xs uppercase font-semibold tracking-wider text-slate-500">Key</th>
                      <th className="px-6 py-3 text-xs uppercase font-semibold tracking-wider text-slate-500">Lần cuối</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map(k => (
                      <tr key={k.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <p className="font-medium">{k.name}</p>
                          {k.partnerId && <p className="text-xs text-slate-500">{k.partnerId}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">{k.key.slice(0, 12)}...{k.key.slice(-4)}</code>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{k.lastUsed ? new Date(k.lastUsed).toLocaleString("vi-VN") : "Chưa dùng"}</td>
                        <td className="px-6 py-4 text-right"><button onClick={() => delKey(k.id)} className="text-xs text-red-500 hover:underline">Xoá</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
