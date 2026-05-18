import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const slot = await prisma.chargingSlot.findUnique({ where: { id }, include: { station: true } })
  if (!slot) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(slot)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req)
  if (!payload || !['ADMIN', 'MANAGER', 'TECHNICIAN'].includes(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const data = await req.json()
  const slot = await prisma.chargingSlot.update({ where: { id }, data })
  return NextResponse.json(slot)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req)
  if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  await prisma.chargingSlot.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
