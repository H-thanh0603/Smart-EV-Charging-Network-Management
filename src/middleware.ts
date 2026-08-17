import { NextRequest, NextResponse } from "next/server";

// Edge runtime: jsonwebtoken (Node crypto) không chạy — verify HS256 bằng Web Crypto.
// ponytail: nếu đổi thuật toán JWT (mặc định jsonwebtoken là HS256) thì cập nhật ở đây.
async function verifyEdge(token: string, secret: string) {
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return null;
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${h}.${p}`));
    const expected = btoa(Array.from(new Uint8Array(sig), (b) => String.fromCharCode(b)).join(""))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    if (expected !== s) return null;
    const payload = JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

const ROLE_ROUTES: [RegExp, string][] = [
  [/^\/admin/, "ADMIN"],
  [/^\/technician/, "TECHNICIAN"],
  [/^\/driver/, "DRIVER"],
];
const LOGIN_REQUIRED = /^\/(wallet|sessions|reservations|invoices|notifications|history|loyalty|vouchers|profile|scan)/;

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("ev_token")?.value;
  const secret = process.env.JWT_SECRET;
  const user = token && secret ? await verifyEdge(token, secret) : null;

  let redirect: string | null = null;
  const roleRoute = ROLE_ROUTES.find(([re]) => re.test(pathname));
  if (roleRoute) {
    if (!user) redirect = "/login";
    else if (user.role !== roleRoute[1]) redirect = "/stations";
  } else if (LOGIN_REQUIRED.test(pathname) && !user) {
    redirect = "/login";
  }

  if (redirect) return NextResponse.redirect(new URL(redirect, req.url));

  const res = NextResponse.next();
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
  return res;
}

export const config = {
  // Bỏ /api — API route tự guard bằng getTokenFromRequest + verifyToken
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
