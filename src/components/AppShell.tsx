"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { href: "/stations", label: "Trạm sạc", icon: "📍" },
  { href: "/reservations", label: "Lịch đặt", icon: "📅" },
  { href: "/sessions", label: "Phiên sạc", icon: "⚡" },
  { href: "/invoices", label: "Hoá đơn", icon: "🧾" },
  { href: "/wallet", label: "Ví", icon: "💳" },
  { href: "/vouchers", label: "Voucher", icon: "🎟️" },
  { href: "/loyalty", label: "Điểm thưởng", icon: "⭐" },
  { href: "/history", label: "Lịch sử", icon: "📊" },
];

export default function AppShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const u = localStorage.getItem("user");
    if (!u) { router.push("/login"); return; }
    setUser(JSON.parse(u));

    const savedTheme = (localStorage.getItem("theme") as "light" | "dark") || "light";
    setTheme(savedTheme);

    const token = localStorage.getItem("token");
    fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setUnreadCount(Array.isArray(d) ? d.filter((n: any) => !n.read).length : 0))
      .catch(() => {});
    fetch("/api/wallet", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setWalletBalance(d.wallet?.balance || 0))
      .catch(() => {});

    if ("Notification" in window && navigator.serviceWorker) {
      navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription().then(sub => setPushEnabled(!!sub)));
    }
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  async function togglePush() {
    if (pushEnabled) {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push/subscribe", {
            method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
            body: JSON.stringify({ endpoint: sub.endpoint })
          });
          await sub.unsubscribe();
        }
        setPushEnabled(false);
      } catch { alert("Lỗi tắt push notification"); }
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { alert("Bạn cần cấp quyền thông báo"); return; }
      const reg = await navigator.serviceWorker.ready;
      const { vapidPublicKey } = await fetch("/api/push/subscribe").then(r => r.json());
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      await fetch("/api/push/subscribe", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ subscription: sub })
      });
      setPushEnabled(true);
      // Send test push
      await fetch("/api/push/test", { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
    } catch (e: any) { alert("Lỗi: " + e.message); }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "var(--card-bg)", borderRight: "1px solid var(--border)" }}>
        <div className="h-16 flex items-center gap-3 px-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold">⚡</div>
          <div>
            <p className="font-bold">EV Charge</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Smart Charging</p>
          </div>
        </div>
        <nav className="px-3 py-4 space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 16rem)" }}>
          {navItems.map(item => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                style={!active ? { color: "var(--text-muted)" } : {}}>
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          {user?.role === "ADMIN" && (
            <>
              <div className="pt-4 pb-1 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Admin</div>
              {[
                { href: "/admin", label: "Dashboard", icon: "📊" },
                { href: "/admin/stations", label: "Trạm", icon: "🏢" },
                { href: "/admin/users", label: "Người dùng", icon: "👥" },
                { href: "/admin/maintenance", label: "Bảo trì", icon: "🔧" },
                { href: "/admin/tariffs", label: "Giá điện", icon: "💡" },
                { href: "/admin/vouchers", label: "Voucher", icon: "🎟️" },
                { href: "/admin/revenue", label: "Doanh thu", icon: "💰" },
                { href: "/admin/webhooks", label: "API & Webhook", icon: "🔌" },
              ].map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${active ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                    style={!active ? { color: "var(--text-muted)" } : {}}>
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
          {user?.role === "TECHNICIAN" && (
            <Link href="/admin/maintenance" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
              <span>🔧</span><span>Ticket bảo trì</span>
            </Link>
          )}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4" style={{ borderTop: "1px solid var(--border)", background: "var(--card-bg)" }}>
          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-full flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg p-2 transition">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user?.role}</p>
              </div>
              <svg className="w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
            </button>
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg shadow-lg overflow-hidden animate-fadeIn" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                <Link href="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                  <span>👤</span> Tài khoản
                </Link>
                <button onClick={togglePush} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                  <span>{pushEnabled ? "🔕" : "🔔"}</span> {pushEnabled ? "Tắt thông báo" : "Bật thông báo"}
                </button>
                <button onClick={toggleTheme} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                  <span>{theme === "light" ? "🌙" : "☀️"}</span> {theme === "light" ? "Chế độ tối" : "Chế độ sáng"}
                </button>
                <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" style={{ borderTop: "1px solid var(--border)" }}>
                  <span>🚪</span> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="lg:pl-64">
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10" style={{ background: "var(--card-bg)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            {title && <h1 className="text-lg font-semibold">{title}</h1>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" title={theme === "light" ? "Chế độ tối" : "Chế độ sáng"}>
              {theme === "light" ? "🌙" : "☀️"}
            </button>
            {walletBalance !== null && (
              <Link href="/wallet" className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-500/20">
                💳 {walletBalance.toLocaleString("vi-VN")} ₫
              </Link>
            )}
            <Link href="/notifications" className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>}
            </Link>
            <Link href="/scan" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" title="Quét QR">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
            </Link>
          </div>
        </header>
        <main className="p-4 lg:p-8 animate-fadeIn">{children}</main>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - base64.length % 4) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
