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
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState("");
  const [findingLoc, setFindingLoc] = useState(false);

  useEffect(() => {
    fetch("/api/stations").then(r => r.json()).then(d => { setStations(d); setLoading(false); });
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
      return true;
    });
    if (view === "near" && userLoc) {
      list = list
        .filter(s => s.lat && s.lng)
        .map(s => ({ ...s, distance: haversine(userLoc.lat, userLoc.lng, s.lat, s.lng) }))
        .sort((a, b) => a.distance - b.distance);
    }
    return list;
  }, [stations, search, district, connector, power, view, userLoc]);

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
                const avail = s.slots.filter((sl: any) => sl.status === "AVAILABLE").length;
                return (
                  <Link key={s.id} href={`/stations/${s.id}`} className="card p-5 hover:border-emerald-400 transition group block">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white text-xl shadow-md flex-shrink-0">⚡</div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold group-hover:text-emerald-600 transition">{s.name}</h3>
                          <p className="text-sm truncate" style={{color:"var(--text-muted)"}}>📍 {s.address}</p>
                          {(s.rating || 0) > 0 && <p className="text-xs text-amber-500 mt-0.5">★ {s.rating.toFixed(1)} ({s.reviewCount})</p>}
                          {view === "near" && s.distance && <p className="text-xs text-emerald-600 mt-0.5 font-medium">📍 {s.distance.toFixed(1)} km</p>}
                        </div>
                      </div>
                      <span className={avail > 0 ? "badge-green" : "badge-red"}>{avail}/{s.slots.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 text-xs">
                      {Array.from(new Set(s.slots.map((sl: any) => sl.connectorType))).slice(0, 3).map((c: any) => (
                        <span key={c} className="badge-gray">{c}</span>
                      ))}
                      {Array.from(new Set(s.slots.map((sl: any) => sl.powerKw))).slice(0, 3).map((p: any) => (
                        <span key={p} className="badge-blue">{p}kW</span>
                      ))}
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
