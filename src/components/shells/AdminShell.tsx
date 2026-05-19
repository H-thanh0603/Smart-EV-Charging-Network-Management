"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: "📊", group: "main" },
  { href: "/admin/stations", label: "Trạm sạc", icon: "🏢", group: "main" },
  { href: "/admin/users", label: "Người dùng", icon: "👥", group: "main" },
  { href: "/admin/maintenance", label: "Bảo trì", icon: "🔧", group: "ops" },
  { href: "/admin/tariffs", label: "Giá điện", icon: "💡", group: "ops" },
  { href: "/admin/vouchers", label: "Voucher", icon: "🎟️", group: "biz" },
  { href: "/admin/revenue", label: "Doanh thu", icon: "💰", group: "biz" },
  { href: "/admin/webhooks", label: "API & Webhook", icon: "🔌", group: "tech" },
];

const groups = { main: "Chính", ops: "Vận hành", biz: "Kinh doanh", tech: "Tích hợp" };

export default function AdminShell({ children, title, user }: { children: React.ReactNode; title?: string; user: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const [stats, setStats] = useState<any>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as "light" | "dark") || "dark";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
    const token = localStorage.getItem("token");
    fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setStats).catch(() => {});
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

  const grouped: Record<string, any[]> = {};
  adminNav.forEach(item => {
    if (!grouped[item.group]) grouped[item.group] = [];
    grouped[item.group].push(item);
  });

  return (
    <div className="min-h-screen flex" style={{ background: theme === "dark" ? "#0f172a" : "#f8fafc" }}>
      {/* SIDEBAR - Dark gradient */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)" }}>
        <div className="h-20 flex items-center gap-3 px-6 border-b border-white/10">
          <div className="relative">
            <div className="absolute inset-0 bg-violet-400 rounded-xl blur-lg opacity-50"></div>
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-violet-400 via-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-xl">⚡</div>
          </div>
          <div>
            <p className="font-bold text-white">EV Admin</p>
            <p className="text-xs text-violet-200">Control Center</p>
          </div>
        </div>

        <nav className="px-3 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 17rem)" }}>
          {Object.entries(grouped).map(([gk, items]) => (
            <div key={gk}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-violet-300/60">{groups[gk as keyof typeof groups]}</p>
              <div className="space-y-0.5">
                {items.map(item => {
                  const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/"));
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition relative group ${active ? "bg-white/10 text-white shadow-lg" : "text-violet-200/80 hover:bg-white/5 hover:text-white"}`}>
                      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-violet-400 to-pink-400 rounded-r-full"></div>}
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-white/10">
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-violet-300/60">Khu vực user</p>
            <Link href="/stations" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-violet-200/80 hover:bg-white/5 hover:text-white">
              <span>👁</span> Xem dưới góc Customer
            </Link>
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-black/20 backdrop-blur">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-violet-200/70 truncate">Administrator</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Link href="/profile" className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs text-violet-200 bg-white/5 hover:bg-white/10 transition">⚙️ Cài đặt</Link>
            <button onClick={toggleTheme} className="px-2 py-1.5 rounded-lg text-xs text-violet-200 bg-white/5 hover:bg-white/10 transition" title="Toggle theme">{theme === "light" ? "🌙" : "☀️"}</button>
            <button onClick={logout} className="px-2 py-1.5 rounded-lg text-xs text-red-300 bg-white/5 hover:bg-red-500/20 transition" title="Đăng xuất">🚪</button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 lg:ml-72">
        {/* TOP BAR with mini stats */}
        <header className="sticky top-0 z-20 backdrop-blur-xl border-b" style={{ background: theme === "dark" ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.85)", borderColor: theme === "dark" ? "rgba(148,163,184,0.15)" : "rgba(226,232,240,0.8)" }}>
          <div className="px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div>
                {title && <h1 className="text-xl font-bold">{title}</h1>}
                <p className="text-xs" style={{color:"var(--text-muted)"}}>{new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}</p>
              </div>
            </div>

            {/* Mini stats inline */}
            {stats && (
              <div className="hidden lg:flex items-center gap-2">
                {[
                  { label: "Trạm", value: stats.totalStations || 0, icon: "🏢", color: "from-violet-500 to-purple-600" },
                  { label: "Active", value: stats.activeStations || 0, icon: "🟢", color: "from-emerald-500 to-teal-600" },
                  { label: "User", value: stats.totalUsers || 0, icon: "👥", color: "from-blue-500 to-cyan-600" },
                  { label: "Phiên", value: stats.totalSessions || 0, icon: "⚡", color: "from-amber-500 to-orange-600" },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                    <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-xs shadow`}>{s.icon}</div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold tracking-wider" style={{color:"var(--text-muted)"}}>{s.label}</p>
                      <p className="text-sm font-bold leading-none">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1">
              <Link href="/notifications" className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </Link>
              <button onClick={toggleTheme} className="hidden lg:block p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">{theme === "light" ? "🌙" : "☀️"}</button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 animate-fadeIn">{children}</main>
      </div>
    </div>
  );
}
