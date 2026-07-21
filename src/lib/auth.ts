import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

// Fail fast: không cho phép fallback secret cố định (dễ bị giả mạo token).
// Nếu thiếu JWT_SECRET, throw ngay khi ký/verify thay vì âm thầm dùng secret yếu.
function getSecret(): string {
  if (!SECRET || SECRET.length < 16) {
    throw new Error(
      "JWT_SECRET chưa được cấu hình (hoặc quá ngắn). Hãy set JWT_SECRET trong .env (>= 16 ký tự)."
    );
  }
  return SECRET;
}

export function signToken(payload: { id: string; email: string; role: string }) {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, getSecret()) as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  const cookie = req.headers.get("cookie");
  if (cookie) {
    const match = cookie.match(/(?:^|;\s*)ev_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

export async function requireUser(req: Request) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export async function requireRole(req: Request, roles: string[]) {
  const user = await requireUser(req);
  if (!user) return null;
  if (!roles.includes(user.role)) return null;
  return user;
}
