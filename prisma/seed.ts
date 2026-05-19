import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: "file:D:/ev-charging/prisma/dev.db" });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const pw = await bcrypt.hash("123456", 10);

  await prisma.user.upsert({ where: { email: "admin@evcharge.com" }, update: {}, create: { email: "admin@evcharge.com", password: pw, name: "Admin", role: "ADMIN" } });
  await prisma.user.upsert({ where: { email: "customer@evcharge.com" }, update: {}, create: { email: "customer@evcharge.com", password: pw, name: "Nguyen Van A", phone: "0901234567", role: "CUSTOMER", loyaltyPoints: 350, loyaltyTier: "BRONZE" } });
  await prisma.user.upsert({ where: { email: "vip@evcharge.com" }, update: {}, create: { email: "vip@evcharge.com", password: pw, name: "Tran Thi Vip", phone: "0908889999", role: "CUSTOMER", loyaltyPoints: 2500, loyaltyTier: "GOLD" } });
  await prisma.user.upsert({ where: { email: "tech@evcharge.com" }, update: {}, create: { email: "tech@evcharge.com", password: pw, name: "Tran Thi B", phone: "0907654321", role: "TECHNICIAN" } });
  await prisma.user.upsert({ where: { email: "tech2@evcharge.com" }, update: {}, create: { email: "tech2@evcharge.com", password: pw, name: "Le Van C", phone: "0903334444", role: "TECHNICIAN" } });

  // Tariffs
  const tariffData = [
    { name: "Đêm thấp điểm", startHour: 0, endHour: 6, ratePerKwh: 1500, isPeak: false },
    { name: "Sáng thường", startHour: 6, endHour: 9, ratePerKwh: 2000, isPeak: false },
    { name: "Sáng cao điểm", startHour: 9, endHour: 11, ratePerKwh: 3500, isPeak: true },
    { name: "Trưa thường", startHour: 11, endHour: 17, ratePerKwh: 2000, isPeak: false },
    { name: "Tối cao điểm", startHour: 17, endHour: 20, ratePerKwh: 3500, isPeak: true },
    { name: "Tối thường", startHour: 20, endHour: 24, ratePerKwh: 2000, isPeak: false },
  ];
  for (const t of tariffData) {
    const exists = await prisma.tariff.findFirst({ where: { name: t.name } });
    if (!exists) await prisma.tariff.create({ data: t });
  }

  // Stations
  const stationData = [
    { name: "EV Station Quan 1", address: "123 Nguyen Hue", city: "Ho Chi Minh", district: "Quan 1", lat: 10.7769, lng: 106.7009 },
    { name: "EV Station Quan 7", address: "456 Nguyen Thi Thap", city: "Ho Chi Minh", district: "Quan 7", lat: 10.7289, lng: 106.7218 },
    { name: "EV Station Thu Duc", address: "789 Vo Van Ngan", city: "Ho Chi Minh", district: "Thu Duc", lat: 10.8500, lng: 106.7717 },
    { name: "EV Station Binh Thanh", address: "321 Dien Bien Phu", city: "Ho Chi Minh", district: "Binh Thanh", lat: 10.8031, lng: 106.7143 },
    { name: "EV Station Go Vap", address: "654 Nguyen Oanh", city: "Ho Chi Minh", district: "Go Vap", lat: 10.8380, lng: 106.6650 },
    { name: "EV Station Ha Noi Ba Dinh", address: "12 Phan Dinh Phung", city: "Ha Noi", district: "Ba Dinh", lat: 21.0381, lng: 105.8333 },
    { name: "EV Station Ha Noi Cau Giay", address: "88 Tran Duy Hung", city: "Ha Noi", district: "Cau Giay", lat: 21.0192, lng: 105.7905 },
  ];

  const connectors = ["CCS2", "CHAdeMO", "Type2", "GB/T"];
  const powers = [50, 100, 22, 7];

  for (const sd of stationData) {
    const station = await prisma.station.upsert({
      where: { id: sd.name }, update: {}, create: { id: sd.name, ...sd, openHours: "06:00 - 22:00", phone: "1900xxxx" }
    });
    for (let i = 0; i < 6; i++) {
      const slotId = `${station.id}-slot-${i+1}`;
      const slotNum = `${String.fromCharCode(65 + Math.floor(i/2))}${(i%2)+1}`;
      await prisma.slot.upsert({
        where: { id: slotId }, update: {},
        create: {
          id: slotId, slotNumber: slotNum, connectorType: connectors[i % 4], powerKw: powers[i % 4], stationId: station.id,
          qrCode: `EV-${station.id.replace(/[^a-zA-Z0-9]/g, "")}-${slotNum}`,
          status: i < 4 ? "AVAILABLE" : i === 4 ? "OCCUPIED" : "MAINTENANCE"
        }
      });
    }
  }

  // VOUCHERS
  const today = new Date();
  const next30 = new Date(today.getTime() + 30 * 86400000);
  const next7 = new Date(today.getTime() + 7 * 86400000);
  const next90 = new Date(today.getTime() + 90 * 86400000);
  const voucherData = [
    { code: "WELCOME50", name: "Khuyến mãi tân thành viên", description: "Giảm 50% tối đa 50K cho lần đầu", type: "PERCENT", value: 50, minAmount: 0, maxDiscount: 50000, usageLimit: 1000, perUserLimit: 1, validFrom: today, validUntil: next90 },
    { code: "EVDAY10", name: "Ngày EV - Giảm 10%", description: "Giảm 10% mọi đơn", type: "PERCENT", value: 10, minAmount: 50000, maxDiscount: 30000, usageLimit: 500, perUserLimit: 3, validFrom: today, validUntil: next30 },
    { code: "FREE20K", name: "Tặng 20K", description: "Giảm trực tiếp 20,000 ₫", type: "FIXED", value: 20000, minAmount: 100000, perUserLimit: 5, validFrom: today, validUntil: next30 },
    { code: "PEAK15", name: "Giảm giờ cao điểm 15%", description: "Giảm 15% khi sạc giờ cao điểm", type: "PERCENT", value: 15, minAmount: 0, maxDiscount: 100000, usageLimit: 200, perUserLimit: 2, validFrom: today, validUntil: next7 },
    { code: "VIP100K", name: "VIP - Tặng 100K", description: "Voucher VIP exclusive", type: "FIXED", value: 100000, minAmount: 200000, usageLimit: 50, perUserLimit: 1, validFrom: today, validUntil: next90 },
  ];
  for (const v of voucherData) {
    const exists = await prisma.voucher.findUnique({ where: { code: v.code } });
    if (!exists) await prisma.voucher.create({ data: v });
  }

  // Sample reviews
  const customer = await prisma.user.findUnique({ where: { email: "customer@evcharge.com" } });
  const vip = await prisma.user.findUnique({ where: { email: "vip@evcharge.com" } });
  const station1 = await prisma.station.findFirst({ where: { id: "EV Station Quan 1" } });

  if (customer && vip && station1) {
    await prisma.review.upsert({
      where: { userId_stationId: { userId: customer.id, stationId: station1.id } },
      update: {},
      create: { userId: customer.id, stationId: station1.id, rating: 5, comment: "Trạm sạc hiện đại, sạch đẹp. Tốc độ sạc nhanh, nhân viên thân thiện.", verified: true }
    });
    await prisma.review.upsert({
      where: { userId_stationId: { userId: vip.id, stationId: station1.id } },
      update: {},
      create: { userId: vip.id, stationId: station1.id, rating: 4, comment: "Vị trí thuận tiện. Giá hơi cao vào giờ cao điểm.", verified: true }
    });
    const all = await prisma.review.findMany({ where: { stationId: station1.id } });
    const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
    await prisma.station.update({ where: { id: station1.id }, data: { rating: avg, reviewCount: all.length } });
  }

  // Wallets
  if (customer) await prisma.wallet.upsert({ where: { userId: customer.id }, update: {}, create: { userId: customer.id, balance: 500000 } });
  if (vip) await prisma.wallet.upsert({ where: { userId: vip.id }, update: {}, create: { userId: vip.id, balance: 2000000 } });

  console.log("Seed done!");
  console.log("- 5 users (admin, customer, vip, 2 tech)");
  console.log("- 6 tariffs, 7 stations, 42 slots");
  console.log("- 5 vouchers (WELCOME50, EVDAY10, FREE20K, PEAK15, VIP100K)");
  console.log("- Sample reviews + wallets");
}

main().catch(console.error).finally(() => prisma.$disconnect());
