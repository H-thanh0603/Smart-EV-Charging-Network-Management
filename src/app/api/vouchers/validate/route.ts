import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { validateAndCalculate } from "@/lib/voucher";

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { code, amount } = await req.json();
  const result = await validateAndCalculate(code, u.id, amount);
  if (!result.valid) return NextResponse.json({ valid: false, error: result.error });
  return NextResponse.json({ valid: true, discount: result.discount, voucher: { code: result.voucher!.code, name: result.voucher!.name } });
}
