"use client";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const icon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background: linear-gradient(135deg, #10b981, #0d9488); width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); border: 3px solid white;"><span style="transform: rotate(45deg); font-size: 18px;">⚡</span></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

export default function StationMap({ stations }: { stations: any[] }) {
  const valid = stations.filter(s => s.lat != null && s.lng != null);
  const center: [number, number] = valid.length > 0 ? [valid[0].lat, valid[0].lng] : [10.776, 106.700];

  return (
    <div className="card overflow-hidden" style={{ height: "70vh", minHeight: "500px" }}>
      <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        {valid.map(s => {
          const avail = s.slots.filter((sl: any) => sl.status === "AVAILABLE").length;
          return (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={icon}>
              <Popup>
                <div style={{ minWidth: "200px" }}>
                  <p style={{ fontWeight: "600", margin: "0 0 4px", fontSize: "14px" }}>{s.name}</p>
                  <p style={{ color: "#64748b", margin: "0 0 8px", fontSize: "12px" }}>📍 {s.address}</p>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ background: "#ecfdf5", color: "#047857", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "500" }}>
                      {avail} trống
                    </span>
                    <span style={{ background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>
                      {s.slots.length} trụ
                    </span>
                  </div>
                  <a href={`/stations/${s.id}`} style={{ color: "#10b981", textDecoration: "none", fontSize: "13px", fontWeight: "500" }}>
                    Xem chi tiết →
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
