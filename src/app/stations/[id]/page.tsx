"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";

export default function StationDetailPage() {
  const params = useParams();
  const [station, setStation] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [hasCompletedSession, setHasCompletedSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");

  async function load() {
    const token = localStorage.getItem("token");
    const [sRes, rRes, sessRes] = await Promise.all([
      fetch(`/api/stations/${params.id}`).then(r => r.json()),
      fetch(`/api/stations/${params.id}/reviews`).then(r => r.json()),
      fetch("/api/sessions", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => [])
    ]);
    setStation(sRes); setReviews(rRes);
    // Check if user has completed session at this station
    const has = Array.isArray(sessRes) && sessRes.some((s: any) => s.status === "COMPLETED" && s.slot.station.name === sRes?.name);
    setHasCompletedSession(has);
    setLoading(false);
  }

  useEffect(() => { load(); }, [params.id]);

  async function submitReview() {
    setReviewError("");
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/stations/${params.id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rating: reviewRating, comment: reviewComment })
    });
    const d = await res.json();
    if (!res.ok) { setReviewError(d.error || "Lỗi gửi đánh giá"); return; }
    setShowReviewForm(false); setReviewComment(""); setReviewRating(5);
    load();
  }

  if (loading) return <AppShell><div className="text-center py-20 text-slate-400">Đang tải...</div></AppShell>;
  if (!station) return <AppShell><div className="text-center py-20 text-red-500">Không tìm thấy trạm</div></AppShell>;

  const avail = station.slots.filter((s: any) => s.status === "AVAILABLE").length;

  return (
    <AppShell title={station.name}>
      <div className="max-w-5xl mx-auto">
        <Link href="/stations" className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-flex items-center gap-1">
          ← Danh sách trạm
        </Link>

        <div className="card overflow-hidden mb-6">
          {station.imageUrl && (
            <div className="relative h-64 lg:h-80 overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img src={station.imageUrl} alt={station.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <div className="absolute top-4 left-4 flex gap-2">
                {station.isPremium && <span className="bg-gradient-to-r from-amber-400 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">⭐ Premium</span>}
                {station.brand && <span className="bg-white/90 backdrop-blur text-slate-800 text-xs font-bold px-3 py-1 rounded-full shadow-lg">{station.brand}</span>}
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h1 className="text-3xl font-bold drop-shadow-lg">{station.name}</h1>
                <p className="text-sm drop-shadow opacity-95 mt-1">📍 {station.address}, {station.city}</p>
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                <div className="bg-emerald-500 text-white px-4 py-2 rounded-xl shadow-lg backdrop-blur">
                  <div className="text-xs opacity-90">Trống</div>
                  <div className="text-2xl font-bold leading-none">{avail}/{station.slots.length}</div>
                </div>
              </div>
            </div>
          )}
          <div className="p-6">
            {!station.imageUrl && <h1 className="text-2xl font-bold mb-2">{station.name}</h1>}
            {station.description && <p className="text-sm mb-4" style={{color:"var(--text-muted)"}}>{station.description}</p>}
            <div className="flex flex-wrap gap-3 text-sm mb-4">
              {station.openHours && <span className="flex items-center gap-1.5">🕐 <span className="font-medium">{station.openHours}</span></span>}
              {station.phone && <a href={`tel:${station.phone}`} className="text-emerald-600 hover:underline flex items-center gap-1.5">📞 {station.phone}</a>}
              {(station.rating || 0) > 0 && (
                <span className="flex items-center gap-1.5 text-amber-500 font-semibold">★ {station.rating.toFixed(1)} <span className="text-slate-400 font-normal">({station.reviewCount} đánh giá)</span></span>
              )}
            </div>
            {station.amenities && (
              <div className="flex flex-wrap gap-2 mb-2">
                {station.amenities.split(",").filter(Boolean).map((a: string) => {
                  const labels: Record<string,{icon:string;text:string;color:string}> = {
                    wifi: {icon:"📶",text:"Wifi",color:"badge-blue"},
                    toilet: {icon:"🚻",text:"WC",color:"badge-gray"},
                    cafe: {icon:"☕",text:"Cafe",color:"badge-yellow"},
                    parking: {icon:"🅿️",text:"Bãi xe",color:"badge-blue"},
                    shopping: {icon:"🛍️",text:"Mua sắm",color:"badge-purple"},
                    security: {icon:"🛡️",text:"Bảo vệ",color:"badge-green"},
                    "vip-lounge": {icon:"⭐",text:"VIP Lounge",color:"badge-purple"},
                    "food-court": {icon:"🍜",text:"Food Court",color:"badge-yellow"},
                    supermarket: {icon:"🛒",text:"Siêu thị",color:"badge-green"},
                    "kids-area": {icon:"🎈",text:"Khu trẻ em",color:"badge-purple"},
                    view: {icon:"🏞️",text:"View đẹp",color:"badge-blue"},
                  };
                  const l = labels[a.trim()];
                  if (!l) return null;
                  return <span key={a} className={l.color}>{l.icon} {l.text}</span>;
                })}
              </div>
            )}
          </div>
        </div>

        <h2 className="text-lg font-semibold text-slate-800 mb-3">Trụ sạc ({station.slots.length})</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {station.slots.map((slot: any) => {
            const isAvail = slot.status === "AVAILABLE";
            return (
              <div key={slot.id} className={`card p-4 ${isAvail ? "" : "opacity-70"}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-800">Trụ {slot.slotNumber}</span>
                  <span className={isAvail ? "badge-green" : slot.status === "OCCUPIED" ? "badge-red" : "badge-yellow"}>
                    {isAvail ? "Trống" : slot.status === "OCCUPIED" ? "Đang dùng" : "BT"}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mb-2">
                  <p>🔌 {slot.connectorType}</p>
                  <p>⚡ {slot.powerKw} kW</p>
                </div>
                {isAvail && (
                  <Link href={`/reservations/new?slotId=${slot.id}&stationName=${encodeURIComponent(station.name)}`}>
                    <button className="btn-primary w-full text-xs py-1.5">Đặt lịch</button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Đánh giá ({reviews.length})</h2>
            {hasCompletedSession ? (
              <button onClick={() => setShowReviewForm(!showReviewForm)} className="btn-secondary text-sm">
                {showReviewForm ? "Đóng" : "Viết đánh giá"}
              </button>
            ) : (
              <span className="text-xs text-slate-500 italic">Cần hoàn thành ít nhất 1 phiên sạc để đánh giá</span>
            )}
          </div>

          {showReviewForm && (
            <div className="bg-slate-50 rounded-xl p-4 mb-4 animate-fadeIn">
              {reviewError && <div className="bg-red-50 text-red-700 p-2 rounded mb-2 text-sm">{reviewError}</div>}
              <p className="text-sm font-medium mb-2">Chấm điểm:</p>
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setReviewRating(n)}
                    className={`text-3xl transition ${n <= reviewRating ? "text-amber-400" : "text-slate-300"}`}>★</button>
                ))}
              </div>
              <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn..." rows={3} className="input mb-3"></textarea>
              <button onClick={submitReview} className="btn-primary text-sm">Gửi đánh giá</button>
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">Chưa có đánh giá nào.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="border-b border-slate-100 pb-4 last:border-0">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                      {r.user.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-sm text-slate-800 flex items-center gap-2">
                          {r.user.name}
                          {r.verified && <span className="badge-green text-xs">✓ Đã xác minh</span>}
                        </p>
                        <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</p>
                      </div>
                      <p className="text-amber-400 text-sm">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                      {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
