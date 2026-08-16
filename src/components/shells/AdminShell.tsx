"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/ui/useTheme";
import { Icon, BoltMark } from "@/components/ui/Icon";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: "chart", group: "main" },
  { href: "/admin/stations", label: "Trạm sạc", icon: "building", group: "main" },
  { href: "/admin/live", label: "Giám sát realtime", icon: "radio", group: "main" },
  { href: "/admin/users", label: "Người dùng", icon: "users", group: "main" },
  { href: "/admin/fleets", label: "Đội xe (Fleet)", icon: "car", group: "main" },
  { href: "/admin/maintenance", label: "Bảo trì", icon: "wrench", group: "ops" },
  { href: "/admin/tariffs", label: "Giá điện", icon: "bolt", group: "ops" },
  { href: "/admin/reviews", label: "Đánh giá", icon: "star", group: "ops" },
  { href: "/admin/vouchers", label: "Voucher", icon: "ticket", group: "biz" },
  { href: "/admin/loyalty", label: "Loyalty", icon: "star", group: "biz" },
  { href: "/admin/payments", label: "Thanh toán", icon: "bank", group: "biz" },
  { href: "/admin/revenue", label: "Doanh thu", icon: "trending", group: "biz" },
  { href: "/admin/webhooks", label: "Webhook", icon: "link", group: "tech" },
  { href: "/admin/apikeys", label: "API Keys", icon: "key", group: "tech" },
];

const groups = { main: "Chính", ops: "Vận hành", biz: "Kinh doanh", tech: "Tích hợp" };

export default function AdminShell({ children, title, user }: { children: React.ReactNode; title?: string; user: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setStats).catch(() => {});
  }, []);

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
    <div className="min-h-screen flex" style={{ background: theme === "dark" ? "#0b1220" : "#f8fafc" }}>
      {/* SIDEBAR — deep-navy control console */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "linear-gradient(180deg, #0f172a 0%, #0b1220 100%)" }}>
        <div className="h-20 flex items-center gap-3 px-6 border-b border-white/10">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400 rounded-xl blur-lg opacity-40"></div>
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-xl">
              <BoltMark className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="font-bold text-white">EV Admin</p>
            <p className="text-xs text-emerald-200/70">Control Center</p>
          </div>
        </div>

        <nav className="px-3 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 17rem)" }}>
          {Object.entries(grouped).map(([gk, items]) => (
            <div key={gk}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{groups[gk as keyof typeof groups]}</p>
              <div className="space-y-0.5">
                {items.map(item => {
                  const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/"));
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition relative group ${active ? "live-dot bg-white/10 text-white shadow-lg" : "text-slate-300/80 hover:bg-white/5 hover:text-white"}`}>
                      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-emerald-400 to-cyan-400 rounded-r-full"></div>}
                      <Icon name={item.icon} className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-white/10">
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Khu vực user</p>
            <Link href="/stations" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300/80 hover:bg-white/5 hover:text-white">
              <Icon name="smartphone" className="w-4 h-4" /> Xem dưới góc Customer
            </Link>
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-black/30 backdrop-blur">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-white/5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.name}</p>
              <p className="text-xs text-emerald-200/70 truncate">⚡ Administrator</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Link href="/profile" className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm text-emerald-100 bg-white/10 hover:bg-white/20 transition font-medium">
              <Icon name="settings" className="w-4 h-4" /> Cài đặt
            </Link>
            <button onClick={toggle} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm text-emerald-100 bg-white/10 hover:bg-white/20 transition font-medium">
              <Icon name={theme === "light" ? "moon" : "sun"} className="w-4 h-4" /> {theme === "light" ? "Tối" : "Sáng"}
            </button>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 transition shadow-lg">
            <Icon name="logout" className="w-4 h-4" /> Đăng xuất
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 lg:ml-72">
        {/* TOP BAR with mini stats */}
        <header className="sticky top-0 z-20 backdrop-blur-xl border-b" style={{ background: theme === "dark" ? "rgba(11,18,32,0.85)" : "rgba(255,255,255,0.85)", borderColor: theme === "dark" ? "rgba(148,163,184,0.15)" : "rgba(226,232,240,0.8)" }}>
          <div className="px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <Icon name="menu" className="w-5 h-5" />
              </button>
              <div>
                {title && <h1 className="text-xl font-bold">{title}</h1>}
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}</p>
              </div>
            </div>

            {/* Mini stats inline */}
            {stats && (
              <div className="hidden lg:flex items-center gap-2">
                {[
                  { label: "Trạm", value: stats.totalStations || 0, icon: "building", color: "from-violet-500 to-purple-600" },
                  { label: "Active", value: stats.activeStations || 0, icon: "radio", color: "from-emerald-500 to-teal-600" },
                  { label: "User", value: stats.totalUsers || 0, icon: "users", color: "from-blue-500 to-cyan-600" },
                  { label: "Phiên", value: stats.totalSessions || 0, icon: "bolt", color: "from-amber-500 to-orange-600" },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                    <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-xs shadow`}>
                      <Icon name={s.icon} className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                      <p className="text-sm font-bold leading-none">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1">
              <Link href="/notifications" className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <Icon name="bell" className="w-5 h-5" />
              </Link>
              <button onClick={toggle} className="hidden lg:block p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <Icon name={theme === "light" ? "moon" : "sun"} className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 animate-fadeIn">{children}</main>
      </div>
    </div>
  );
}