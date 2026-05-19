"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include"
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    if (data.user.role === "ADMIN") router.push("/admin");
    else router.push("/stations");
  }

  function quickLogin(e: string) { setEmail(e); setPassword("123456"); }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 30% 20%, white 0%, transparent 50%), radial-gradient(circle at 70% 80%, white 0%, transparent 50%)"}}></div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-2xl">⚡</div>
            <span className="font-bold text-xl">EV Charge</span>
          </div>
          <div>
            <h2 className="text-4xl font-bold leading-tight mb-4">Sạc xe điện<br/>thông minh hơn.</h2>
            <p className="text-emerald-100 text-lg max-w-md">Mạng lưới trạm sạc rộng khắp, đặt lịch nhanh, theo dõi thông minh.</p>
            <div className="grid grid-cols-3 gap-6 mt-12">
              {[{n:"100+",l:"Trạm sạc"},{n:"24/7",l:"Vận hành"},{n:"4.9★",l:"Đánh giá"}].map(s => (
                <div key={s.l}>
                  <div className="text-3xl font-bold">{s.n}</div>
                  <div className="text-sm text-emerald-100">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm text-emerald-100">© 2026 EV Charge Vietnam</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl items-center justify-center text-white text-2xl shadow-lg">⚡</div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Đăng nhập</h1>
          <p className="text-sm text-slate-500 mb-8">Chào mừng quay lại! Đăng nhập để tiếp tục.</p>

          {error && <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm flex items-start gap-2">
            <span>⚠️</span><span>{error}</span>
          </div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="email@example.com" required />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-slate-700">Mật khẩu</label>
                <Link href="/forgot-password" className="text-xs text-emerald-600 hover:underline">Quên mật khẩu?</Link>
              </div>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="input pr-10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Đang đăng nhập..." : "Đăng nhập →"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-emerald-600 font-medium hover:underline">Đăng ký miễn phí</Link>
          </p>

          <div className="mt-8 p-4 bg-white border border-slate-100 rounded-xl">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tài khoản demo (click để điền)</p>
            <div className="space-y-2">
              {[
                {e:"admin@evcharge.com",l:"Admin",c:"text-blue-600"},
                {e:"customer@evcharge.com",l:"Khách hàng",c:"text-emerald-600"},
                {e:"vip@evcharge.com",l:"VIP Gold",c:"text-amber-600"},
                {e:"tech@evcharge.com",l:"Kỹ thuật viên",c:"text-orange-600"},
              ].map(d => (
                <button key={d.e} onClick={() => quickLogin(d.e)} className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg text-sm group">
                  <span className={d.c + " font-medium"}>{d.l}</span>
                  <span className="text-slate-400 text-xs group-hover:text-slate-600">{d.e}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
