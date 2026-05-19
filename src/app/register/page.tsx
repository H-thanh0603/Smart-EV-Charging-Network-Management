"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl items-center justify-center text-white text-2xl shadow-lg">⚡</div>
          <h1 className="text-2xl font-bold text-slate-800 mt-4">Tạo tài khoản</h1>
          <p className="text-sm text-slate-500 mt-1">Bắt đầu hành trình sạc xanh</p>
        </div>

        <div className="card p-6">
          {error && <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Họ tên</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" placeholder="Nguyễn Văn A" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input" placeholder="email@example.com" required />
            </div>
            <div>
              <label className="label">Số điện thoại</label>
              <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" placeholder="0901234567" />
            </div>
            <div>
              <label className="label">Mật khẩu</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input" placeholder="Tối thiểu 6 ký tự" required minLength={6} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Đang tạo..." : "Tạo tài khoản →"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-emerald-600 font-medium hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
