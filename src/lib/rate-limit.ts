import { NextResponse } from "next/server";

/**
 * Rate limiter in-memory (fixed window) — đủ cho đồ án demo chạy 1 instance.
 * Chống brute-force login/register. Production nhiều instance nên thay bằng Redis.
 */
type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

// Dọn định kỳ các bucket hết hạn để tránh rò rỉ bộ nhớ.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  store.forEach((bucket, key) => {
    if (bucket.resetAt <= now) store.delete(key);
  });
}

/** Lấy IP client từ header proxy phổ biến, fallback "unknown". */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Kiểm tra rate limit. Trả về null nếu OK, hoặc NextResponse 429 nếu vượt ngưỡng.
 * @param key   khóa định danh (vd: "login:1.2.3.4")
 * @param limit số request tối đa trong cửa sổ
 * @param windowMs độ dài cửa sổ (ms)
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): NextResponse | null {
  const now = Date.now();
  sweep(now);

  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (bucket.count >= limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return NextResponse.json(
      { error: `Quá nhiều yêu cầu. Vui lòng thử lại sau ${retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  bucket.count += 1;
  return null;
}
