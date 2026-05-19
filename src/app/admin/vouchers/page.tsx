"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const next30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const [form, setForm] = useState({ code: "", name: "", description: "", type: "PERCENT", value: 10, minAmount: 0, maxDiscount: 50000, usageLimit: 100, perUserLimit: 1, validFrom: today, validUntil: next30 });

  async function load() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/vouchers", { headers: { Authorization: `Bearer ${token}` } });
    setVouchers(await res.json()); setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function create() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/vouchers", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    if (res.ok) { setShowForm(false); setForm({...form, code: "", name: "", description: ""}); load(); }
    else { const d = await res.json(); alert(d.error || "Lỗi"); }
  }

  async function toggle(id: string, active: boolean) {
    const token = localStorage.getItem("token");
    await fetch(`/api/vouchers/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ active: !active }) });
    load();
  }

  async function del(id: string) {
    if (!confirm("Xoá voucher này?")) return;
    const token = localStorage.getItem("token");
    await fetch(`/api/vouchers/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    load();
  }

  return (
    <AppShell title="Quản lý voucher">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Voucher / Khuyến mãi</h2>
            <p className="text-sm" style={{color:"var(--text-muted)"}}>{vouchers.length} mã</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">{showForm ? "Đóng" : "+ Tạo voucher"}</button>
        </div>

        {showForm && (
          <div className="card p-6 mb-6 animate-fadeIn">
            <h3 className="font-semibold mb-4">Voucher mới</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="label">Mã code</label><input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="input" placeholder="WELCOME50" /></div>
              <div><label className="label">Tên</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" placeholder="Khuyến mãi mừng" /></div>
              <div className="col-span-full"><label className="label">Mô tả</label><input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input" /></div>
              <div><label className="label">Loại</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input">
                  <option value="PERCENT">Phần trăm (%)</option><option value="FIXED">Số tiền cố định (VND)</option>
                </select>
              </div>
              <div><label className="label">Giá trị {form.type === "PERCENT" ? "(%)" : "(VND)"}</label><input type="number" value={form.value} onChange={e => setForm({...form, value: parseFloat(e.target.value)})} className="input" /></div>
              <div><label className="label">Đơn tối thiểu (VND)</label><input type="number" value={form.minAmount} onChange={e => setForm({...form, minAmount: parseFloat(e.target.value)})} className="input" /></div>
              <div><label className="label">Giảm tối đa (VND)</label><input type="number" value={form.maxDiscount || 0} onChange={e => setForm({...form, maxDiscount: parseFloat(e.target.value)})} className="input" /></div>
              <div><label className="label">Tổng số lượt (để trống = không giới hạn)</label><input type="number" value={form.usageLimit || ""} onChange={e => setForm({...form, usageLimit: parseInt(e.target.value) || undefined as any})} className="input" /></div>
              <div><label className="label">Lượt / người</label><input type="number" value={form.perUserLimit} onChange={e => setForm({...form, perUserLimit: parseInt(e.target.value)})} className="input" /></div>
              <div><label className="label">Hiệu lực từ</label><input type="date" value={form.validFrom} onChange={e => setForm({...form, validFrom: e.target.value})} className="input" /></div>
              <div><label className="label">Đến</label><input type="date" value={form.validUntil} onChange={e => setForm({...form, validUntil: e.target.value})} className="input" /></div>
            </div>
            <button onClick={create} disabled={!form.code || !form.name} className="btn-primary mt-4">Tạo voucher</button>
          </div>
        )}

        {loading ? <div className="skeleton h-32"></div> : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead style={{background:"var(--hover)"}}>
                <tr className="text-left">
                  <th className="px-6 py-3 text-xs uppercase font-semibold tracking-wider" style={{color:"var(--text-muted)"}}>Code</th>
                  <th className="px-6 py-3 text-xs uppercase font-semibold tracking-wider" style={{color:"var(--text-muted)"}}>Tên</th>
                  <th className="px-6 py-3 text-xs uppercase font-semibold tracking-wider" style={{color:"var(--text-muted)"}}>Giá trị</th>
                  <th className="px-6 py-3 text-xs uppercase font-semibold tracking-wider" style={{color:"var(--text-muted)"}}>Đã dùng</th>
                  <th className="px-6 py-3 text-xs uppercase font-semibold tracking-wider" style={{color:"var(--text-muted)"}}>Hết hạn</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map(v => (
                  <tr key={v.id} style={{borderTop:"1px solid var(--border)"}}>
                    <td className="px-6 py-4"><code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">{v.code}</code></td>
                    <td className="px-6 py-4">{v.name}</td>
                    <td className="px-6 py-4 font-semibold">{v.type === "PERCENT" ? `${v.value}%` : `${v.value.toLocaleString("vi-VN")} ₫`}</td>
                    <td className="px-6 py-4">{v.usedCount}{v.usageLimit ? `/${v.usageLimit}` : ""}</td>
                    <td className="px-6 py-4 text-xs">{new Date(v.validUntil).toLocaleDateString("vi-VN")}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => toggle(v.id, v.active)} className={`text-xs hover:underline mr-3 ${v.active ? "text-blue-600" : "text-slate-500"}`}>{v.active ? "Tắt" : "Bật"}</button>
                      <button onClick={() => del(v.id)} className="text-xs text-red-500 hover:underline">Xoá</button>
                    </td>
                  </tr>
                ))}
                {vouchers.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center" style={{color:"var(--text-muted)"}}>Chưa có voucher</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
