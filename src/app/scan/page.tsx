"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

export default function ScanPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const scannerRef = useRef<any>(null);
  const containerId = "qr-reader";

  async function lookup(c: string) {
    setLoading(true); setError("");
    const res = await fetch(`/api/slots/qr/${encodeURIComponent(c)}`);
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Không tìm thấy trụ");
      return;
    }
    const slot = await res.json();
    if (slot.status !== "AVAILABLE") {
      setError(`Trụ ${slot.slotNumber} đang ${slot.status === "OCCUPIED" ? "có người dùng" : "bảo trì"}.`);
      return;
    }
    stopScan();
    router.push(`/reservations/new?slotId=${slot.id}&stationName=${encodeURIComponent(slot.station.name)}`);
  }

  async function startScan() {
    setError("");
    setScanning(true);
    try {
      // Dynamically import html5-qrcode
      const { Html5Qrcode } = await import("html5-qrcode");
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setError("Không phát hiện camera trên thiết bị");
        setScanning(false);
        return;
      }
      const cameraId = cameras.find((c: any) => c.label.toLowerCase().includes("back"))?.id || cameras[0].id;
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      await scanner.start(
        cameraId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          await scanner.stop();
          setScanning(false);
          setCode(decodedText);
          lookup(decodedText);
        },
        () => { /* ignore decode errors per frame */ }
      );
    } catch (e: any) {
      setError("Không thể truy cập camera: " + (e?.message || "permission denied"));
      setScanning(false);
    }
  }

  async function stopScan() {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }

  useEffect(() => () => { stopScan(); }, []);

  return (
    <AppShell title="Quét QR Code">
      <div className="max-w-md mx-auto">
        <div className="card p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Quét QR tại trụ sạc</h2>
          <p className="text-sm text-slate-500 mb-4">Hướng camera vào QR code dán trên trụ để check-in nhanh</p>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

          {!scanning ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl mb-4">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center text-white text-5xl mb-4 shadow-lg">📷</div>
              <button onClick={startScan} className="btn-primary">Bật camera</button>
              <p className="text-xs text-slate-500 mt-2">Cần cấp quyền truy cập camera</p>
            </div>
          ) : (
            <div className="mb-4">
              <div id={containerId} className="rounded-xl overflow-hidden bg-black"></div>
              <button onClick={stopScan} className="btn-secondary w-full mt-3">⏹ Dừng quét</button>
            </div>
          )}

          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Hoặc nhập mã thủ công</p>
            <div className="flex gap-2">
              <input type="text" placeholder="VD: EV-EVStationQuan1-A1" value={code} onChange={e => setCode(e.target.value)} className="input flex-1" />
              <button onClick={() => lookup(code)} disabled={!code || loading} className="btn-primary">
                {loading ? "..." : "Tìm"}
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Demo: thử các mã có sẵn</p>
            <div className="grid grid-cols-2 gap-1">
              {["EV-EVStationQuan1-A1", "EV-EVStationQuan7-A1", "EV-EVStationThuDuc-A1"].map(c => (
                <button key={c} onClick={() => { setCode(c); lookup(c); }} className="text-xs bg-slate-100 hover:bg-slate-200 rounded px-2 py-1 truncate text-left">{c}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-4 mt-4 bg-amber-50 border-amber-200">
          <p className="text-xs text-amber-800">
            ℹ️ <strong>Demo mode:</strong> Trong production, mỗi trụ thật sẽ có QR sticker với mã cố định. Hệ thống thật dùng giao thức OCPP để giao tiếp với trụ qua WebSocket.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
