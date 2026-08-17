"use client";
import { useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";

const LIMIT = 50;

export default function AdminPaymentsPage() {
  const [data, setData] = useState<any>({ payments: [], total: 0, totals: { successAmount: 0, successCount: 0 } });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const pageRef = useRef(1);

  async function load(p = 1, append = false) {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
    if (filter) qs.set("status", filter);
    const res = await fetch(`/api/admin/payments?${qs}`);
    if (res.ok) {
      const d = await res.json();
      if (append) d.payments = [...data.payments, ...d.payments];
      setData(d); pageRef.current = p;
    }
    setLoading(false);
  }

  useEffect(() => { load(1); }, [filter]);

  const fmtVnd = (n: number) => n.toLocaleString("vi-VN") + " ₫";
  const fmtDate = (s: string) => new Date(s).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
  const statusColor = (s: string) => s === "SUCCESS" ? "badge-green" : s === "PENDING" ? "badge-yellow" : "badge-red";

  return (
    <AppShell title="Thanh toán VNPay">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Giao dịch VNPay</h2>
            <p className="text-sm text-slate-500 mt-1">Lịch sử thanh toán cổng VNPay sandbox.</p>
          </div>
          <select className="input !w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="SUCCESS">Thành công</option>
            <option value="PENDING">Đang xử lý</option>
            <option value="FAILED">Thất bại</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="card p-4">
            <div className="text-xs text-slate-500 uppercase">Tổng doanh thu</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{fmtVnd(data.totals.successAmount)}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-slate-500 uppercase">Giao dịch thành công</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{data.totals.successCount}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-slate-500 uppercase">Hiển thị</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{data.payments.length}/{data.total}</div>
          </div>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Đang tải...</div>
          ) : data.payments.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <div className="text-4xl mb-3">💳</div>
              Chưa có giao dịch nào.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left p-3 font-medium text-slate-600">Mã GD</th>
                    <th className="text-left p-3 font-medium text-slate-600">Người dùng</th>
                    <th className="text-right p-3 font-medium text-slate-600">Số tiền</th>
                    <th className="text-center p-3 font-medium text-slate-600">Trạng thái</th>
                    <th className="text-left p-3 font-medium text-slate-600">Ngân hàng</th>
                    <th className="text-left p-3 font-medium text-slate-600">Tạo lúc</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((p: any) => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3"><code className="text-xs">{p.txnRef}</code></td>
                      <td className="p-3">
                        <div className="font-medium">{p.user?.name}</div>
                        <div className="text-xs text-slate-500">{p.user?.email}</div>
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600">{fmtVnd(p.amount)}</td>
                      <td className="p-3 text-center"><span className={statusColor(p.status)}>{p.status}</span></td>
                      <td className="p-3 text-xs">{p.bankCode || "-"}</td>
                      <td className="p-3 text-xs text-slate-500">{fmtDate(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && data.payments.length < data.total && (
            <div className="p-4 border-t border-slate-100">
              <button onClick={() => load(pageRef.current + 1, true)} className="btn-secondary w-full">Tải thêm</button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
