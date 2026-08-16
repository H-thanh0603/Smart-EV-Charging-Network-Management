"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/ui/useTheme";
import { Icon, BoltMark } from "@/components/ui/Icon";

const techNav = [
  { href: "/technician", label: "Tổng quan", icon: "chart", desc: "Dashboard" },
  { href: "/admin/maintenance", label: "Tickets", icon: "wrench", desc: "Việc cần làm" },
  { href: "/stations", label: "Trạm sạc", icon: "building", desc: "Trạm" },
  { href: "/notifications", label: "Thông báo", icon: "bell", desc: "Cập nhật" },
];

export default function TechnicianShell({ children, title, user }: { children: React.ReactNode; title?: string; user: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [openTickets, setOpenTickets] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/maintenance", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        if (Array.isArray(d)) setOpenTickets(d.filter((t: any) => t.assignedToId === user?.id && (t.status === "OPEN" || t.status === "IN_PROGRESS")).length);
      }).catch(() => {});
  }, [user?.id]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    localStorage.removeItem("token"); localStorage.removeItem("user");
    router.push("/login");
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* TOP BAR — Orange themed (role color) */}
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b" style={{ background: "color-mix(in srgb, var(--card-bg) 85%, transparent)", borderColor: "var(--border)" }}>
        <div className="px-4 lg:px-6 h-16 flex items-center justify-between">
          <Link href="/admin/maintenance" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-400 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition"></div>
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500 flex items-center justify-center text-white shadow-lg">
                <BoltMark className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">Technician</p>
              <p className="text-[10px] text-muted">Trạm thực địa</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {openTickets > 0 && (
              <Link href="/admin/maintenance" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold animate-pulse"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                <Icon name="wrench" className="w-4 h-4" /> {openTickets} ticket
              </Link>
            )}
            <button onClick={toggle} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <Icon name={theme === "light" ? "moon" : "sun"} className="w-5 h-5" />
            </button>
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold shadow hover:scale-105 transition">
                {user?.name?.[0]?.toUpperCase()}
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute top-full right-0 mt-2 w-56 z-20 rounded-xl shadow-xl overflow-hidden animate-fadeIn" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                    <div className="p-3" style={{ background: "var(--accent-soft)" }}>
                      <p className="font-semibold text-sm">{user?.name}</p>
                      <p className="text-xs text-muted">Kỹ thuật viên</p>
                    </div>
                    <Link href="/profile" onClick={() => setShowMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                      <Icon name="settings" className="w-4 h-4" /> Tài khoản
                    </Link>
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
          <div className="border-t px-4 py-3" style={{ borderColor: "var(--border)" }}>
            <h1 className="text-xl font-bold">{title}</h1>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 lg:px-6 py-6 animate-fadeIn">{children}</main>

      {/* BOTTOM NAV — Big tap targets */}

    </div>
  );
}