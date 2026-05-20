import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getTokenFromRequest(req); const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const session = await prisma.chargingSession.findUnique({
    where: { id },
    include: { slot: { include: { station: true } }, invoice: true, reservation: true }
  })
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (session.userId !== payload.id && !['ADMIN'].includes(payload.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json(session)
}
