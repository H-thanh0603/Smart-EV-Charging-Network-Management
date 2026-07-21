import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { parseBody, walletTopupSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, walletTopupSchema);
  if (!parsed.ok) return parsed.response;
  const { amount } = parsed.data;

  let wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
  if (!wallet) wallet = await prisma.wallet.create({ data: { userId: user.id, balance: 0 } });

  const newBalance = wallet.balance + amount;
  const updated = await prisma.wallet.update({
    where: { userId: user.id },
    data: { balance: newBalance }
  });
  await prisma.walletTransaction.create({
    data: { userId: user.id, type: "TOPUP", amount, balance: newBalance, note: "Nạp tiền vào ví" }
  });
  return NextResponse.json({ wallet: updated });
}
