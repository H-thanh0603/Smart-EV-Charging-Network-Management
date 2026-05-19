"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const d = await res.json();
    setResult(d);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl items-center justify-center text-white text-2xl shadow-lg">🔑</div>
          <h1 className="text-2xl font-bold text-slate-800 mt-4">Quên mật khẩu</h1>
          <p className="text-sm text-slate-500 mt-1">Nhập email để nhận link đặt lại</p>
        </div>

        <div className="card p-6">
          {result ? (
            <div>
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg mb-4">
                <p className="font-medium">✓ {result.message}</p>
              </div>
              {result.demoResetUrl && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs">
                  <p className="font-semibold text-amber-900 mb-2">Demo mode — link đặt lại:</p>
                  <a href={result.demoResetUrl} className="text-emerald-600 hover:underline break-all">{result.demoResetUrl}</a>
                </div>
              )}
              <Link href="/login" className="btn-secondary w-full mt-4">← Quay lại đăng nhập</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="email@example.com" required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Đang gửi..." : "Gửi link đặt lại"}
              </button>
              <Link href="/login" className="block text-center text-sm text-slate-500 hover:text-slate-700">← Quay lại đăng nhập</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
