import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const isAdmin = ['ADMIN', 'MANAGER'].includes(payload.role)
  const invoices = await prisma.invoice.findMany({
    where: isAdmin ? {} : { userId: payload.userId },
    include: { session: { include: { chargingSlot: { include: { station: { select: { name: true } } } } } }, payment: true },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(invoices)
}
