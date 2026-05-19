"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Link from "next/link";

const STATION_IMAGES = [
  "https://images.unsplash.com/photo-1647500666543-d5ddd6f8ec40?w=800&q=80",
  "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80",
  "https://images.unsplash.com/photo-1633699300063-b40c1e9d4ad3?w=800&q=80",
  "https://images.unsplash.com/photo-1697204579729-8d52d9f7dbf0?w=800&q=80",
  "https://images.unsplash.com/photo-1683009427666-340595e57e43?w=800&q=80",
  "https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?w=800&q=80",
];

const AMENITY_OPTIONS = [
  { v: "wifi", l: "📶 Wifi" }, { v: "toilet", l: "🚻 WC" },
  { v: "cafe", l: "☕ Cafe" }, { v: "parking", l: "🅿️ Bãi xe" },
  { v: "shopping", l: "🛍️ Mua sắm" }, { v: "security", l: "🛡️ Bảo vệ" },
  { v: "vip-lounge", l: "⭐ VIP Lounge" }, { v: "food-court", l: "🍜 Food Court" },
  { v: "supermarket", l: "🛒 Siêu thị" }, { v: "kids-area", l: "🎈 Khu trẻ em" },
  { v: "view", l: "🏞️ View đẹp" },
];

export default function AdminStationsPage() {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");

  const empty = {
    id: "", name: "", address: "", city: "Hồ Chí Minh", district: "",
    lat: "", lng: "", brand: "V-GREEN", isPremium: false,
    openHours: "24/7", phone: "1900 232389", description: "",
    amenities: [] as string[], imageUrl: STATION_IMAGES[0]
  };
  const [form, setForm] = useState(empty);

  async function load() {
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch("/api/stations", { headers: { Authorization: `Bearer ${token}` } });
    setStations(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setShowForm(true);
  }

  function openEdit(s: any) {
    setEditing(s);
    setForm({
      id: s.id, name: s.name, address: s.address, city: s.city,
      district: s.district || "", lat: s.lat?.toString() || "", lng: s.lng?.toString() || "",
      brand: s.brand || "V-GREEN", isPremium: s.isPremium || false,
      openHours: s.openHours || "24/7", phone: s.phone || "", description: s.description || "",
      amenities: s.amenities ? s.amenities.split(",").filter(Boolean) : [],
      imageUrl: s.imageUrl || STATION_IMAGES[0]
    });
    setShowForm(true);
  }

  async function save() {
    const token = localStorage.getItem("token");
    const body = { ...form, amenities: form.amenities.join(",") };
    const res = await fetch("/api/admin/stations", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    if (res.ok) { setShowForm(false); load(); }
    else { const d = await res.json(); alert(d.error || "Lỗi"); }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Xoá trạm "${name}"? Dữ liệu liên quan sẽ mất.`)) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/stations?id=${encodeURIComponent(id)}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) load();
    else alert("Không xoá được");
  }

  function toggleAmenity(v: string) {
    setForm(f => ({ ...f, amenities: f.amenities.includes(v) ? f.amenities.filter(x => x !== v) : [...f.amenities, v] }));
  }

  const filtered = stations.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell title="Quản lý trạm sạc">
      <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
        <div className="flex gap-3 items-center flex-1 min-w-0">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Tìm trạm..." className="input max-w-md" />
          <p className="text-sm whitespace-nowrap" style={{color:"var(--text-muted)"}}>{filtered.length}/{stations.length} trạm</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Thêm trạm</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="card max-w-2xl w-full p-6 my-8" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">{editing ? "Sửa trạm sạc" : "Thêm trạm sạc mới"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><label className="label">Tên trạm *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" /></div>
              <div className="sm:col-span-2"><label className="label">Địa chỉ *</label><input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="input" /></div>
              <div><label className="label">Thành phố *</label>
                <select value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="input">
                  <option>Hồ Chí Minh</option><option>Hà Nội</option><option>Đà Nẵng</option>
                  <option>Hải Phòng</option><option>Cần Thơ</option><option>Nha Trang</option>
                </select>
              </div>
              <div><label className="label">Quận / Huyện</label><input value={form.district} onChange={e => setForm({...form, district: e.target.value})} className="input" placeholder="Quận 1" /></div>
              <div><label className="label">Vĩ độ (lat)</label><input type="number" step="any" value={form.lat} onChange={e => setForm({...form, lat: e.target.value})} className="input" placeholder="10.7765" /></div>
              <div><label className="label">Kinh độ (lng)</label><input type="number" step="any" value={form.lng} onChange={e => setForm({...form, lng: e.target.value})} className="input" placeholder="106.7019" /></div>
              <div><label className="label">Thương hiệu</label>
                <select value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="input">
                  <option>V-GREEN</option><option>ChargePlus</option><option>EVOne</option><option>Khác</option>
                </select>
              </div>
              <div><label className="label">Giờ mở cửa</label><input value={form.openHours} onChange={e => setForm({...form, openHours: e.target.value})} className="input" /></div>
              <div><label className="label">SĐT</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" /></div>
              <div className="flex items-end"><label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPremium} onChange={e => setForm({...form, isPremium: e.target.checked})} className="w-4 h-4" />
                <span className="text-sm font-medium">⭐ Trạm Premium</span>
              </label></div>
              <div className="sm:col-span-2"><label className="label">Mô tả</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input min-h-20" />
              </div>
              <div className="sm:col-span-2"><label className="label">Hình ảnh (chọn hoặc dán URL)</label>
                <input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="input mb-2" />
                <div className="grid grid-cols-3 gap-2">
                  {STATION_IMAGES.map(url => (
                    <button key={url} onClick={() => setForm({...form, imageUrl: url})} type="button"
                      className={`relative h-20 rounded-lg overflow-hidden border-2 ${form.imageUrl === url ? "border-emerald-500" : "border-transparent"}`}>
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2"><label className="label">Tiện ích</label>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_OPTIONS.map(a => (
                    <button key={a.v} onClick={() => toggleAmenity(a.v)} type="button"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border-2 ${form.amenities.includes(a.v) ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/30" : "border-slate-200 dark:border-slate-700"}`}>
                      {a.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={save} disabled={!form.name || !form.address} className="btn-primary flex-1">💾 {editing ? "Lưu" : "Thêm"}</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">Huỷ</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="skeleton h-32"></div> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(s => (
            <div key={s.id} className="card overflow-hidden">
              {s.thumbnailUrl && <div className="h-32 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img src={s.thumbnailUrl} alt={s.name} className="w-full h-full object-cover" />
              </div>}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{s.name}</h3>
                      {s.isPremium && <span className="badge-purple">⭐ Premium</span>}
                      {s.brand && <span className="badge-gray">{s.brand}</span>}
                    </div>
                    <p className="text-xs mt-1 truncate" style={{color:"var(--text-muted)"}}>📍 {s.address}, {s.city}</p>
                    <p className="text-xs mt-0.5" style={{color:"var(--text-muted)"}}>🔌 {s.slots?.length || 0} trụ • 🕐 {s.openHours}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Link href={`/stations/${s.id}`} className="btn-secondary flex-1 text-sm text-center py-2">👁️ Xem</Link>
                  <button onClick={() => openEdit(s)} className="btn-secondary text-sm py-2 px-3">✏️ Sửa</button>
                  <button onClick={() => remove(s.id, s.name)} className="text-sm py-2 px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 dark:bg-red-900/20 dark:border-red-800">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
