import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req)
  if (!payload || !['ADMIN', 'MANAGER'].includes(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, walletBalance: true, phone: true, createdAt: true }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(users)
}
