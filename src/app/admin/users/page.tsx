"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

const ROLES = [
  { v: "CUSTOMER", l: "Khách lẻ", color: "badge-blue" },
  { v: "DRIVER", l: "Tài xế Xanh SM", color: "badge-green" },
  { v: "TECHNICIAN", l: "Kỹ thuật viên", color: "badge-yellow" },
  { v: "ADMIN", l: "Quản trị", color: "badge-purple" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [fleets, setFleets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const empty = { id: "", email: "", password: "", name: "", phone: "", role: "CUSTOMER", fleetId: "" };
  const [form, setForm] = useState(empty);

  async function load() {
    setLoading(true);
    const token = localStorage.getItem("token");
    const [r1, r2] = await Promise.all([
      fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/admin/fleets", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
    ]);
    setUsers(await r1.json());
    if (r2 && r2.ok) setFleets(await r2.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setForm(empty); setShowForm(true); }
  function openEdit(u: any) {
    setEditing(u);
    setForm({ id: u.id, email: u.email, password: "", name: u.name, phone: u.phone || "", role: u.role, fleetId: u.fleetId || "" });
    setShowForm(true);
  }

  async function save() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/admin/users", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    if (res.ok) { setShowForm(false); load(); }
    else { const d = await res.json(); alert(d.error || "Lỗi"); }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Xoá user "${name}"?`)) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/users?id=${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) load();
    else { const d = await res.json(); alert(d.error || "Lỗi"); }
  }

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AppShell title="Quản lý người dùng">
      <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
        <div className="flex gap-3 flex-1 min-w-0">
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Tìm tên / email..." className="input max-w-sm" />
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="input max-w-xs">
            <option value="">Tất cả vai trò</option>
            {ROLES.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
          </select>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Thêm user</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur flex items-start sm:items-center justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="card max-w-md w-full my-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 overflow-y-auto flex-1">
            <h3 className="text-xl font-bold mb-4">{editing ? "Sửa user" : "Thêm user mới"}</h3>
            <div className="space-y-3">
              <div><label className="label">Email *</label><input value={form.email} disabled={!!editing} onChange={e => setForm({...form, email: e.target.value})} className="input" /></div>
              <div><label className="label">{editing ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu *"}</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input" /></div>
              <div><label className="label">Họ tên *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" /></div>
              <div><label className="label">SĐT</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" /></div>
              <div><label className="label">Vai trò</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="input">
                  {ROLES.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
                </select>
              </div>
              {form.role === "DRIVER" && (
                <div><label className="label">Fleet (đội xe)</label>
                  <select value={form.fleetId} onChange={e => setForm({...form, fleetId: e.target.value})} className="input">
                    <option value="">Không thuộc fleet</option>
                    {fleets.map(f => <option key={f.id} value={f.id}>{f.name} (-{f.discountRate}%)</option>)}
                  </select>
                </div>
              )}
            </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <button onClick={save} disabled={!form.email || !form.name || (!editing && !form.password)} className="btn-primary flex-1">💾 {editing ? "Lưu" : "Thêm"}</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">Huỷ</button>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? <div className="skeleton h-32"></div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Vai trò</th>
                    <th className="px-4 py-3 font-semibold">Loyalty</th>
                    <th className="px-4 py-3 font-semibold text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(u => {
                    const roleInfo = ROLES.find(r => r.v === u.role) || ROLES[0];
                    return (
                      <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {u.avatar ? <img src={u.avatar} className="w-8 h-8 rounded-full" alt="" /> : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">{u.name?.[0]?.toUpperCase()}</div>}
                            <div>
                              <p className="font-medium">{u.name}</p>
                              {u.phone && <p className="text-xs" style={{color:"var(--text-muted)"}}>{u.phone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{color:"var(--text-muted)"}}>{u.email}</td>
                        <td className="px-4 py-3"><span className={roleInfo.color}>{roleInfo.l}</span></td>
                        <td className="px-4 py-3">
                          <span className="text-xs">{u.loyaltyPoints || 0} pt</span>
                          {u.loyaltyTier && <span className="badge-yellow ml-1">⭐ {u.loyaltyTier}</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => openEdit(u)} className="text-emerald-600 hover:underline mr-3">✏️ Sửa</button>
                          <button onClick={() => remove(u.id, u.name)} className="text-red-600 hover:underline">🗑️</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs" style={{color:"var(--text-muted)"}}>Hiển thị {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}</p>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-50">← Trước</button>
                  <span className="px-3 py-1">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-50">Sau →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
