import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req)
  if (!payload || !['ADMIN', 'MANAGER'].includes(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const [totalStations, totalSlots, totalUsers, totalSessions, totalRevenue, activeSlots, openTickets, recentSessions] = await Promise.all([
    prisma.station.count(),
    prisma.chargingSlot.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.chargingSession.count({ where: { status: 'COMPLETED' } }),
    prisma.invoice.aggregate({ where: { status: 'PAID' }, _sum: { amount: true, kwh: true } }),
    prisma.chargingSlot.count({ where: { status: 'AVAILABLE' } }),
    prisma.maintenanceTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.chargingSession.findMany({ where: { status: 'COMPLETED' }, include: { chargingSlot: { include: { station: { select: { name: true } } } }, invoice: true }, orderBy: { createdAt: 'desc' }, take: 10 })
  ])
  const stationRevenue = await prisma.station.findMany({
    include: { chargingSlots: { include: { chargingSessions: { where: { status: 'COMPLETED' }, include: { invoice: { where: { status: 'PAID' } } } } } } }
  })
  const stationStats = stationRevenue.map(s => ({
    name: s.name.replace('Tram EV ', ''),
    revenue: s.chargingSlots.reduce((sum, slot) => sum + slot.chargingSessions.reduce((s2, sess) => s2 + (sess.invoice?.amount || 0), 0), 0),
    sessions: s.chargingSlots.reduce((sum, slot) => sum + slot.chargingSessions.length, 0),
    kwh: s.chargingSlots.reduce((sum, slot) => sum + slot.chargingSessions.reduce((s2, sess) => s2 + (sess.consumedKwh || 0), 0), 0),
  }))
  return NextResponse.json({ totalStations, totalSlots, totalUsers, totalSessions, totalRevenue: totalRevenue._sum.amount || 0, totalKwh: totalRevenue._sum.kwh || 0, activeSlots, openTickets, recentSessions, stationStats })
}
