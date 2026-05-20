"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

export default function AdminLoyaltyPage() {
  const [data, setData] = useState<any>({ txns: [], tierStats: [], totalPoints: 0 });
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch("/api/admin/loyalty", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setData(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const tierColors: any = {
    BRONZE: "from-amber-600 to-orange-700",
    SILVER: "from-slate-400 to-slate-500",
    GOLD: "from-yellow-400 to-yellow-600",
    PLATINUM: "from-purple-400 to-purple-600",
  };

  return (
    <AppShell title="Loyalty">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Chương trình điểm thưởng</h2>
        <p className="text-sm text-slate-500 mb-6">Theo dõi tích/tiêu điểm và phân tầng hạng thành viên.</p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="card p-4">
            <div className="text-xs text-slate-500 uppercase">Tổng điểm</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{data.totalPoints.toLocaleString("vi-VN")}</div>
          </div>
          {["BRONZE","SILVER","GOLD","PLATINUM"].map((tier) => {
            const stat = data.tierStats.find((t: any) => t.loyaltyTier === tier);
            return (
              <div key={tier} className="card p-4 relative overflow-hidden">
                <div className={`absolute -top-6 -right-6 w-16 h-16 rounded-full bg-gradient-to-br ${tierColors[tier]} opacity-20`}></div>
                <div className="text-xs text-slate-500 uppercase relative">{tier}</div>
                <div className="text-2xl font-bold text-slate-800 mt-1 relative">{stat?._count || 0}</div>
                <div className="text-xs text-slate-400 relative">khách hàng</div>
              </div>
            );
          })}
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 font-medium text-slate-700">Lịch sử giao dịch điểm (50 gần nhất)</div>
          {loading ? (
            <div className="p-8 text-center text-slate-500">Đang tải...</div>
          ) : data.txns.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Chưa có giao dịch điểm nào.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left p-3 font-medium text-slate-600">Khách hàng</th>
                    <th className="text-center p-3 font-medium text-slate-600">Hạng</th>
                    <th className="text-center p-3 font-medium text-slate-600">Loại</th>
                    <th className="text-right p-3 font-medium text-slate-600">Điểm</th>
                    <th className="text-right p-3 font-medium text-slate-600">Số dư</th>
                    <th className="text-left p-3 font-medium text-slate-600">Lý do</th>
                    <th className="text-left p-3 font-medium text-slate-600">Lúc</th>
                  </tr>
                </thead>
                <tbody>
                  {data.txns.map((t: any) => (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-medium">{t.user?.name}</div>
                        <div className="text-xs text-slate-500">{t.user?.email}</div>
                      </td>
                      <td className="p-3 text-center"><span className="badge-yellow">{t.user?.loyaltyTier}</span></td>
                      <td className="p-3 text-center">
                        <span className={t.type === "EARN" ? "badge-green" : "badge-red"}>{t.type}</span>
                      </td>
                      <td className={`p-3 text-right font-bold ${t.type === "EARN" ? "text-emerald-600" : "text-red-600"}`}>
                        {t.type === "EARN" ? "+" : "-"}{Math.abs(t.points)}
                      </td>
                      <td className="p-3 text-right font-medium">{t.balance}</td>
                      <td className="p-3 text-xs">{t.reason}</td>
                      <td className="p-3 text-xs text-slate-500">{new Date(t.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
