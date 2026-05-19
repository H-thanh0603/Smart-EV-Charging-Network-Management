"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const driverNav = [
  { href: "/driver", label: "Tổng quan", icon: "🏠" },
  { href: "/stations", label: "Sạc ngay", icon: "⚡" },
  { href: "/sessions", label: "Đang sạc", icon: "🔋" },
  { href: "/driver/vehicles", label: "Xe", icon: "🚗" },
  { href: "/driver/earnings", label: "Doanh thu", icon: "💰" },
];

export default function DriverShell({ children, title, user }: { children: React.ReactNode; title?: string; user: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const [stats, setStats] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/wallet", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setStats({ balance: d.wallet?.balance || 0 }))
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    localStorage.clear();
    router.push("/login");
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* TOP HEADER - Brand + Profile */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white shadow-lg">
        <div className="px-4 lg:px-6 h-16 flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/driver" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-xl shadow-lg">🚗</div>
            <div>
              <p className="font-bold leading-tight">Xanh SM Driver</p>
              <p className="text-[10px] text-emerald-100">VinFast EV Network</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {stats && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur rounded-full text-sm font-bold">
                💳 {stats.balance.toLocaleString("vi-VN")} ₫
              </div>
            )}
            <Link href="/scan" className="p-2.5 bg-white/15 backdrop-blur rounded-lg hover:bg-white/25" title="Scan QR">
              📷
            </Link>
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold border-2 border-white/30">
                {user?.name?.[0]?.toUpperCase()}
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute top-full right-0 mt-2 w-56 z-20 rounded-xl shadow-xl overflow-hidden animate-fadeIn" style={{ background: "var(--card-bg)", border: "1px solid var(--border)", color: "var(--text)" }}>
                    <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                      <p className="font-semibold text-sm">{user?.name}</p>
                      <p className="text-xs text-slate-500">Tài xế Xanh SM</p>
                      <span className="badge-purple mt-1 inline-block">⭐ {user?.loyaltyTier || "BRONZE"}</span>
                    </div>
                    <Link href="/profile" onClick={() => setShowMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">👤 Tài khoản</Link>
                    <Link href="/wallet" onClick={() => setShowMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">💳 Ví</Link>
                    <Link href="/invoices" onClick={() => setShowMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">🧾 Hoá đơn</Link>
                    <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-t border-slate-100 dark:border-slate-700">🚪 Đăng xuất</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* TOP NAV — moved from bottom to here */}
        <nav className="border-t border-white/10 bg-white/5 backdrop-blur">
          <div className="max-w-7xl mx-auto px-2 lg:px-6 flex overflow-x-auto scrollbar-hide">
            {driverNav.map(item => {
              const active = pathname === item.href || (item.href !== "/driver" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-2 px-4 py-3 transition relative whitespace-nowrap ${active ? "text-white font-semibold" : "text-emerald-100 hover:text-white"}`}>
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                  {active && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-white rounded-full"></div>}
                </Link>
              );
            })}
          </div>
        </nav>

        {title && <div className="border-t border-white/10 px-4 py-3 max-w-7xl mx-auto"><h1 className="text-lg font-bold">{title}</h1></div>}
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6 animate-fadeIn">{children}</main>
    </div>
  );
}
