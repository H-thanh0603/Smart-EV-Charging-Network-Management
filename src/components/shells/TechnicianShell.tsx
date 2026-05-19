"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const techNav = [
  { href: "/admin/maintenance", label: "Tickets", icon: "🔧", desc: "Việc cần làm" },
  { href: "/stations", label: "Trạm sạc", icon: "🏢", desc: "Bản đồ trạm" },
  { href: "/notifications", label: "Thông báo", icon: "🔔", desc: "Cập nhật mới" },
];

export default function TechnicianShell({ children, title, user }: { children: React.ReactNode; title?: string; user: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const [openTickets, setOpenTickets] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as "light" | "dark") || "light";
    setTheme(savedTheme);
    const token = localStorage.getItem("token");
    fetch("/api/maintenance", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        if (Array.isArray(d)) setOpenTickets(d.filter((t: any) => t.assignedToId === user?.id && (t.status === "OPEN" || t.status === "IN_PROGRESS")).length);
      }).catch(() => {});
  }, [user?.id]);

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
    <div className="min-h-screen pb-24 lg:pb-0" style={{ background: "var(--bg)" }}>
      {/* TOP BAR — Orange themed */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 dark:from-orange-900/20 dark:to-amber-900/20 border-b border-orange-200/50 dark:border-orange-800/30">
        <div className="px-4 lg:px-6 h-16 flex items-center justify-between">
          <Link href="/admin/maintenance" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-400 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition"></div>
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500 flex items-center justify-center text-white text-xl shadow-lg">🔧</div>
            </div>
            <div>
              <p className="font-bold leading-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Technician</p>
              <p className="text-[10px] text-slate-500">Trạm thực địa</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {openTickets > 0 && (
              <Link href="/admin/maintenance" className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-bold animate-pulse">
                🔧 {openTickets} ticket
              </Link>
            )}
            <button onClick={toggleTheme} className="p-2.5 hover:bg-orange-100/50 dark:hover:bg-orange-900/20 rounded-lg">{theme === "light" ? "🌙" : "☀️"}</button>
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold shadow hover:scale-105 transition">
                {user?.name?.[0]?.toUpperCase()}
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute top-full right-0 mt-2 w-56 z-20 rounded-xl shadow-xl overflow-hidden animate-fadeIn" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                    <div className="p-3 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
                      <p className="font-semibold text-sm">{user?.name}</p>
                      <p className="text-xs text-slate-500">Kỹ thuật viên</p>
                    </div>
                    <Link href="/profile" onClick={() => setShowMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                      <span>👤</span> Tài khoản
                    </Link>
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
          <div className="border-t border-orange-200/30 dark:border-orange-800/20 px-4 py-3">
            <h1 className="text-xl font-bold">{title}</h1>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 lg:px-6 py-6 animate-fadeIn">{children}</main>

      {/* BOTTOM NAV — Big tap targets */}
      <nav className="fixed bottom-0 inset-x-0 z-30 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-t border-slate-200/50 dark:border-slate-700/50">
        <div className="grid grid-cols-3 max-w-md mx-auto">
          {techNav.map(item => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center justify-center py-3 transition relative ${active ? "text-orange-600" : "text-slate-500"}`}>
                {active && <div className="absolute top-0 w-12 h-1 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full"></div>}
                <span className={`text-2xl transition-transform ${active ? "scale-110" : ""}`}>{item.icon}</span>
                <span className="text-xs mt-1 font-bold">{item.label}</span>
                <span className="text-[9px] text-slate-400">{item.desc}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
