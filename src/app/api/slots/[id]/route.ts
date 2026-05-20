import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const slot = await prisma.slot.findUnique({ where: { id }, include: { station: true } })
  if (!slot) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(slot)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getTokenFromRequest(req); const payload = token ? verifyToken(token) : null
  if (!payload || !['ADMIN', 'MANAGER', 'TECHNICIAN'].includes(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const data = await req.json()
  const slot = await prisma.slot.update({ where: { id }, data })
  return NextResponse.json(slot)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getTokenFromRequest(req); const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  await prisma.slot.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
