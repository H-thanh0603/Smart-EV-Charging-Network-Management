import { NextRequest } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { getLiveStations } from "@/lib/live";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * SSE stream trạng thái trạm/slot realtime.
 * Client mở 1 kết nối EventSource (gửi cookie ev_token), server đẩy dữ liệu khi có thay đổi
 * + heartbeat định kỳ. Thay thế polling phía client.
 */
export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  const POLL_MS = 3000;

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let lastHash = "";

      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const tick = async () => {
        if (closed) return;
        try {
          const stations = await getLiveStations();
          // Hash theo slot-level + phiên active để chỉ đẩy khi thực sự thay đổi
          const hash = stations
            .map((s) =>
              `${s.id}:${s.slots.map((sl) => `${sl.id}=${sl.status}`).join(",")}` +
              `|sess:${s.activeSessions.map((a) => `${a.slotNumber}=${a.remainingMin}`).join(",")}`
            )
            .join("||");
          if (hash !== lastHash) {
            lastHash = hash;
            send("stations", stations);
          } else {
            // heartbeat giữ kết nối sống (comment line, không phải event)
            if (!closed) controller.enqueue(encoder.encode(`: ping\n\n`));
          }
        } catch (e: any) {
          // Báo lỗi cho client thay vì giữ trạng thái "connected" sai lệch
          if (!closed) {
            controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: e?.message || "live error" })}\n\n`));
          }
        }
      };

      // Đẩy ngay lần đầu
      await tick();
      const interval = setInterval(tick, POLL_MS);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          /* đã đóng */
        }
      };

      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
