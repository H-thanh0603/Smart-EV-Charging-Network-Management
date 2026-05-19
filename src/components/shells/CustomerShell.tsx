"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const customerNav = [
  { href: "/stations", label: "Trạm sạc", icon: "📍" },
  { href: "/reservations", label: "Đặt lịch", icon: "📅" },
  { href: "/sessions", label: "Đang sạc", icon: "⚡" },
  { href: "/invoices", label: "Hoá đơn", icon: "🧾" },
  { href: "/wallet", label: "Ví", icon: "💳" },
];

const moreNav = [
  { href: "/vouchers", label: "Voucher", icon: "🎟️" },
  { href: "/loyalty", label: "Điểm thưởng", icon: "⭐" },
  { href: "/history", label: "Lịch sử", icon: "📊" },
];

export default function CustomerShell({ children, title, user }: { children: React.ReactNode; title?: string; user: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as "light" | "dark") || "light";
    setTheme(savedTheme);
    const token = localStorage.getItem("token");
    fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setUnreadCount(Array.isArray(d) ? d.filter((n: any) => !n.read).length : 0))
      .catch(() => {});
    fetch("/api/wallet", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setWalletBalance(d.wallet?.balance || 0))
      .catch(() => {});
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    localStorage.removeItem("token"); localStorage.removeItem("user");
    router.push("/login");
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0" style={{ background: "var(--bg)" }}>
      {/* TOP BAR — Mobile + Desktop */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <Link href="/stations" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition"></div>
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold shadow-lg">⚡</div>
            </div>
            <div className="hidden sm:block">
              <p className="font-bold leading-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">EV Charge</p>
              <p className="text-[10px] text-slate-500">Sạc thông minh</p>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center gap-1">
            {customerNav.map(item => {
              const active = pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                  <span>{item.icon}</span><span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            {walletBalance !== null && (
              <Link href="/wallet" className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-semibold hover:scale-105 transition border border-emerald-200/50 dark:border-emerald-700/30">
                💳 {walletBalance.toLocaleString("vi-VN")}<span className="text-xs ml-0.5">₫</span>
              </Link>
            )}
            <Link href="/scan" className="p-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition" title="Quét QR">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
            </Link>
            <Link href="/notifications" className="relative p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center animate-pulse">{unreadCount}</span>}
            </Link>
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-semibold shadow hover:scale-105 transition">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute top-full right-0 mt-2 w-56 z-20 rounded-xl shadow-xl overflow-hidden animate-fadeIn" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                    <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                      <p className="font-semibold text-sm">{user?.name}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                      {user?.loyaltyTier && <span className="badge-purple mt-1.5 inline-block">⭐ {user.loyaltyTier}</span>}
                    </div>
                    {moreNav.map(item => (
                      <Link key={item.href} href={item.href} onClick={() => setShowMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                        <span>{item.icon}</span> {item.label}
                      </Link>
                    ))}
                    <Link href="/profile" onClick={() => setShowMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                      <span>👤</span> Tài khoản
                    </Link>
                    <button onClick={toggleTheme} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                      <span>{theme === "light" ? "🌙" : "☀️"}</span> {theme === "light" ? "Chế độ tối" : "Chế độ sáng"}
                    </button>
                    <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-t border-slate-100 dark:border-slate-700">
                      <span>🚪</span> Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {title && (
          <div className="lg:hidden border-t border-slate-200/50 dark:border-slate-700/50 px-4 py-3">
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 lg:px-6 py-6 animate-fadeIn">{children}</main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-t border-slate-200/50 dark:border-slate-700/50">
        <div className="grid grid-cols-5 max-w-md mx-auto">
          {customerNav.map(item => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center justify-center py-2.5 transition ${active ? "text-emerald-600" : "text-slate-500"}`}>
                <span className={`text-xl transition-transform ${active ? "scale-110" : ""}`}>{item.icon}</span>
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                {active && <div className="absolute top-0 w-10 h-0.5 bg-emerald-500 rounded-full"></div>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* FAB QR Scan - Mobile */}
      <Link href="/scan" className="lg:hidden fixed bottom-20 right-4 z-20 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 shadow-xl shadow-emerald-500/30 flex items-center justify-center text-white text-2xl hover:scale-110 transition active:scale-95">
        📷
      </Link>
    </div>
  );
}
