"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

const VINFAST_MODELS = [
  { name: "VF 3", battery: 18.6, connector: "CCS2" },
  { name: "VF 5", battery: 37.2, connector: "CCS2" },
  { name: "VF 5 Plus", battery: 37.2, connector: "CCS2" },
  { name: "VF 6", battery: 59.6, connector: "CCS2" },
  { name: "VF 7", battery: 75.3, connector: "CCS2" },
  { name: "VF 8", battery: 87.7, connector: "CCS2" },
  { name: "VF 8 Plus", battery: 87.7, connector: "CCS2" },
  { name: "VF 9", battery: 123, connector: "CCS2" },
  { name: "VF e34", battery: 42, connector: "CCS2" },
];

export default function DriverVehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ brand: "VinFast", model: "VF 5", licensePlate: "", connectorType: "CCS2", batteryKwh: 37.2, vinNumber: "" });

  async function load() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/vehicles", { headers: { Authorization: `Bearer ${token}` } });
    setVehicles(await res.json()); setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function create() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    if (res.ok) { setShowForm(false); setForm({...form, licensePlate: "", vinNumber: ""}); load(); }
    else { const d = await res.json(); alert(d.error || "Lỗi"); }
  }

  function pickModel(m: typeof VINFAST_MODELS[0]) {
    setForm({...form, brand: "VinFast", model: m.name, batteryKwh: m.battery, connectorType: m.connector});
  }

  return (
    <AppShell title="Xe của tôi">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">🚗 Xe điện</h2>
          <p className="text-sm" style={{color:"var(--text-muted)"}}>{vehicles.length} xe</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">{showForm ? "Đóng" : "+ Thêm xe"}</button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6 animate-fadeIn">
          <h3 className="font-semibold mb-4">Thêm xe mới</h3>
          <p className="text-xs mb-2" style={{color:"var(--text-muted)"}}>Chọn nhanh model VinFast</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {VINFAST_MODELS.map(m => (
              <button key={m.name} onClick={() => pickModel(m)}
                className={`p-2 rounded-lg border-2 text-xs font-medium transition ${form.model === m.name && form.brand === "VinFast" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" : "border-slate-200 dark:border-slate-700 hover:border-emerald-300"}`}>
                <div className="font-bold">{m.name}</div>
                <div className="text-[10px]" style={{color:"var(--text-muted)"}}>{m.battery}kWh</div>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="label">Hãng</label>
              <select value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="input">
                <option>VinFast</option><option>Tesla</option><option>BYD</option>
                <option>Hyundai</option><option>Kia</option><option>MG</option><option>Khác</option>
              </select>
            </div>
            <div><label className="label">Model</label><input type="text" value={form.model} onChange={e => setForm({...form, model: e.target.value})} className="input" /></div>
            <div><label className="label">Biển số *</label><input type="text" value={form.licensePlate} onChange={e => setForm({...form, licensePlate: e.target.value.toUpperCase()})} className="input" placeholder="51K-12345" /></div>
            <div><label className="label">Loại sạc</label>
              <select value={form.connectorType} onChange={e => setForm({...form, connectorType: e.target.value})} className="input">
                <option value="CCS2">CCS2 (VinFast, Hyundai...)</option>
                <option value="Type2">Type 2 (AC)</option>
                <option value="CHAdeMO">CHAdeMO (Nissan, Lexus)</option>
                <option value="GB/T">GB/T (BYD, MG)</option>
              </select>
            </div>
            <div><label className="label">Dung lượng pin (kWh)</label><input type="number" step="0.1" value={form.batteryKwh} onChange={e => setForm({...form, batteryKwh: parseFloat(e.target.value)})} className="input" /></div>
            <div><label className="label">VIN (tuỳ chọn)</label><input type="text" value={form.vinNumber} onChange={e => setForm({...form, vinNumber: e.target.value})} className="input" /></div>
          </div>
          <button onClick={create} disabled={!form.licensePlate} className="btn-primary mt-4">Thêm xe</button>
        </div>
      )}

      {loading ? <div className="skeleton h-32"></div> : vehicles.length === 0 ? (
        <div className="card p-12 text-center"><div className="text-5xl mb-3">🚗</div><p style={{color:"var(--text-muted)"}}>Chưa có xe nào</p></div>
      ) : (
        <div className="space-y-3">
          {vehicles.map(v => (
            <div key={v.id} className="card p-5">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center text-white text-3xl shadow-lg">🚗</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{v.brand} {v.model}</h3>
                    {v.fleet && <span className="badge-purple">🏢 {v.fleet.code} -{v.fleet.discountRate}%</span>}
                  </div>
                  <p className="font-mono text-xl font-bold text-emerald-600">{v.licensePlate}</p>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="badge-blue">🔌 {v.connectorType}</span>
                    {v.batteryKwh && <span className="badge-gray">🔋 {v.batteryKwh} kWh</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
