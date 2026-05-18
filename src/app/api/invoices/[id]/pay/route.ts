import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const invoice = await prisma.invoice.findUnique({ where: { id } })
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  if (invoice.userId !== payload.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (invoice.status === 'PAID') return NextResponse.json({ error: 'Already paid' }, { status: 400 })
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.walletBalance < invoice.amount)
    return NextResponse.json({ error: 'Insufficient wallet balance', required: invoice.amount, balance: user.walletBalance }, { status: 400 })
  const [updatedInvoice, payment] = await Promise.all([
    prisma.invoice.update({ where: { id }, data: { status: 'PAID' } }),
    prisma.payment.upsert({ where: { invoiceId: id }, create: { invoiceId: id, method: 'WALLET', amount: invoice.amount, status: 'SUCCESS', paidAt: new Date() }, update: { status: 'SUCCESS', paidAt: new Date() } }),
    prisma.user.update({ where: { id: payload.userId }, data: { walletBalance: { decrement: invoice.amount } } }),
    prisma.notification.create({ data: { userId: payload.userId, title: 'Thanh toan thanh cong', message: 'Hoa don da duoc thanh toan', type: 'SUCCESS' } })
  ])
  return NextResponse.json({ invoice: updatedInvoice, payment })
}
