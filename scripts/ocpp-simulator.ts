/**
 * Charge Point Simulator — giả lập trụ sạc nói OCPP 1.6-J với Central System.
 *
 * Tự động lấy 1 station + 1 khách hàng từ DB rồi chạy full luồng:
 *   BootNotification -> StatusNotification(Available)
 *   -> StartTransaction -> MeterValues x N -> StopTransaction
 *   -> StatusNotification(Available)
 *
 * Chạy CSMS trước:  npm run ocpp:server
 * Rồi chạy:         npm run ocpp:sim
 *
 * Tùy chọn: npm run ocpp:sim -- <stationId> <idTag(email|userId)>
 */
import { WebSocket } from "ws";
import { prisma } from "../src/lib/prisma";

const PORT = Number(process.env.OCPP_PORT || 9220);
const SECRET = process.env.OCPP_SECRET;
if (!SECRET) throw new Error("OCPP_SECRET chưa cấu hình trong .env (phải khớp với ocpp-server).");

function randId() {
  return Math.random().toString(36).slice(2, 10);
}

async function resolveTargets() {
  const argStation = process.argv[2];
  const argIdTag = process.argv[3];

  const station = argStation
    ? await prisma.station.findUnique({ where: { id: argStation }, select: { id: true, name: true } })
    : await prisma.station.findFirst({ where: { status: "ACTIVE" }, select: { id: true, name: true } });
  if (!station) throw new Error("Không tìm thấy station nào trong DB (hãy seed trước).");

  let idTag = argIdTag;
  if (!idTag) {
    const user = await prisma.user.findFirst({ where: { role: "CUSTOMER" }, select: { email: true } });
    if (!user) throw new Error("Không tìm thấy user CUSTOMER nào.");
    idTag = user.email;
  }
  return { station, idTag };
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const { station, idTag } = await resolveTargets();
  const wsUrl = `ws://localhost:${PORT}/ocpp/${encodeURIComponent(station.id)}`;
  console.log(`🔌 Simulator kết nối ${wsUrl}`);
  console.log(`   Station: ${station.name} | idTag: ${idTag}`);

  const ws = new WebSocket(wsUrl, ["ocpp1.6"], { headers: { "x-ocpp-secret": SECRET } });

  // Correlate CALLRESULT theo uniqueId
  const pending = new Map<string, (payload: any) => void>();

  function call(action: string, payload: any): Promise<any> {
    return new Promise((resolve) => {
      const uniqueId = randId();
      pending.set(uniqueId, resolve);
      ws.send(JSON.stringify([2, uniqueId, action, payload]));
    });
  }

  ws.on("message", (raw) => {
    let frame: any;
    try {
      frame = JSON.parse(raw.toString());
    } catch {
      return;
    }
    // CALLRESULT [3, uniqueId, payload]
    if (Array.isArray(frame) && frame[0] === 3) {
      const [, uniqueId, payload] = frame;
      const cb = pending.get(uniqueId);
      if (cb) {
        pending.delete(uniqueId);
        cb(payload);
      }
    } else if (Array.isArray(frame) && frame[0] === 4) {
      console.error("  ← CALLERROR:", frame[2], frame[3]);
    }
  });

  await new Promise<void>((resolve, reject) => {
    ws.on("open", () => resolve());
    ws.on("error", (e) => reject(e));
  });

  // 1) BootNotification
  const boot = await call("BootNotification", {
    chargePointVendor: "V-GREEN",
    chargePointModel: "Simulator-DC-60kW",
    firmwareVersion: "1.0.0",
  });
  console.log("  ← BootNotification:", boot.status, "interval", boot.interval);
  if (boot.status !== "Accepted") {
    ws.close();
    return;
  }

  const connectorId = 1;

  // 2) StatusNotification: Available
  await call("StatusNotification", { connectorId, errorCode: "NoError", status: "Available" });
  console.log("  ← StatusNotification Available");

  // 3) Preparing + StartTransaction
  await call("StatusNotification", { connectorId, errorCode: "NoError", status: "Preparing" });
  const meterStart = 0;
  const start = await call("StartTransaction", {
    connectorId,
    idTag,
    meterStart,
    timestamp: new Date().toISOString(),
  });
  console.log("  ← StartTransaction txn=", start.transactionId, start.idTagInfo?.status);
  if (!start.transactionId) {
    ws.close();
    return;
  }
  const transactionId = start.transactionId;

  await call("StatusNotification", { connectorId, errorCode: "NoError", status: "Charging" });

  // 4) MeterValues: mô phỏng nạp năng lượng tăng dần (Wh)
  let meter = meterStart;
  const stepWh = 3500; // ~3.5 kWh mỗi bước
  for (let i = 0; i < 4; i++) {
    await delay(800);
    meter += stepWh;
    await call("MeterValues", {
      connectorId,
      transactionId,
      meterValue: [
        {
          timestamp: new Date().toISOString(),
          sampledValue: [{ value: String(meter), unit: "Wh", measurand: "Energy.Active.Import.Register" }],
        },
      ],
    });
    console.log(`  → MeterValues ${meter}Wh (${(meter / 1000).toFixed(1)}kWh)`);
  }

  // 5) StopTransaction
  await delay(500);
  const stop = await call("StopTransaction", {
    transactionId,
    meterStop: meter,
    timestamp: new Date().toISOString(),
  });
  console.log("  ← StopTransaction:", stop.idTagInfo?.status, `| tổng ${(meter / 1000).toFixed(1)}kWh`);

  // 6) Về Available
  await call("StatusNotification", { connectorId, errorCode: "NoError", status: "Available" });
  console.log("  ← StatusNotification Available (kết thúc)");

  await delay(300);
  ws.close();
  console.log("✅ Hoàn tất phiên sạc mô phỏng. Kiểm tra hóa đơn + điểm loyalty của user.");
}

run()
  .catch((e) => {
    console.error("Simulator error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
