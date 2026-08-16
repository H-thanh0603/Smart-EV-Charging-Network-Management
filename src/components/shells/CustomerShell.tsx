"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/ui/useTheme";
import { Icon, BoltMark } from "@/components/ui/Icon";

const customerNav = [
  { href: "/stations", label: "Trạm sạc", icon: "mappin" },
  { href: "/reservations", label: "Đặt lịch", icon: "calendar" },
  { href: "/sessions", label: "Đang sạc", icon: "bolt" },
  { href: "/invoices", label: "Hoá đơn", icon: "receipt" },
  { href: "/wallet", label: "Ví", icon: "wallet" },
];

const moreNav = [
  { href: "/vouchers", label: "Voucher", icon: "ticket" },
  { href: "/loyalty", label: "Điểm thưởng", icon: "star" },
  { href: "/history", label: "Lịch sử", icon: "chart" },
];

export default function CustomerShell({ children, title, user }: { children: React.ReactNode; title?: string; user: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setUnreadCount(Array.isArray(d) ? d.filter((n: any) => !n.read).length : 0))
      .catch(() => {});
    fetch("/api/wallet", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setWalletBalance(d.wallet?.balance || 0))
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    localStorage.removeItem("token"); localStorage.removeItem("user");
    router.push("/login");
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0" style={{ background: "var(--bg)" }}>
      {/* TOP BAR */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: "color-mix(in srgb, var(--card-bg) 85%, transparent)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <Link href="/stations" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition"></div>
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-lg">
                <BoltMark className="w-5 h-5" />
              </div>
            </div>
            <div className="hidden sm:block">
              <p className="font-bold leading-tight text-accent">EV Charge</p>
              <p className="text-[10px] text-muted">Sạc thông minh</p>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center gap-1">
            {customerNav.map(item => {
              const active = pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${active ? "live-dot bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            {walletBalance !== null && (
              <Link href="/wallet" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold hover:scale-105 transition border"
                style={{ background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--border)" }}>
                <Icon name="wallet" className="w-4 h-4" />
                {walletBalance.toLocaleString("vi-VN")}<span className="text-xs ml-0.5">₫</span>
              </Link>
            )}
            <Link href="/scan" className="p-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition" title="Quét QR">
              <Icon name="camera" className="w-5 h-5 text-emerald-600" />
            </Link>
            <Link href="/notifications" className="relative p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
              <Icon name="bell" className="w-5 h-5" />
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
                    <div className="p-3" style={{ background: "var(--accent-soft)" }}>
                      <p className="font-semibold text-sm">{user?.name}</p>
                      <p className="text-xs text-muted">{user?.email}</p>
                      {user?.loyaltyTier && <span className="badge-purple mt-1.5 inline-block">{user.loyaltyTier}</span>}
                    </div>
                    {moreNav.map(item => (
                      <Link key={item.href} href={item.href} onClick={() => setShowMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                        <Icon name={item.icon} className="w-4 h-4" /> {item.label}
                      </Link>
                    ))}
                    <Link href="/profile" onClick={() => setShowMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 border-t" style={{ borderColor: "var(--border)" }}>
                      <Icon name="settings" className="w-4 h-4" /> Tài khoản
                    </Link>
                    <button onClick={toggle} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                      <Icon name={theme === "light" ? "moon" : "sun"} className="w-4 h-4" /> {theme === "light" ? "Chế độ tối" : "Chế độ sáng"}
                    </button>
                    <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-t" style={{ borderColor: "var(--border)" }}>
                      <Icon name="logout" className="w-4 h-4" /> Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {title && (
          <div className="lg:hidden border-t px-4 py-3" style={{ borderColor: "var(--border)" }}>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 lg:px-6 py-6 animate-fadeIn">{children}</main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 backdrop-blur-xl border-t" style={{ background: "color-mix(in srgb, var(--card-bg) 90%, transparent)", borderColor: "var(--border)" }}>
        <div className="grid grid-cols-5 max-w-md mx-auto">
          {customerNav.map(item => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center justify-center py-2.5 transition ${active ? "text-emerald-600" : "text-muted"}`}>
                <Icon name={item.icon} className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} />
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                {active && <div className="absolute top-0 w-10 h-0.5 bg-emerald-500 rounded-full"></div>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* FAB QR Scan - Mobile */}
      <Link href="/scan" className="lg:hidden fixed bottom-20 right-4 z-20 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 shadow-xl shadow-emerald-500/30 flex items-center justify-center text-white hover:scale-110 transition active:scale-95">
        <Icon name="camera" className="w-6 h-6" />
      </Link>
    </div>
  );
}