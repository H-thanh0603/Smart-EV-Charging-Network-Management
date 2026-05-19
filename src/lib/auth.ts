import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  console.error("FATAL: JWT_SECRET not set in .env");
}

export function signToken(payload: { id: string; email: string; role: string }) {
  return jwt.sign(payload, SECRET || "fallback-dev-only", { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET || "fallback-dev-only") as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: Request) {
  // Try Authorization header
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  // Try cookie
  const cookie = req.headers.get("cookie");
  if (cookie) {
    const match = cookie.match(/(?:^|;\s*)ev_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}
