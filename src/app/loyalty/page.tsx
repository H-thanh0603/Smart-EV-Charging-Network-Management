"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

const TIER_COLORS: Record<string, string> = {
  BRONZE: "from-amber-700 to-orange-700",
  SILVER: "from-slate-400 to-slate-500",
  GOLD: "from-amber-400 to-yellow-500",
  PLATINUM: "from-cyan-400 to-blue-500",
};
const TIER_ICONS: Record<string, string> = { BRONZE: "🥉", SILVER: "🥈", GOLD: "🥇", PLATINUM: "💎" };

export default function LoyaltyPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redeemAmount, setRedeemAmount] = useState(100);
  const [showRedeem, setShowRedeem] = useState(false);

  async function load() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/loyalty", { headers: { Authorization: `Bearer ${token}` } });
    setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function redeem() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/loyalty/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ points: redeemAmount })
    });
    const d = await res.json();
    if (!res.ok) { alert(d.error); return; }
    alert(`Quy đổi thành công ${d.value.toLocaleString("vi-VN")} ₫ vào ví!`);
    setShowRedeem(false);
    load();
  }

  if (loading) return <AppShell><div className="skeleton h-64"></div></AppShell>;

  const { points, tier, currentTier, nextTier, allTiers, transactions } = data;
  const progress = nextTier ? Math.min(100, ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100) : 100;

  return (
    <AppShell title="Điểm thưởng">
      <div className="max-w-4xl mx-auto">
        <div className={`relative overflow-hidden rounded-2xl p-8 mb-6 bg-gradient-to-br ${TIER_COLORS[tier]} text-white shadow-xl`}>
          <div className="absolute top-0 right-0 w-48 h-48 opacity-20" style={{backgroundImage:"radial-gradient(circle, white 0%, transparent 60%)"}}></div>
          <div className="relative">
            <p className="text-sm opacity-80 mb-1">Hạng thành viên</p>
            <div className="flex items-center gap-3">
              <span className="text-5xl">{TIER_ICONS[tier]}</span>
              <h2 className="text-4xl font-bold">{tier}</h2>
            </div>
            <p className="text-3xl font-bold mt-6">{points.toLocaleString("vi-VN")} điểm</p>
            {nextTier && (
              <div className="mt-4">
                <div className="flex justify-between text-xs opacity-80 mb-1">
                  <span>Còn {(nextTier.min - points).toLocaleString("vi-VN")} điểm lên {nextTier.name}</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                <div className="bg-white/20 rounded-full h-2">
                  <div className="bg-white rounded-full h-full transition-all" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Quyền lợi hiện tại</h3>
            <ul className="space-y-2">
              {currentTier.perks.map((p: string) => (
                <li key={p} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="text-emerald-500">✓</span> {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Quy đổi điểm</h3>
            <p className="text-sm text-slate-500 mb-3">100 điểm = 10,000 ₫ vào ví</p>
            <button onClick={() => setShowRedeem(!showRedeem)} disabled={points < 100} className="btn-primary w-full">
              {points < 100 ? "Cần tối thiểu 100 điểm" : "Đổi điểm ngay"}
            </button>
            {showRedeem && (
              <div className="mt-3 animate-fadeIn">
                <input type="number" min="100" max={points} step="100" value={redeemAmount} onChange={e => setRedeemAmount(parseInt(e.target.value))} className="input mb-2" />
                <p className="text-xs text-slate-500 mb-2">= {(redeemAmount * 100).toLocaleString("vi-VN")} ₫</p>
                <button onClick={redeem} className="btn-primary w-full text-sm">Xác nhận đổi {redeemAmount} điểm</button>
              </div>
            )}
          </div>
        </div>

        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4">Tất cả hạng</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {allTiers.map((t: any) => (
              <div key={t.name} className={`p-4 rounded-xl border-2 ${tier === t.name ? "border-emerald-500 bg-emerald-50" : "border-slate-100"}`}>
                <div className="text-3xl mb-2">{TIER_ICONS[t.name]}</div>
                <p className="font-semibold text-slate-800">{t.name}</p>
                <p className="text-xs text-slate-500">≥ {t.min.toLocaleString("vi-VN")} điểm</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Lịch sử giao dịch điểm</h3>
          {transactions.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">Chưa có giao dịch</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((t: any) => (
                <div key={t.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{t.reason}</p>
                    <p className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleString("vi-VN")}</p>
                  </div>
                  <p className={`font-bold ${t.points > 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {t.points > 0 ? "+" : ""}{t.points} điểm
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
