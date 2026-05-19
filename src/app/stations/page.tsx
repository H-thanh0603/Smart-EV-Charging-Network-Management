"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import AppShell from "@/components/AppShell";

const StationMap = dynamic(() => import("@/components/StationMap"), { ssr: false });

export default function StationsPage() {
  const [stations, setStations] = useState<any[]>([]);
  const [view, setView] = useState<"list" | "map" | "near">("list");
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("ALL");
  const [connector, setConnector] = useState("ALL");
  const [power, setPower] = useState("ALL");
  const [brand, setBrand] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState("");
  const [findingLoc, setFindingLoc] = useState(false);

  async function loadLive() {
    const res = await fetch("/api/stations/live", { credentials: "include" });
    if (res.ok) setStations(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadLive();
    const interval = setInterval(loadLive, 15000);
    return () => clearInterval(interval);
  }, []);

  function findNearMe() {
    setLocError(""); setFindingLoc(true);
    if (!navigator.geolocation) { setLocError("Trình duyệt không hỗ trợ geolocation"); setFindingLoc(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setView("near");
        setFindingLoc(false);
      },
      (err) => {
        setLocError("Không lấy được vị trí: " + err.message);
        setFindingLoc(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const districts = useMemo(() => Array.from(new Set(stations.map(s => s.district).filter(Boolean))) as string[], [stations]);

  const filtered = useMemo(() => {
    let list = stations.filter(s => {
      if (search) {
        const q = search.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.address.toLowerCase().includes(q)) return false;
      }
      if (district !== "ALL" && s.district !== district) return false;
      if (connector !== "ALL" && !s.slots.some((sl: any) => sl.connectorType === connector)) return false;
      if (power !== "ALL" && !s.slots.some((sl: any) => sl.powerKw === parseFloat(power))) return false;
      if (brand !== "ALL" && s.brand !== brand) return false;
      return true;
    });
    if (view === "near" && userLoc) {
      list = list
        .filter(s => s.lat && s.lng)
        .map(s => ({ ...s, distance: haversine(userLoc.lat, userLoc.lng, s.lat, s.lng) }))
        .sort((a, b) => a.distance - b.distance);
    }
    return list;
  }, [stations, search, district, connector, power, brand, view, userLoc]);

  return (
    <AppShell title="Trạm sạc">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Mạng lưới trạm sạc</h2>
          <div className="flex gap-1 p-1 rounded-lg" style={{background:"var(--card-bg)", border:"1px solid var(--border)"}}>
            {[{k:"list",l:"📋"},{k:"map",l:"🗺️"},{k:"near",l:"📍"}].map(v => (
              <button key={v.k} onClick={() => v.k === "near" ? findNearMe() : setView(v.k as any)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${view === v.k ? "bg-emerald-500 text-white" : ""}`}>{v.l}</button>
            ))}
          </div>
        </div>

        {locError && <div className="card p-3 mb-4 bg-red-50 border-red-200 text-red-700 text-sm">{locError}</div>}
        {findingLoc && <div className="card p-3 mb-4 text-sm">📍 Đang xác định vị trí...</div>}
        {view === "near" && userLoc && (
          <div className="card p-3 mb-4 bg-emerald-50 border-emerald-200 text-emerald-800 text-sm">
            📍 Tìm thấy vị trí của bạn — hiển thị trạm gần nhất
          </div>
        )}

        <div className="card p-4 mb-6">
          <input type="text" placeholder="🔍 Tìm theo tên, địa chỉ..." value={search} onChange={e => setSearch(e.target.value)} className="input mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select value={district} onChange={e => setDistrict(e.target.value)} className="input">
              <option value="ALL">📍 Tất cả quận</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={connector} onChange={e => setConnector(e.target.value)} className="input">
              <option value="ALL">🔌 Tất cả chuẩn</option>
              {["CCS2","CHAdeMO","Type2","GB/T"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={brand} onChange={e => setBrand(e.target.value)} className="input">
              <option value="ALL">🏢 Tất cả thương hiệu</option>
              <option value="V-GREEN">⚡ V-GREEN (VinFast)</option>
              <option value="ChargePlus">🔌 ChargePlus</option>
              <option value="EVOne">🌿 EVOne</option>
            </select>
            <select value={power} onChange={e => setPower(e.target.value)} className="input">
              <option value="ALL">⚡ Tất cả công suất</option>
              {[7,22,50,100].map(p => <option key={p} value={p}>{p} kW</option>)}
            </select>
          </div>
        </div>

        {loading ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="skeleton h-40"></div>)}</div> : (
          view === "map" ? (
            filtered.length === 0 ? <div className="card p-12 text-center" style={{color:"var(--text-muted)"}}>Không có trạm</div> : <StationMap stations={filtered} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((s, i) => {
                const avail = s.available !== undefined ? s.available : (s.slots?.filter((sl: any) => sl.status === "AVAILABLE").length || 0);
                  const total = s.total !== undefined ? s.total : (s.slots?.length || 0);
                  const liveStatus = s.status;
                return (
                  <Link key={s.id} href={`/stations/${s.id}`} className="card overflow-hidden hover:border-emerald-400 hover:scale-[1.02] transition group block">
                    {s.thumbnailUrl ? (
                      <div className="relative h-40 overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img src={s.thumbnailUrl} alt={s.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        {s.isPremium && <span className="absolute top-2 left-2 bg-gradient-to-r from-amber-400 to-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-md shadow-lg">⭐ Premium</span>}
                        <span className={`absolute top-2 right-2 shadow-lg text-xs px-2 py-1 rounded-md font-bold ${liveStatus === "FREE" ? "bg-emerald-500 text-white" : liveStatus === "BUSY" ? "bg-amber-500 text-white" : "bg-red-500 text-white"}`}>
                          {liveStatus === "FREE" ? "● Trống" : liveStatus === "BUSY" ? "● Đông" : "● Đầy"} {avail}/{total}
                        </span>
                        {s.brand && <span className="absolute bottom-2 left-2 text-xs font-bold text-white drop-shadow-lg">{s.brand}</span>}
                      </div>
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-5xl">⚡</div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold group-hover:text-emerald-600 transition mb-1 line-clamp-1">{s.name}</h3>
                      <p className="text-xs truncate mb-2" style={{color:"var(--text-muted)"}}>📍 {s.address}</p>
                      <div className="flex items-center justify-between mb-2 text-xs">
                        <div className="flex items-center gap-2">
                          {(s.rating || 0) > 0 && <span className="text-amber-500 font-semibold">★ {s.rating.toFixed(1)}</span>}
                          {s.reviewCount > 0 && <span style={{color:"var(--text-muted)"}}>({s.reviewCount})</span>}
                          {view === "near" && s.distance && <span className="text-emerald-600 font-semibold">📍 {s.distance.toFixed(1)} km</span>}
                        </div>
                        <span style={{color:"var(--text-muted)"}}>{s.openHours || "06-22h"}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 text-xs">
                        {Array.from(new Set(s.slots.map((sl: any) => sl.connectorType))).slice(0, 3).map((c: any) => (
                          <span key={c} className="badge-gray">{c}</span>
                        ))}
                        {Array.from(new Set(s.slots.map((sl: any) => sl.powerKw))).slice(0, 3).map((p: any) => (
                          <span key={p} className="badge-blue">{p}kW</span>
                        ))}
                      </div>
                    </div>
                  </Link>
                );
              })}
              {filtered.length === 0 && <div className="card p-12 text-center col-span-full" style={{color:"var(--text-muted)"}}>Không tìm thấy trạm phù hợp</div>}
            </div>
          )
        )}
      </div>
    </AppShell>
  );
}
