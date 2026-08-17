import { prisma } from "./prisma";
import { logger } from "./logger";
import crypto from "crypto";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/** Hash token trước khi lưu — DB leak không lộ token verify. */
export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Tạo + lưu token verify cho user. Trả url — dev trả về client,
 * production phải gửi qua email (giữ nguyên pattern forgot-password hiện tại).
 */
export async function createVerifyToken(userId: string, origin: string) {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: userId },
    data: { verifyToken: hashToken(token), verifyTokenExp: new Date(Date.now() + VERIFY_TTL_MS) },
  });
  const url = `${origin}/verify-email?token=${token}`;
  if (process.env.NODE_ENV !== "production") {
    logger.info({ userId, url }, "[Verify] email verify link generated");
  }
  return url;
}

/** Verify token từ link. Trả { ok, error } */
export async function confirmVerifyToken(token: string) {
  const user = await prisma.user.findFirst({
    where: { verifyToken: hashToken(token), verifyTokenExp: { gte: new Date() } },
  });
  if (!user) return { ok: false as const, error: "Link xác minh không hợp lệ hoặc đã hết hạn" };
  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, verifyToken: null, verifyTokenExp: null } });
  return { ok: true as const, error: null };
}