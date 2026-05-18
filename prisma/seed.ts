import bcrypt from 'bcryptjs'

async function main() {
  const { PrismaLibSQL } = await import('@prisma/adapter-libsql')
  const { createClient } = await import('@libsql/client')
  const { PrismaClient } = await import('@prisma/client')
  const libsql = createClient({ url: 'file:./prisma/dev.db' })
  const adapter = new PrismaLibSQL(libsql)
  const prisma = new PrismaClient({ adapter } as any)
  console.log('Seeding...')
  await prisma.notification.deleteMany()
  await prisma.maintenanceTicket.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.chargingSession.deleteMany()
  await prisma.reservation.deleteMany()
  await prisma.tariff.deleteMany()
  await prisma.chargingSlot.deleteMany()
  await prisma.station.deleteMany()
  await prisma.user.deleteMany()
  const pw = await bcrypt.hash('123456', 10)
  const cust = await prisma.user.create({ data: { name: 'Nguyen Van A', email: 'customer@evcharge.com', password: pw, role: 'CUSTOMER', walletBalance: 2000000 } })
  const tech = await prisma.user.create({ data: { name: 'Tran Ky Thuat', email: 'tech@evcharge.com', password: pw, role: 'TECHNICIAN', walletBalance: 500000 } })
  const cust2 = await prisma.user.create({ data: { name: 'Le Thi B', email: 'customer2@evcharge.com', password: pw, role: 'CUSTOMER', walletBalance: 1500000 } })
  await prisma.user.create({ data: { name: 'Admin System', email: 'admin@evcharge.com', password: pw, role: 'ADMIN', walletBalance: 10000000 } })
  await prisma.user.create({ data: { name: 'Pham Van C', email: 'customer3@evcharge.com', password: pw, role: 'CUSTOMER', walletBalance: 3000000 } })
  await prisma.tariff.createMany({ data: [
    { name: 'Cao diem sang', startHour: 6, endHour: 9, multiplier: 1.5 },
    { name: 'Binh thuong', startHour: 9, endHour: 17, multiplier: 1.0 },
    { name: 'Cao diem chieu', startHour: 17, endHour: 21, multiplier: 1.5 },
    { name: 'Thap diem', startHour: 21, endHour: 6, multiplier: 0.7 },
  ]})
  const s1 = await prisma.station.create({ data: { name: 'Tram EV Quan 1', address: '123 Nguyen Hue, Q1, TP.HCM', latitude: 10.7769, longitude: 106.7009, status: 'ACTIVE' } })
  const s2 = await prisma.station.create({ data: { name: 'Tram EV Quan 7', address: '456 Nguyen Van Linh, Q7, TP.HCM', latitude: 10.7285, longitude: 106.7218, openingHours: '00:00-24:00', status: 'ACTIVE' } })
  const s3 = await prisma.station.create({ data: { name: 'Tram EV Thu Duc', address: '789 Vo Van Ngan, Thu Duc, TP.HCM', latitude: 10.8500, longitude: 106.7717, status: 'ACTIVE' } })
  const s4 = await prisma.station.create({ data: { name: 'Tram EV Binh Thanh', address: '321 Dien Bien Phu, BT, TP.HCM', latitude: 10.8031, longitude: 106.7143, status: 'ACTIVE' } })
  const s5 = await prisma.station.create({ data: { name: 'Tram EV Go Vap', address: '654 Nguyen Oanh, GV, TP.HCM', latitude: 10.8380, longitude: 106.6650, status: 'MAINTENANCE' } })
  const slotDefs = [
    { stationId: s1.id, code: 'Q1-01', connectorType: 'AC_TYPE2', powerKw: 22, pricePerKwh: 3500, status: 'AVAILABLE' },
    { stationId: s1.id, code: 'Q1-02', connectorType: 'AC_TYPE2', powerKw: 22, pricePerKwh: 3500, status: 'AVAILABLE' },
    { stationId: s1.id, code: 'Q1-03', connectorType: 'DC_CCS2', powerKw: 60, pricePerKwh: 4500, status: 'AVAILABLE' },
    { stationId: s1.id, code: 'Q1-04', connectorType: 'DC_CCS2', powerKw: 120, pricePerKwh: 5500, status: 'OCCUPIED' },
    { stationId: s1.id, code: 'Q1-05', connectorType: 'DC_CHAdeMO', powerKw: 60, pricePerKwh: 4500, status: 'AVAILABLE' },
    { stationId: s1.id, code: 'Q1-06', connectorType: 'DC_GB', powerKw: 180, pricePerKwh: 6500, status: 'ERROR' },
    { stationId: s2.id, code: 'Q7-01', connectorType: 'AC_TYPE2', powerKw: 22, pricePerKwh: 3500, status: 'AVAILABLE' },
    { stationId: s2.id, code: 'Q7-02', connectorType: 'AC_TYPE2', powerKw: 22, pricePerKwh: 3500, status: 'AVAILABLE' },
    { stationId: s2.id, code: 'Q7-03', connectorType: 'DC_CCS2', powerKw: 60, pricePerKwh: 4500, status: 'AVAILABLE' },
    { stationId: s2.id, code: 'Q7-04', connectorType: 'DC_CCS2', powerKw: 60, pricePerKwh: 4500, status: 'AVAILABLE' },
    { stationId: s2.id, code: 'Q7-05', connectorType: 'DC_CCS2', powerKw: 120, pricePerKwh: 5500, status: 'AVAILABLE' },
    { stationId: s2.id, code: 'Q7-06', connectorType: 'DC_CCS2', powerKw: 120, pricePerKwh: 5500, status: 'CHARGING' },
    { stationId: s2.id, code: 'Q7-07', connectorType: 'DC_GB', powerKw: 180, pricePerKwh: 6500, status: 'AVAILABLE' },
    { stationId: s2.id, code: 'Q7-08', connectorType: 'DC_GB', powerKw: 180, pricePerKwh: 6500, status: 'AVAILABLE' },
    { stationId: s3.id, code: 'TD-01', connectorType: 'AC_TYPE2', powerKw: 22, pricePerKwh: 3500, status: 'AVAILABLE' },
    { stationId: s3.id, code: 'TD-02', connectorType: 'AC_TYPE2', powerKw: 22, pricePerKwh: 3500, status: 'AVAILABLE' },
    { stationId: s3.id, code: 'TD-03', connectorType: 'DC_CCS2', powerKw: 60, pricePerKwh: 4500, status: 'AVAILABLE' },
    { stationId: s3.id, code: 'TD-04', connectorType: 'DC_CCS2', powerKw: 120, pricePerKwh: 5500, status: 'MAINTENANCE' },
    { stationId: s3.id, code: 'TD-05', connectorType: 'DC_GB', powerKw: 180, pricePerKwh: 6500, status: 'AVAILABLE' },
    { stationId: s3.id, code: 'TD-06', connectorType: 'DC_CHAdeMO', powerKw: 60, pricePerKwh: 4500, status: 'AVAILABLE' },
    { stationId: s4.id, code: 'BT-01', connectorType: 'AC_TYPE2', powerKw: 22, pricePerKwh: 3500, status: 'AVAILABLE' },
    { stationId: s4.id, code: 'BT-02', connectorType: 'AC_TYPE2', powerKw: 22, pricePerKwh: 3500, status: 'AVAILABLE' },
    { stationId: s4.id, code: 'BT-03', connectorType: 'DC_CCS2', powerKw: 60, pricePerKwh: 4500, status: 'AVAILABLE' },
    { stationId: s4.id, code: 'BT-04', connectorType: 'DC_CCS2', powerKw: 120, pricePerKwh: 5500, status: 'AVAILABLE' },
    { stationId: s4.id, code: 'BT-05', connectorType: 'DC_GB', powerKw: 180, pricePerKwh: 6500, status: 'AVAILABLE' },
    { stationId: s5.id, code: 'GV-01', connectorType: 'AC_TYPE2', powerKw: 22, pricePerKwh: 3500, status: 'MAINTENANCE' },
    { stationId: s5.id, code: 'GV-02', connectorType: 'AC_TYPE2', powerKw: 22, pricePerKwh: 3500, status: 'MAINTENANCE' },
    { stationId: s5.id, code: 'GV-03', connectorType: 'DC_CCS2', powerKw: 60, pricePerKwh: 4500, status: 'MAINTENANCE' },
    { stationId: s5.id, code: 'GV-04', connectorType: 'DC_GB', powerKw: 120, pricePerKwh: 5500, status: 'MAINTENANCE' },
  ]
  const slots: any[] = []
  for (const sd of slotDefs) slots.push(await prisma.chargingSlot.create({ data: sd }))
  const now = new Date()
  const tom = new Date(now); tom.setDate(tom.getDate()+1)
  const yes = new Date(now); yes.setDate(yes.getDate()-1)
  const r1s = new Date(tom); r1s.setHours(9,0,0,0)
  const r1e = new Date(tom); r1e.setHours(11,0,0,0)
  const r1d = new Date(tom); r1d.setHours(9,15,0,0)
  await prisma.reservation.create({ data: { userId: cust.id, stationId: s1.id, chargingSlotId: slots[2].id, startTime: r1s, endTime: r1e, checkInDeadline: r1d, status: 'RESERVED' } })
  const r2s = new Date(yes); r2s.setHours(14,0,0,0)
  const r2e = new Date(yes); r2e.setHours(16,0,0,0)
  const r2d = new Date(yes); r2d.setHours(14,15,0,0)
  const res2 = await prisma.reservation.create({ data: { userId: cust2.id, stationId: s2.id, chargingSlotId: slots[11].id, startTime: r2s, endTime: r2e, checkInDeadline: r2d, status: 'COMPLETED' } })
  const ss = new Date(yes); ss.setHours(14,5,0,0)
  const se = new Date(yes); se.setHours(15,45,0,0)
  const sess1 = await prisma.chargingSession.create({ data: { userId: cust2.id, reservationId: res2.id, chargingSlotId: slots[11].id, startTime: ss, endTime: se, consumedKwh: 28.5, status: 'COMPLETED' } })
  const inv1 = await prisma.invoice.create({ data: { sessionId: sess1.id, userId: cust2.id, amount: 128250, kwh: 28.5, durationMinutes: 100, status: 'PAID' } })
  await prisma.payment.create({ data: { invoiceId: inv1.id, method: 'WALLET', amount: 128250, status: 'SUCCESS', paidAt: new Date() } })
  const r3s = new Date(); r3s.setHours(r3s.getHours()-1)
  const r3e = new Date(); r3e.setHours(r3e.getHours()+2)
  const r3d = new Date(); r3d.setMinutes(r3d.getMinutes()+15)
  const res3 = await prisma.reservation.create({ data: { userId: cust.id, stationId: s2.id, chargingSlotId: slots[5].id, startTime: r3s, endTime: r3e, checkInDeadline: r3d, status: 'CHECKED_IN' } })
  await prisma.chargingSession.create({ data: { userId: cust.id, reservationId: res3.id, chargingSlotId: slots[5].id, startTime: r3s, status: 'ACTIVE' } })
  await prisma.maintenanceTicket.create({ data: { chargingSlotId: slots[5].id, technicianId: tech.id, title: 'Loi ket noi DC CCS2', description: 'Tru bao loi E-04', status: 'IN_PROGRESS' } })
  await prisma.maintenanceTicket.create({ data: { chargingSlotId: slots[3].id, title: 'Man hinh khong hien thi', description: 'Man hinh bi den', status: 'OPEN' } })
  await prisma.maintenanceTicket.create({ data: { chargingSlotId: slots[25].id, technicianId: tech.id, title: 'Bao tri dinh ky', description: 'Bao tri 6 thang', status: 'IN_PROGRESS' } })
  await prisma.notification.createMany({ data: [
    { userId: cust.id, title: 'Dat lich thanh cong', message: 'Ban da dat lich sac tai Tram Q1', type: 'SUCCESS' },
    { userId: cust2.id, title: 'Thanh toan thanh cong', message: 'Hoa don 128,250 VND da thanh toan', type: 'SUCCESS' },
    { userId: tech.id, title: 'Ticket moi', message: 'Co su co moi tai Q1-06', type: 'WARNING' },
  ]})
  console.log('Seed OK! admin@evcharge.com / 123456')
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
