"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<"profile" | "password">("profile");
  const [form, setForm] = useState({ name: "", phone: "" });
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  async function load() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
    const u = await res.json();
    setUser(u);
    setForm({ name: u.name || "", phone: u.phone || "" });
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function saveProfile() {
    setMessage(null);
    const token = localStorage.getItem("token");
    const res = await fetch("/api/auth/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      const u = await res.json();
      localStorage.setItem("user", JSON.stringify(u));
      setMessage({ type: "success", text: "Đã cập nhật thông tin" });
      load();
    } else setMessage({ type: "error", text: "Lỗi cập nhật" });
  }

  async function changePassword() {
    setMessage(null);
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu xác nhận không khớp" });
      return;
    }
    const token = localStorage.getItem("token");
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword })
    });
    const d = await res.json();
    if (res.ok) {
      setMessage({ type: "success", text: "Đổi mật khẩu thành công" });
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } else setMessage({ type: "error", text: d.error });
  }

  if (loading) return <AppShell title="Cá nhân"><div className="skeleton h-64"></div></AppShell>;

  return (
    <AppShell title="Tài khoản">
      <div className="max-w-3xl mx-auto">
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{user?.name}</h2>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <div className="flex gap-2 mt-2">
                <span className="badge-blue">{user?.role}</span>
                {user?.loyaltyTier && <span className="badge-purple">⭐ {user.loyaltyTier}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-white p-1 rounded-lg border border-slate-200 w-fit">
          <button onClick={() => setTab("profile")} className={`px-4 py-2 rounded-md text-sm font-medium ${tab === "profile" ? "bg-slate-100 text-slate-800" : "text-slate-500"}`}>
            Thông tin
          </button>
          <button onClick={() => setTab("password")} className={`px-4 py-2 rounded-md text-sm font-medium ${tab === "password" ? "bg-slate-100 text-slate-800" : "text-slate-500"}`}>
            Mật khẩu
          </button>
        </div>

        {message && (
          <div className={`card p-3 mb-4 ${message.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
            {message.type === "success" ? "✓ " : "⚠️ "}{message.text}
          </div>
        )}

        {tab === "profile" ? (
          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Thông tin cá nhân</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input type="email" value={user?.email} disabled className="input bg-slate-50 cursor-not-allowed" />
                <p className="text-xs text-slate-400 mt-1">Email không thể thay đổi</p>
              </div>
              <div>
                <label className="label">Họ tên</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" />
              </div>
              <div>
                <label className="label">Số điện thoại</label>
                <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" placeholder="0901234567" />
              </div>
              <button onClick={saveProfile} className="btn-primary">Lưu thay đổi</button>
            </div>
          </div>
        ) : (
          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Đổi mật khẩu</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Mật khẩu hiện tại</label>
                <input type="password" value={pwForm.oldPassword} onChange={e => setPwForm({...pwForm, oldPassword: e.target.value})} className="input" />
              </div>
              <div>
                <label className="label">Mật khẩu mới</label>
                <input type="password" value={pwForm.newPassword} onChange={e => setPwForm({...pwForm, newPassword: e.target.value})} className="input" placeholder="Tối thiểu 6 ký tự" />
              </div>
              <div>
                <label className="label">Xác nhận mật khẩu mới</label>
                <input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm({...pwForm, confirmPassword: e.target.value})} className="input" />
              </div>
              <button onClick={changePassword} disabled={!pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirmPassword} className="btn-primary">
                Đổi mật khẩu
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
