"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL"|"VERIFIED"|"UNVERIFIED">("ALL");

  async function load() {
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch("/api/admin/reviews", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setReviews(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggleVerify(id: string, verified: boolean) {
    const token = localStorage.getItem("token");
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ verified: !verified }),
    });
    load();
  }
  async function remove(id: string) {
    if (!confirm("Xoá review này?")) return;
    const token = localStorage.getItem("token");
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    load();
  }

  const filtered = reviews.filter((r) => filter === "ALL" || (filter === "VERIFIED" ? r.verified : !r.verified));
  const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0.0";

  return (
    <AppShell title="Đánh giá">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Đánh giá trạm sạc</h2>
        <p className="text-sm text-slate-500 mb-6">Duyệt và quản lý review từ người dùng.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4"><div className="text-xs text-slate-500 uppercase">Tổng review</div><div className="text-2xl font-bold mt-1">{reviews.length}</div></div>
          <div className="card p-4"><div className="text-xs text-slate-500 uppercase">Trung bình</div><div className="text-2xl font-bold mt-1 text-yellow-500">★ {avgRating}</div></div>
          <div className="card p-4"><div className="text-xs text-slate-500 uppercase">Đã duyệt</div><div className="text-2xl font-bold text-emerald-600 mt-1">{reviews.filter(r => r.verified).length}</div></div>
          <div className="card p-4"><div className="text-xs text-slate-500 uppercase">Chờ duyệt</div><div className="text-2xl font-bold text-amber-500 mt-1">{reviews.filter(r => !r.verified).length}</div></div>
        </div>

        <div className="mb-4 flex gap-2">
          {(["ALL","VERIFIED","UNVERIFIED"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={filter === f ? "btn-primary !py-1.5" : "btn-secondary !py-1.5"}>
              {f === "ALL" ? "Tất cả" : f === "VERIFIED" ? "Đã duyệt" : "Chờ duyệt"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card p-8 text-center text-slate-500">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center text-slate-500"><div className="text-4xl mb-3">⭐</div>Chưa có review.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800">{r.user?.name}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-yellow-500 text-sm">{stars(r.rating)}</span>
                      {r.verified ? <span className="badge-green">Đã duyệt</span> : <span className="badge-yellow">Chờ duyệt</span>}
                    </div>
                    <div className="text-xs text-slate-500 mb-2">📍 {r.station?.name} · {r.station?.city}</div>
                    {r.comment && <p className="text-sm text-slate-700">{r.comment}</p>}
                    <div className="text-xs text-slate-400 mt-2">{new Date(r.createdAt).toLocaleString("vi-VN")}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => toggleVerify(r.id, r.verified)} className="btn-secondary !py-1.5 text-xs whitespace-nowrap">
                      {r.verified ? "Bỏ duyệt" : "Duyệt"}
                    </button>
                    <button onClick={() => remove(r.id)} className="btn-danger !py-1.5 text-xs">Xoá</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
