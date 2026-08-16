/**
 * OCPP 1.6-J Central System (CSMS) — WebSocket server thật.
 *
 * Charge point (trụ sạc) kết nối tới:  ws://localhost:9220/ocpp/{stationId}
 * Giao thức: OCPP 1.6 JSON, subprotocol "ocpp1.6".
 *
 * Message frame: [MessageTypeId, UniqueId, Action, Payload]  (CALL=2)
 *                [3, UniqueId, Payload]                        (CALLRESULT)
 *                [4, UniqueId, ErrorCode, ErrorDescription, {}] (CALLERROR)
 *
 * Tích hợp DB: cập nhật Slot.status/lastHeartbeat/lastError, tạo ChargingSession khi
 * StartTransaction, và gọi finalizeSession() khi StopTransaction (năng lượng đo thực từ
 * MeterValues chảy vào đúng pipeline tính cước + loyalty của app).
 *
 * Chạy:  npm run ocpp:server
 */
import { WebSocketServer, WebSocket } from "ws";
import { prisma } from "../src/lib/prisma";
import { finalizeSession } from "../src/lib/session";

const PORT = Number(process.env.OCPP_PORT || 9220);
const SECRET = process.env.OCPP_SECRET;
if (!SECRET) throw new Error("OCPP_SECRET chưa cấu hình trong .env (shared secret giữa CSMS và charge point).");

// CALL = 2, CALLRESULT = 3, CALLERROR = 4
type OcppCall = [2, string, string, any];

function log(cpId: string, ...args: any[]) {
  console.log(`[${new Date().toISOString()}] [CP:${cpId}]`, ...args);
}

// Map trạng thái OCPP StatusNotification -> Slot.status của app
function mapStatus(ocppStatus: string): { status: string; error: string | null } {
  switch (ocppStatus) {
    case "Available":
      return { status: "AVAILABLE", error: null };
    case "Preparing":
    case "Reserved":
      return { status: "OCCUPIED", error: null };
    case "Charging":
    case "SuspendedEV":
    case "SuspendedEVSE":
      return { status: "CHARGING", error: null };
    case "Finishing":
      return { status: "AVAILABLE", error: null };
    case "Faulted":
      return { status: "MAINTENANCE", error: "Faulted" };
    case "Unavailable":
      return { status: "MAINTENANCE", error: "Unavailable" };
    default:
      return { status: "AVAILABLE", error: null };
  }
}

type ConnState = {
  chargePointId: string;
  // connectorId (1-based) -> slotId
  connectors: Map<number, string>;
};

// transactionId (int) -> thông tin phiên đang chạy
const transactions = new Map<number, { sessionId: string; slotId: string; meterStart: number }>();
let txCounter = Math.floor(Date.now() / 1000);

async function loadConnectors(stationId: string): Promise<Map<number, string>> {
  const slots = await prisma.slot.findMany({
    where: { stationId },
    orderBy: { slotNumber: "asc" },
    select: { id: true },
  });
  const map = new Map<number, string>();
  slots.forEach((s, i) => map.set(i + 1, s.id)); // connectorId bắt đầu từ 1
  return map;
}

function sendResult(ws: WebSocket, uniqueId: string, payload: any) {
  ws.send(JSON.stringify([3, uniqueId, payload]));
}
function sendError(ws: WebSocket, uniqueId: string, code: string, desc: string) {
  ws.send(JSON.stringify([4, uniqueId, code, desc, {}]));
}

async function handleCall(ws: WebSocket, state: ConnState, action: string, payload: any, uniqueId: string) {
  const cpId = state.chargePointId;
  switch (action) {
    case "BootNotification": {
      log(cpId, "BootNotification", payload?.chargePointModel || "");
      // Đánh dấu các trụ online
      const slotIds = Array.from(state.connectors.values());
      await prisma.slot.updateMany({
        where: { id: { in: slotIds } },
        data: { lastHeartbeat: new Date(), lastError: null },
      });
      sendResult(ws, uniqueId, {
        status: "Accepted",
        currentTime: new Date().toISOString(),
        interval: 30,
      });
      break;
    }

    case "Heartbeat": {
      const slotIds = Array.from(state.connectors.values());
      await prisma.slot.updateMany({
        where: { id: { in: slotIds } },
        data: { lastHeartbeat: new Date() },
      });
      sendResult(ws, uniqueId, { currentTime: new Date().toISOString() });
      break;
    }

    case "StatusNotification": {
      const connectorId = Number(payload?.connectorId || 0);
      const slotId = state.connectors.get(connectorId);
      const mapped = mapStatus(payload?.status || "Available");
      log(cpId, `StatusNotification connector=${connectorId} -> ${payload?.status} (${mapped.status})`);
      if (slotId) {
        await prisma.slot.update({
          where: { id: slotId },
          data: {
            status: mapped.status,
            lastError: mapped.error || (payload?.errorCode !== "NoError" ? payload?.errorCode : null),
            lastCheckAt: new Date(),
            lastHeartbeat: new Date(),
          },
        });
      }
      sendResult(ws, uniqueId, {});
      break;
    }

    case "Authorize": {
      const idTag = String(payload?.idTag || "");
      const user = await findUserByIdTag(idTag);
      sendResult(ws, uniqueId, { idTagInfo: { status: user ? "Accepted" : "Invalid" } });
      break;
    }

    case "StartTransaction": {
      const connectorId = Number(payload?.connectorId || 0);
      const idTag = String(payload?.idTag || "");
      const meterStart = Number(payload?.meterStart || 0); // Wh
      const slotId = state.connectors.get(connectorId);
      const user = await findUserByIdTag(idTag);
      if (!slotId || !user) {
        sendResult(ws, uniqueId, { transactionId: 0, idTagInfo: { status: "Invalid" } });
        break;
      }
      const session = await prisma.chargingSession.create({
        data: { userId: user.id, slotId, status: "ACTIVE", startTime: new Date() },
      });
      await prisma.slot.update({ where: { id: slotId }, data: { status: "CHARGING" } });
      const transactionId = ++txCounter;
      transactions.set(transactionId, { sessionId: session.id, slotId, meterStart });
      log(cpId, `StartTransaction connector=${connectorId} user=${user.email} txn=${transactionId}`);
      sendResult(ws, uniqueId, { transactionId, idTagInfo: { status: "Accepted" } });
      break;
    }

    case "MeterValues": {
      // Có thể log/ghi năng lượng tạm thời; năng lượng chốt lấy ở StopTransaction
      const transactionId = Number(payload?.transactionId || 0);
      const mv = payload?.meterValue?.[0]?.sampledValue?.[0]?.value;
      if (mv != null) log(cpId, `MeterValues txn=${transactionId} value=${mv}Wh`);
      sendResult(ws, uniqueId, {});
      break;
    }

    case "StopTransaction": {
      const transactionId = Number(payload?.transactionId || 0);
      const meterStop = Number(payload?.meterStop || 0); // Wh
      const info = transactions.get(transactionId);
      if (!info) {
        sendResult(ws, uniqueId, { idTagInfo: { status: "Invalid" } });
        break;
      }
      const energyKwh = Math.max((meterStop - info.meterStart) / 1000, 0); // Wh -> kWh
      try {
        const result = await finalizeSession(info.sessionId, { energyKwhOverride: energyKwh });
        log(cpId, `StopTransaction txn=${transactionId} energy=${energyKwh.toFixed(3)}kWh amount=${result.amount}₫`);
      } catch (e: any) {
        log(cpId, `StopTransaction error: ${e?.message}`);
      }
      transactions.delete(transactionId);
      sendResult(ws, uniqueId, { idTagInfo: { status: "Accepted" } });
      break;
    }

    case "DataTransfer": {
      sendResult(ws, uniqueId, { status: "Accepted" });
      break;
    }

    default:
      log(cpId, `Unknown action: ${action}`);
      sendError(ws, uniqueId, "NotImplemented", `Action ${action} not supported`);
  }
}

async function findUserByIdTag(idTag: string) {
  if (!idTag) return null;
  return prisma.user.findFirst({ where: { OR: [{ id: idTag }, { email: idTag }] }, select: { id: true, email: true } });
}

async function main() {
  const wss = new WebSocketServer({ port: PORT });
  console.log(`⚡ OCPP 1.6-J Central System đang lắng nghe ws://localhost:${PORT}/ocpp/{stationId}`);

  wss.on("connection", async (ws, req) => {
    // Authenticate charge point bằng shared secret (header x-ocpp-secret).
    if (req.headers["x-ocpp-secret"] !== SECRET) {
      ws.close(1008, "Missing/invalid OCPP_SECRET");
      return;
    }
    // URL dạng /ocpp/{stationId}
    const url = req.url || "";
    const m = url.match(/\/ocpp\/(.+)$/);
    const chargePointId = m ? decodeURIComponent(m[1]) : "";

    const station = await prisma.station.findUnique({ where: { id: chargePointId }, select: { id: true, name: true } });
    if (!station) {
      log(chargePointId, "Từ chối: station không tồn tại");
      ws.close(1008, "Unknown charge point");
      return;
    }

    const connectors = await loadConnectors(station.id);
    const state: ConnState = { chargePointId, connectors };
    log(chargePointId, `Kết nối OK — station "${station.name}", ${connectors.size} connector`);

    ws.on("message", async (raw) => {
      let frame: OcppCall;
      try {
        frame = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (!Array.isArray(frame) || frame[0] !== 2) return; // chỉ xử lý CALL
      const [, uniqueId, action, payload] = frame;
      try {
        await handleCall(ws, state, action, payload, uniqueId);
      } catch (e: any) {
        log(chargePointId, `Lỗi xử lý ${action}: ${e?.message}`);
        sendError(ws, uniqueId, "InternalError", e?.message || "error");
      }
    });

    ws.on("close", () => log(chargePointId, "Ngắt kết nối"));
    ws.on("error", (e) => log(chargePointId, "WS error:", e.message));
  });
}

main().catch((e) => {
  console.error("OCPP server fatal:", e);
  process.exit(1);
});
