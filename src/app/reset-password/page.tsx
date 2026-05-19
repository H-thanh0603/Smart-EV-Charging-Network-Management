"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    if (password !== confirmPassword) { setError("Mật khẩu xác nhận không khớp"); setLoading(false); return; }
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    });
    const d = await res.json();
    setLoading(false);
    if (!res.ok) { setError(d.error); return; }
    setSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl items-center justify-center text-white text-2xl shadow-lg">🔒</div>
          <h1 className="text-2xl font-bold text-slate-800 mt-4">Đặt lại mật khẩu</h1>
        </div>
        <div className="card p-6">
          {success ? (
            <div className="text-center">
              <div className="text-5xl mb-3">✓</div>
              <p className="font-semibold text-emerald-700">Đặt lại thành công!</p>
              <p className="text-sm text-slate-500 mt-1">Đang chuyển hướng...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="label">Mật khẩu mới</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="Tối thiểu 6 ký tự" required minLength={6} />
              </div>
              <div>
                <label className="label">Xác nhận mật khẩu</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input" required />
              </div>
              <button type="submit" disabled={loading || !token} className="btn-primary w-full">{loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}</button>
              <Link href="/login" className="block text-center text-sm text-slate-500 hover:text-slate-700">← Quay lại đăng nhập</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>;
}
