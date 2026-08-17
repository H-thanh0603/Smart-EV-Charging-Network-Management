import { NextResponse } from "next/server";
import { redis } from "./redis";

/**
 * Rate limiter fixed window trên Redis — chạy đúng nhiều instance.
 * Atomic INCR + EXPIRE. Nếu Redis chết, fail-open (không chặn nhầm).
 */
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
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<NextResponse | null> {
  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, Math.floor(windowMs / 1000));

    if (count > limit) {
      const ttl = await redis.ttl(key);
      return NextResponse.json(
        { error: `Quá nhiều yêu cầu. Vui lòng thử lại sau ${ttl}s.` },
        { status: 429, headers: { "Retry-After": String(Math.max(ttl, 0)) } }
      );
    }
    return null;
  } catch {
    return null; // fail-open khi Redis down
  }
}
