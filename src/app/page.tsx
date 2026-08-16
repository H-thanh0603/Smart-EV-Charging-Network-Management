"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, BoltMark } from "@/components/ui/Icon";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const u = localStorage.getItem("user");
    if (u) {
      const parsed = JSON.parse(u);
      setUser(parsed);
    }
  }, []);

  function goToDashboard() {
    if (!user) { router.push("/login"); return; }
    if (user.role === "ADMIN") router.push("/admin");
    else if (user.role === "TECHNICIAN") router.push("/technician");
    else if (user.role === "DRIVER") router.push("/driver");
    else router.push("/stations");
  }

  const features = [
    { icon: "calendar", t: "Đặt chỗ thông minh", d: "Đặt trụ trước, hệ thống tự huỷ nếu không check-in. Đặt định kỳ theo lịch tuần." },
    { icon: "camera", t: "Quét QR sạc", d: "Đến trạm, mở app quét QR trụ là vào sạc. Camera tự kích hoạt." },
    { icon: "bank", t: "Ví & VNPay", d: "Nạp ví trong app qua VNPay sandbox, thanh toán hoá đơn tự động." },
    { icon: "ticket", t: "Voucher & Loyalty", d: "Mã giảm giá theo %/VND, tích điểm BRONZE → SILVER → GOLD → PLATINUM." },
    { icon: "car", t: "Fleet Management", d: "Quản lý đội xe Xanh SM/Lazada, ví dùng chung, giảm giá đặc thù." },
    { icon: "bell", t: "Push Notification", d: "Nhắc lịch sạc, báo hoá đơn, cảnh báo sự cố — qua Service Worker." },
    { icon: "wrench", t: "Bảo trì & Ticket", d: "Kỹ thuật viên nhận ticket, theo dõi heartbeat trụ, log sự cố." },
    { icon: "chart", t: "Dashboard quản trị", d: "Thống kê doanh thu, người dùng, sản lượng kWh, peak/off-peak tariff." },
    { icon: "link", t: "Webhook & API", d: "Tích hợp đối tác qua API key, webhook event-driven realtime." },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: "color-mix(in srgb, var(--card-bg) 85%, transparent)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-md">
              <BoltMark className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-100">EV Charge</div>
              <div className="text-[10px] text-emerald-600 font-medium -mt-0.5">V-GREEN × XANH SM</div>
            </div>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4 text-sm">
            <a href="#features" className="hidden sm:inline text-muted hover:text-emerald-600">Tính năng</a>
            <a href="#stats" className="hidden sm:inline text-muted hover:text-emerald-600">Số liệu</a>
            <a href="#roles" className="hidden sm:inline text-muted hover:text-emerald-600">Đối tượng</a>
            {mounted && user ? (
              <button onClick={goToDashboard} className="btn-primary !py-1.5">Vào hệ thống</button>
            ) : (
              <>
                <Link href="/login" className="btn-secondary !py-1.5">Đăng nhập</Link>
                <Link href="/register" className="btn-primary !py-1.5">Đăng ký</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* HERO — volt-line, Space Grotesk */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium mb-4" style={{ background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--border)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Mạng lưới sạc thông minh #1 Việt Nam
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Sạc xe điện <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">thông minh</span> & nhanh chóng
            </h1>
            <p className="mt-5 text-lg text-muted leading-relaxed">
              Đặt chỗ trước, quét QR sạc, thanh toán VNPay, tích điểm loyalty.
              Hệ thống quản lý mạng lưới trạm sạc cho cá nhân, tài xế và đội xe (fleet).
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary !px-6 !py-3 text-base">Bắt đầu miễn phí</Link>
              <Link href="/stations" className="btn-secondary !px-6 !py-3 text-base">Xem bản đồ trạm</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted">
              <div className="flex items-center gap-2"><Icon name="ticket" className="w-4 h-4 text-emerald-500" /> Voucher chào mừng 50%</div>
              <div className="flex items-center gap-2"><Icon name="car" className="w-4 h-4 text-emerald-500" /> Fleet Xanh SM giảm 15%</div>
              <div className="flex items-center gap-2"><Icon name="bell" className="w-4 h-4 text-emerald-500" /> Push notification</div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 blur-3xl rounded-full"></div>
            <div className="relative card volt-line rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-muted">Trạm gần bạn</div>
                  <div className="font-bold">V-GREEN Quận 1</div>
                </div>
                <span className="badge-green"><Icon name="radio" className="w-3 h-3 mr-1" /> 12 trụ rảnh</span>
              </div>
              <div className="space-y-3">
                {[
                  { num: "A-01", power: "150 kW", status: "AVAILABLE", color: "bg-emerald-500" },
                  { num: "A-02", power: "60 kW", status: "OCCUPIED", color: "bg-amber-500" },
                  { num: "A-03", power: "150 kW", status: "AVAILABLE", color: "bg-emerald-500" },
                  { num: "A-04", power: "30 kW", status: "AVAILABLE", color: "bg-emerald-500" },
                ].map((s) => (
                  <div key={s.num} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center text-white shadow`}>
                      <BoltMark className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">Trụ {s.num}</div>
                      <div className="text-xs text-muted">{s.power} · CCS2</div>
                    </div>
                    <div className={`text-xs font-medium ${s.status === "AVAILABLE" ? "text-emerald-600" : "text-amber-600"}`}>
                      {s.status === "AVAILABLE" ? "Trống" : "Đang sạc"}
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/stations"><button className="btn-primary w-full mt-4">Đặt chỗ ngay</button></Link>
            </div>
          </div>
        </div>
      </section>

      <section id="stats" className="border-y" style={{ background: "var(--card-bg)", borderColor: "var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { v: "50+", l: "Trạm sạc V-GREEN" },
              { v: "300+", l: "Trụ sạc CCS2/CHAdeMO" },
              { v: "15%", l: "Tiết kiệm cho fleet" },
              { v: "24/7", l: "Hỗ trợ kỹ thuật" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">{s.v}</div>
                <div className="text-sm text-muted mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 rounded-full border text-xs font-medium mb-3" style={{ background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--border)" }}>Tính năng nổi bật</div>
          <h2 className="text-3xl sm:text-4xl font-bold">Mọi thứ bạn cần để sạc xe điện</h2>
          <p className="mt-3 text-muted max-w-2xl mx-auto">Từ đặt chỗ tới thanh toán, từ cá nhân đến đội xe — quản lý trọn vẹn trên một nền tảng.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.t} className="card volt-line p-6 hover:-translate-y-0.5 transition-transform">
              <div className="w-11 h-11 rounded-xl mb-3 flex items-center justify-center text-emerald-600" style={{ background: "var(--accent-soft)" }}>
                <Icon name={f.icon} className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">{f.t}</h3>
              <p className="text-sm text-muted leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="roles" className="border-y" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">Dành cho mọi đối tượng</h2>
            <p className="mt-3 text-muted">4 vai trò, 4 trải nghiệm tối ưu — login một lần, hệ thống tự nhận diện.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { role: "Khách hàng", icon: "users", color: "from-emerald-500 to-teal-600", feats: ["Tìm trạm bản đồ", "Đặt chỗ + QR", "Ví & voucher", "Lịch sử + hoá đơn"], demo: "customer@evcharge.com" },
              { role: "Tài xế Fleet", icon: "car", color: "from-cyan-500 to-blue-600", feats: ["Báo cáo earnings", "Xe quản lý", "Ưu đãi fleet 15%", "Lịch trình tối ưu"], demo: "driver@xanhsm.com" },
              { role: "Kỹ thuật viên", icon: "wrench", color: "from-amber-500 to-orange-600", feats: ["Ticket bảo trì", "Heartbeat trụ", "Log sự cố", "Phân công job"], demo: "tech@evcharge.com" },
              { role: "Quản trị viên", icon: "shield", color: "from-purple-500 to-pink-600", feats: ["Thống kê toàn cảnh", "Trạm + tariff", "Voucher + webhook", "Doanh thu kWh"], demo: "admin@evcharge.com" },
            ].map((r) => (
              <div key={r.role} className="card volt-line p-6 relative overflow-hidden">
                <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${r.color} opacity-20`}></div>
                <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white mb-3 shadow-lg`}>
                  <Icon name={r.icon} className="w-6 h-6" />
                </div>
                <h3 className="relative font-semibold mb-3">{r.role}</h3>
                <ul className="relative space-y-1.5 text-sm text-muted mb-4">
                  {r.feats.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Icon name="check" className="w-3.5 h-3.5 text-emerald-500" />{f}
                    </li>
                  ))}
                </ul>
                <div className="text-[11px] text-muted font-mono pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  Demo: {r.demo}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center text-sm text-muted">
            Mật khẩu mọi tài khoản demo: <code className="px-2 py-0.5 rounded border font-mono text-emerald-600" style={{ background: "var(--card-bg)", borderColor: "var(--border)" }}>123456</code>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="card volt-line p-8 sm:p-12 bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10"></div>
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/10"></div>
          <div className="relative max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Sẵn sàng sạc xanh hơn?</h2>
            <p className="text-emerald-50 mb-6 text-lg">Đăng ký 30 giây — nhận voucher WELCOME50 giảm 50% (tối đa 50K) cho lần sạc đầu tiên.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className="px-6 py-3 rounded-lg bg-white text-emerald-600 font-semibold hover:shadow-xl transition">Đăng ký miễn phí</Link>
              <Link href="/login" className="px-6 py-3 rounded-lg border-2 border-white/40 text-white font-semibold hover:bg-white/10 transition">Đăng nhập</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t" style={{ background: "var(--card-bg)", borderColor: "var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
          <div className="flex items-center gap-2">
            <span className="text-emerald-500"><BoltMark className="w-4 h-4" /></span>
            EV Charge — Smart Charging Network · © 2025
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/H-thanh0603/Smart-EV-Charging-Network-Management" target="_blank" rel="noopener" className="hover:text-emerald-600">GitHub</a>
            <span>·</span>
            <span>Powered by Next.js + Prisma 7</span>
          </div>
        </div>
      </footer>
    </div>
  );
}