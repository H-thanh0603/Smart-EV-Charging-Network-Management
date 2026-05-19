"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";

const TOPUP_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];
const BANKS = [
  { code: "VPBANK", label: "VP Bank", icon: "🏦", desc: "Chuyển khoản từ VP Bank" },
  { code: "VNPAYQR", label: "Quét QR (mọi ngân hàng)", icon: "📱", desc: "Quét QR bằng app ngân hàng" },
  { code: "VNBANK", label: "Thẻ ATM nội địa", icon: "💳", desc: "Vietcombank, BIDV, Techcombank..." },
  { code: "INTCARD", label: "Thẻ Visa/Master/JCB", icon: "🌐", desc: "Thẻ tín dụng quốc tế" },
];

const RECEIVER = {
  bank: "VP Bank",
  accountNo: "0368600557",
  accountName: "NGUYEN HUU THANH",
};

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
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl">🏦</div>
            <div>
              <h3 className="font-semibold">Nạp tiền vào ví</h3>
              <p className="text-xs" style={{color:"var(--text-muted)"}}>Chuyển khoản hoặc qua cổng VNPay</p>
            </div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{color:"var(--text-muted)"}}>Chọn số tiền</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {TOPUP_AMOUNTS.map(v => (
              <button key={v} onClick={() => setAmount(v.toString())}
                className={`p-3 rounded-lg border-2 transition text-sm font-medium ${amount === v.toString() ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}>
                {(v / 1000).toFixed(0)}k ₫
              </button>
            ))}
          </div>
          <input type="number" placeholder="Hoặc nhập số tiền (tối thiểu 10,000)" value={amount} onChange={e => setAmount(e.target.value)} className="input mb-4" />

          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{color:"var(--text-muted)"}}>Phương thức thanh toán</p>
          <div className="space-y-2 mb-4">
            {BANKS.map(b => (
              <label key={b.code} className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition ${bank === b.code ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}>
                <input type="radio" checked={bank === b.code} onChange={() => setBank(b.code)} className="mt-1" />
                <span className="text-2xl">{b.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{b.label}</p>
                  <p className="text-xs" style={{color:"var(--text-muted)"}}>{b.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {bank === "VPBANK" && amount && parseFloat(amount) >= 10000 && (
            <div className="mb-4 p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-300 dark:border-emerald-700">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-2xl shadow-lg">🏦</div>
                <div className="flex-1">
                  <p className="font-bold text-emerald-700 dark:text-emerald-300">Chuyển khoản đến tài khoản:</p>
                  <p className="text-xs" style={{color:"var(--text-muted)"}}>Mở app ngân hàng quét QR hoặc nhập thủ công</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs uppercase tracking-wider mb-1" style={{color:"var(--text-muted)"}}>Ngân hàng</p>
                  <p className="font-bold text-lg">{RECEIVER.bank}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs uppercase tracking-wider mb-1" style={{color:"var(--text-muted)"}}>Số tài khoản</p>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg font-mono">{RECEIVER.accountNo}</p>
                    <button onClick={() => { navigator.clipboard.writeText(RECEIVER.accountNo); alert("Đã copy số TK"); }} className="text-xs text-emerald-600 hover:underline">📋 Copy</button>
                  </div>
                </div>
                <div className="sm:col-span-2 bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs uppercase tracking-wider mb-1" style={{color:"var(--text-muted)"}}>Chủ tài khoản</p>
                  <p className="font-bold text-lg">{RECEIVER.accountName}</p>
                </div>
                <div className="sm:col-span-2 bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs uppercase tracking-wider mb-1" style={{color:"var(--text-muted)"}}>Số tiền</p>
                  <p className="font-bold text-2xl text-emerald-600">{Number(amount).toLocaleString("vi-VN")} ₫</p>
                </div>
                <div className="sm:col-span-2 bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs uppercase tracking-wider mb-1" style={{color:"var(--text-muted)"}}>Nội dung chuyển khoản</p>
                  <p className="font-bold font-mono text-emerald-600">NAP {wallet?.id?.slice(-6).toUpperCase() || "USER"}</p>
                </div>
              </div>
              <div className="flex justify-center mb-2">
                <img src={`https://img.vietqr.io/image/VPB-${RECEIVER.accountNo}-compact2.png?amount=${amount}&addInfo=NAP%20${(wallet?.id||"USER").slice(-6).toUpperCase()}&accountName=${encodeURIComponent(RECEIVER.accountName)}`} alt="QR" className="w-64 rounded-xl shadow-lg bg-white p-2" />
              </div>
              <p className="text-center text-xs" style={{color:"var(--text-muted)"}}>Mở app ngân hàng → Quét QR → Tự động điền số tiền + nội dung</p>
            </div>
          )}

          {bank !== "VPBANK" && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg text-xs text-amber-800 dark:text-amber-200 mb-4">
              ℹ️ <strong>Sandbox VNPay:</strong> Số thẻ: <code className="bg-white dark:bg-slate-900 px-1 rounded">9704198526191432198</code>, OTP: <code className="bg-white dark:bg-slate-900 px-1 rounded">123456</code>.
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={topupVNPay} disabled={!amount || parseFloat(amount) < 10000 || processing} className="btn-primary flex-1">
              {processing ? "Đang chuyển hướng..." : bank === "VPBANK" ? `Tôi đã chuyển khoản ${amount ? Number(amount).toLocaleString("vi-VN") + " ₫" : ""}` : `Thanh toán ${amount ? Number(amount).toLocaleString("vi-VN") + " ₫" : ""}`}
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
