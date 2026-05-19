"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";

const TOPUP_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];
const BANKS = [
  { code: "VNPAYQR", label: "Quét QR (mọi ngân hàng)", icon: "📱" },
  { code: "VNBANK", label: "Thẻ ATM nội địa", icon: "💳" },
  { code: "INTCARD", label: "Thẻ Visa/Master/JCB", icon: "🌐" },
];

function WalletContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const txn = searchParams.get("txn");
  const successAmount = searchParams.get("amount");

  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopup, setShowTopup] = useState(false);
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("VNPAYQR");
  const [processing, setProcessing] = useState(false);

  async function load() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/wallet", { headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    setWallet(d.wallet); setTransactions(d.transactions); setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Auto refresh after returning from VNPay
  useEffect(() => {
    if (status === "success") {
      load();
      const t = setTimeout(() => router.replace("/wallet"), 5000);
      return () => clearTimeout(t);
    }
  }, [status]);

  async function topupVNPay() {
    if (!amount || parseFloat(amount) < 10000) {
      alert("Số tiền tối thiểu 10,000 ₫");
      return;
    }
    setProcessing(true);
    const token = localStorage.getItem("token");
    const res = await fetch("/api/payments/vnpay/create", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount: parseFloat(amount), bankCode: bank })
    });
    const d = await res.json();
    if (!res.ok) { alert(d.error); setProcessing(false); return; }
    // Redirect to VNPay
    window.location.href = d.paymentUrl;
  }

  const fmt = (t: string) => new Date(t).toLocaleString("vi-VN");

  return (
    <div className="max-w-3xl mx-auto">
      {status === "success" && (
        <div className="card p-4 mb-4 bg-emerald-50 border-emerald-200 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xl">✓</div>
            <div className="flex-1">
              <p className="font-semibold text-emerald-900">Nạp tiền thành công!</p>
              <p className="text-sm text-emerald-700">+{Number(successAmount).toLocaleString("vi-VN")} ₫ đã được cộng vào ví. Mã GD: {txn}</p>
            </div>
          </div>
        </div>
      )}
      {status === "failed" && (
        <div className="card p-4 mb-4 bg-red-50 border-red-200 animate-fadeIn">
          <p className="font-semibold text-red-900">⚠️ Giao dịch thất bại hoặc bị huỷ</p>
          <p className="text-sm text-red-700 mt-1">Vui lòng thử lại. Tiền sẽ không bị trừ nếu giao dịch không thành công.</p>
        </div>
      )}

      {loading ? <div className="skeleton h-48 mb-6"></div> : (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white p-8 mb-6 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10" style={{backgroundImage:"radial-gradient(circle, white 0%, transparent 60%)"}}></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm opacity-80">Ví điện tử</p>
                <p className="text-xs opacity-60 mt-1">EV Charge Wallet</p>
              </div>
              <span className="text-3xl">💳</span>
            </div>
            <p className="text-sm opacity-80 mb-1">Số dư hiện tại</p>
            <p className="text-4xl font-bold mb-6">{wallet?.balance.toLocaleString("vi-VN")} ₫</p>
            <button onClick={() => setShowTopup(!showTopup)} className="bg-white text-emerald-700 px-5 py-2 rounded-lg font-medium hover:bg-emerald-50 transition shadow-sm">
              {showTopup ? "Đóng" : "+ Nạp tiền qua VNPay"}
            </button>
          </div>
        </div>
      )}

      {showTopup && (
        <div className="card p-6 mb-6 animate-fadeIn">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-2xl">🏦</div>
            <div>
              <h3 className="font-semibold text-slate-800">Nạp tiền qua VNPay</h3>
              <p className="text-xs text-slate-500">Cổng thanh toán VNPay (Sandbox)</p>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Chọn số tiền</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {TOPUP_AMOUNTS.map(v => (
              <button key={v} onClick={() => setAmount(v.toString())}
                className={`p-3 rounded-lg border-2 transition text-sm font-medium ${amount === v.toString() ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 hover:border-slate-300"}`}>
                {(v / 1000).toFixed(0)}k ₫
              </button>
            ))}
          </div>
          <input type="number" placeholder="Hoặc nhập số tiền (tối thiểu 10,000)" value={amount} onChange={e => setAmount(e.target.value)} className="input mb-4" />

          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phương thức thanh toán</p>
          <div className="space-y-2 mb-4">
            {BANKS.map(b => (
              <label key={b.code} className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition ${bank === b.code ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"}`}>
                <input type="radio" checked={bank === b.code} onChange={() => setBank(b.code)} />
                <span className="text-2xl">{b.icon}</span>
                <span className="text-sm font-medium">{b.label}</span>
              </label>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800 mb-4">
            ℹ️ <strong>Sandbox:</strong> Dùng thẻ test VNPay để thanh toán giả lập. Số thẻ: <code className="bg-white px-1">9704198526191432198</code>, OTP: <code className="bg-white px-1">123456</code>.
          </div>

          <div className="flex gap-2">
            <button onClick={topupVNPay} disabled={!amount || parseFloat(amount) < 10000 || processing} className="btn-primary flex-1">
              {processing ? "Đang chuyển hướng..." : `Thanh toán ${amount ? Number(amount).toLocaleString("vi-VN") + " ₫" : ""}`}
            </button>
            <button onClick={() => setShowTopup(false)} className="btn-secondary">Huỷ</button>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Lịch sử giao dịch</h3>
        {transactions.length === 0 ? (
          <p className="text-center py-8 text-slate-400 text-sm">Chưa có giao dịch</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map(t => (
              <div key={t.id} className="py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.amount > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                    {t.type === "TOPUP" ? "↓" : t.type === "REFUND" ? "↶" : "↑"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{t.note}</p>
                    <p className="text-xs text-slate-400">{fmt(t.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${t.amount > 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString("vi-VN")} ₫
                  </p>
                  <p className="text-xs text-slate-400">SD: {t.balance.toLocaleString("vi-VN")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WalletPage() {
  return (
    <AppShell title="Ví điện tử">
      <Suspense><WalletContent /></Suspense>
    </AppShell>
  );
}
