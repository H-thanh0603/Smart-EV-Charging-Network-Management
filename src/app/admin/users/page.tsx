"use client";
import { useEffect, useState, useMemo } from "react";
import AppShell from "@/components/AppShell";

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setUsers(d); setLoading(false); });
  }, []);

  const filtered = useMemo(() => users.filter(u => {
    if (filter !== "ALL" && u.role !== filter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [users, search, filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, filter]);

  const roleBadge = (r: string) => ({ ADMIN: "badge-red", TECHNICIAN: "badge-blue", MANAGER: "badge-purple", CUSTOMER: "badge-gray" }[r] || "badge-gray");

  return (
    <AppShell title="Người dùng">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Quản lý người dùng</h2>
            <p className="text-sm text-slate-500 mt-1">{filtered.length} người dùng</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input type="text" placeholder="🔍 Tìm theo tên, email..." value={search} onChange={e => setSearch(e.target.value)} className="input flex-1" />
          <select value={filter} onChange={e => setFilter(e.target.value)} className="input sm:w-48">
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Admin</option>
            <option value="TECHNICIAN">Technician</option>
            <option value="CUSTOMER">Customer</option>
          </select>
        </div>

        {loading ? <div className="skeleton h-64"></div> : (
          <>
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left">
                    <th className="px-6 py-3 text-xs uppercase font-semibold tracking-wider text-slate-500">Người dùng</th>
                    <th className="px-6 py-3 text-xs uppercase font-semibold tracking-wider text-slate-500">Email</th>
                    <th className="px-6 py-3 text-xs uppercase font-semibold tracking-wider text-slate-500">Điện thoại</th>
                    <th className="px-6 py-3 text-xs uppercase font-semibold tracking-wider text-slate-500">Điểm</th>
                    <th className="px-6 py-3 text-xs uppercase font-semibold tracking-wider text-slate-500">Vai trò</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(u => (
                    <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                            {u.name[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{u.email}</td>
                      <td className="px-6 py-4 text-slate-500">{u.phone || "—"}</td>
                      <td className="px-6 py-4 text-slate-500">{u.loyaltyPoints || 0}</td>
                      <td className="px-6 py-4"><span className={roleBadge(u.role)}>{u.role}</span></td>
                    </tr>
                  ))}
                  {paged.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Không tìm thấy người dùng</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-slate-500">Trang {page} / {totalPages} • {filtered.length} kết quả</p>
                <div className="flex gap-1">
                  <button onClick={() => setPage(1)} disabled={page === 1} className="btn-secondary text-xs px-2 py-1">«</button>
                  <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn-secondary text-xs px-3 py-1">‹ Trước</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    if (p > totalPages) return null;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`text-xs px-3 py-1 rounded-lg font-medium ${p === page ? "bg-emerald-500 text-white" : "bg-white border border-slate-200 hover:bg-slate-50"}`}>{p}</button>
                    );
                  })}
                  <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="btn-secondary text-xs px-3 py-1">Sau ›</button>
                  <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="btn-secondary text-xs px-2 py-1">»</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
