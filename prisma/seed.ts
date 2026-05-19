import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: "file:D:/ev-charging/prisma/dev.db" });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const pw = await bcrypt.hash("123456", 10);

  // ── FLEETS ──
  const xanhSM = await prisma.fleet.upsert({
    where: { code: "XANHSM" }, update: {},
    create: { code: "XANHSM", name: "Xanh SM (GSM)", contact: "Phòng vận hành", phone: "1900 2088", email: "fleet@xanhsm.com", discountRate: 15, vehicleCount: 0, walletShared: true }
  });
  const lazada = await prisma.fleet.upsert({
    where: { code: "LAZADA-EV" }, update: {},
    create: { code: "LAZADA-EV", name: "Lazada Logistics EV", contact: "Logistics Manager", phone: "1900 6868", discountRate: 10, vehicleCount: 0, walletShared: false }
  });

  // ── USERS ──
  await prisma.user.upsert({ where: { email: "admin@evcharge.com" }, update: {}, create: { email: "admin@evcharge.com", password: pw, name: "Admin V-GREEN", role: "ADMIN" } });
  const customer = await prisma.user.upsert({ where: { email: "customer@evcharge.com" }, update: {}, create: { email: "customer@evcharge.com", password: pw, name: "Nguyen Van A", phone: "0901234567", role: "CUSTOMER", loyaltyPoints: 350, loyaltyTier: "BRONZE" } });
  const vip = await prisma.user.upsert({ where: { email: "vip@evcharge.com" }, update: {}, create: { email: "vip@evcharge.com", password: pw, name: "Tran Thi Vip", phone: "0908889999", role: "CUSTOMER", loyaltyPoints: 2500, loyaltyTier: "GOLD" } });
  const driver1 = await prisma.user.upsert({
    where: { email: "driver@xanhsm.com" }, update: {},
    create: { email: "driver@xanhsm.com", password: pw, name: "Le Van Tai (Xanh SM)", phone: "0911223344", role: "DRIVER", loyaltyPoints: 5800, loyaltyTier: "PLATINUM", fleetId: xanhSM.id }
  });
  const driver2 = await prisma.user.upsert({
    where: { email: "driver2@xanhsm.com" }, update: {},
    create: { email: "driver2@xanhsm.com", password: pw, name: "Pham Quoc Hung (Xanh SM)", phone: "0922334455", role: "DRIVER", loyaltyPoints: 3200, loyaltyTier: "GOLD", fleetId: xanhSM.id }
  });
  await prisma.user.upsert({ where: { email: "tech@evcharge.com" }, update: {}, create: { email: "tech@evcharge.com", password: pw, name: "Tran Thi B", phone: "0907654321", role: "TECHNICIAN" } });
  await prisma.user.upsert({ where: { email: "tech2@evcharge.com" }, update: {}, create: { email: "tech2@evcharge.com", password: pw, name: "Le Van C", phone: "0903334444", role: "TECHNICIAN" } });

  // ── VEHICLES ──
  const vehicleData = [
    { userId: customer.id, brand: "VinFast", model: "VF e34", licensePlate: "51K-12345", connectorType: "CCS2", batteryKwh: 42 },
    { userId: vip.id, brand: "VinFast", model: "VF 8 Plus", licensePlate: "51A-99999", connectorType: "CCS2", batteryKwh: 87.7 },
    { userId: driver1.id, fleetId: xanhSM.id, brand: "VinFast", model: "VF 5 Plus", licensePlate: "50H-11111", connectorType: "CCS2", batteryKwh: 37.2 },
    { userId: driver2.id, fleetId: xanhSM.id, brand: "VinFast", model: "VF e34", licensePlate: "50H-22222", connectorType: "CCS2", batteryKwh: 42 },
  ];
  for (const v of vehicleData) {
    const exists = await prisma.vehicle.findUnique({ where: { licensePlate: v.licensePlate } }).catch(() => null);
    if (!exists) await prisma.vehicle.create({ data: v });
  }
  await prisma.fleet.update({ where: { id: xanhSM.id }, data: { vehicleCount: 2 } });

  // ── TARIFFS - V-GREEN realistic pricing ──
  const tariffData = [
    { name: "Đêm thấp điểm (22-6h)", startHour: 22, endHour: 24, ratePerKwh: 2570, isPeak: false },
    { name: "Đêm thấp điểm (0-6h)", startHour: 0, endHour: 6, ratePerKwh: 2570, isPeak: false },
    { name: "Sáng thường", startHour: 6, endHour: 9, ratePerKwh: 3210, isPeak: false },
    { name: "Sáng cao điểm", startHour: 9, endHour: 11, ratePerKwh: 4580, isPeak: true },
    { name: "Trưa thường", startHour: 11, endHour: 17, ratePerKwh: 3210, isPeak: false },
    { name: "Tối cao điểm", startHour: 17, endHour: 22, ratePerKwh: 4580, isPeak: true },
  ];
  for (const t of tariffData) {
    const exists = await prisma.tariff.findFirst({ where: { name: t.name } });
    if (!exists) await prisma.tariff.create({ data: t });
  }

  // ── STATIONS - V-GREEN HCM + Hanoi ──
  const stationData = [
    { name: "V-GREEN Vincom Đồng Khởi", address: "72 Lê Thánh Tôn, Bến Nghé", city: "Hồ Chí Minh", district: "Quận 1", lat: 10.7765, lng: 106.7019, brand: "V-GREEN", isPremium: true, openHours: "24/7" },
    { name: "V-GREEN Landmark 81", address: "208 Nguyễn Hữu Cảnh", city: "Hồ Chí Minh", district: "Bình Thạnh", lat: 10.7949, lng: 106.7218, brand: "V-GREEN", isPremium: true, openHours: "24/7" },
    { name: "V-GREEN Aeon Bình Tân", address: "1 Đường số 17A, KP11", city: "Hồ Chí Minh", district: "Bình Tân", lat: 10.7421, lng: 106.6147, brand: "V-GREEN", openHours: "06:00 - 23:00" },
    { name: "V-GREEN Vincom Mega Mall Thảo Điền", address: "159 XL Hà Nội", city: "Hồ Chí Minh", district: "Thủ Đức", lat: 10.8025, lng: 106.7421, brand: "V-GREEN", openHours: "24/7" },
    { name: "V-GREEN Lotte Mart Quận 7", address: "469 Nguyễn Hữu Thọ", city: "Hồ Chí Minh", district: "Quận 7", lat: 10.7321, lng: 106.7019, brand: "V-GREEN", openHours: "24/7" },
    { name: "V-GREEN Aeon Mall Tân Phú", address: "30 Bờ Bao Tân Thắng", city: "Hồ Chí Minh", district: "Tân Phú", lat: 10.8014, lng: 106.6207, brand: "V-GREEN", openHours: "06:00 - 23:00" },
    { name: "V-GREEN Crescent Mall Q7", address: "101 Tôn Dật Tiên", city: "Hồ Chí Minh", district: "Quận 7", lat: 10.7286, lng: 106.7187, brand: "V-GREEN", openHours: "24/7" },
    { name: "V-GREEN Vincom Lê Văn Việt", address: "Lê Văn Việt, P.Hiệp Phú", city: "Hồ Chí Minh", district: "Thủ Đức", lat: 10.8482, lng: 106.7795, brand: "V-GREEN", openHours: "24/7" },
    { name: "ChargePlus Cộng Hòa", address: "33 Cộng Hòa, P.4", city: "Hồ Chí Minh", district: "Tân Bình", lat: 10.8013, lng: 106.6494, brand: "ChargePlus", openHours: "06:00 - 22:00" },
    { name: "EVOne Phú Mỹ Hưng", address: "1 Tôn Dật Tiên", city: "Hồ Chí Minh", district: "Quận 7", lat: 10.7240, lng: 106.7204, brand: "EVOne", openHours: "06:00 - 22:00" },
    { name: "V-GREEN Vincom Bà Triệu", address: "191 Bà Triệu", city: "Hà Nội", district: "Hai Bà Trưng", lat: 21.0103, lng: 105.8487, brand: "V-GREEN", openHours: "24/7" },
    { name: "V-GREEN Royal City", address: "72A Nguyễn Trãi", city: "Hà Nội", district: "Thanh Xuân", lat: 21.0029, lng: 105.8156, brand: "V-GREEN", openHours: "24/7" },
  ];

  // V-GREEN ưu tiên CCS2 + Type 2 (cho VinFast). Trạm khác có thêm CHAdeMO + GB/T
  const vgreenSlots = [
    { type: "CCS2", power: 60 },  { type: "CCS2", power: 60 },
    { type: "CCS2", power: 150 }, { type: "CCS2", power: 150 },
    { type: "Type2", power: 22 }, { type: "Type2", power: 22 },
    { type: "Type2", power: 7 },  { type: "Type2", power: 7 },
  ];
  const otherSlots = [
    { type: "CCS2", power: 60 },    { type: "CHAdeMO", power: 50 },
    { type: "Type2", power: 22 },   { type: "GB/T", power: 60 },
    { type: "Type2", power: 7 },    { type: "CCS2", power: 100 },
  ];

  for (const sd of stationData) {
    const station = await prisma.station.upsert({
      where: { id: sd.name }, update: {},
      create: { id: sd.name, ...sd, phone: "1900 232389" }
    });
    const slots = sd.brand === "V-GREEN" ? vgreenSlots : otherSlots;
    for (let i = 0; i < slots.length; i++) {
      const slotId = `${station.id}-slot-${i+1}`;
      const slotNum = `${String.fromCharCode(65 + Math.floor(i/2))}${(i%2)+1}`;
      const status = i < slots.length - 2 ? "AVAILABLE" : i === slots.length - 2 ? "OCCUPIED" : "MAINTENANCE";
      await prisma.slot.upsert({
        where: { id: slotId }, update: {},
        create: {
          id: slotId, slotNumber: slotNum, connectorType: slots[i].type, powerKw: slots[i].power, stationId: station.id,
          qrCode: `EV-${station.id.replace(/[^a-zA-Z0-9]/g, "")}-${slotNum}`, status
        }
      });
    }
  }

  // ── VOUCHERS - Việt Nam style ──
  const today = new Date();
  const next30 = new Date(today.getTime() + 30 * 86400000);
  const next7 = new Date(today.getTime() + 7 * 86400000);
  const next90 = new Date(today.getTime() + 90 * 86400000);
  const voucherData = [
    { code: "WELCOME50", name: "Chào mừng tài khoản mới", description: "Giảm 50% hoá đơn đầu tiên (tối đa 50K)", type: "PERCENT", value: 50, minAmount: 0, maxDiscount: 50000, usageLimit: 1000, perUserLimit: 1, validFrom: today, validUntil: next90 },
    { code: "VINFAST10", name: "VinFast Day - Giảm 10%", description: "Áp dụng cho xe VinFast", type: "PERCENT", value: 10, minAmount: 50000, maxDiscount: 30000, usageLimit: 500, perUserLimit: 3, validFrom: today, validUntil: next30 },
    { code: "XANHSM20", name: "Xanh SM Driver - Giảm 20%", description: "Ưu đãi tài xế Xanh SM (đã có 15% fleet)", type: "PERCENT", value: 5, minAmount: 0, maxDiscount: 50000, perUserLimit: 30, validFrom: today, validUntil: next30 },
    { code: "FREE20K", name: "Tặng 20.000 ₫", description: "Áp dụng cho đơn từ 100K", type: "FIXED", value: 20000, minAmount: 100000, perUserLimit: 5, validFrom: today, validUntil: next30 },
    { code: "PEAK15", name: "Giờ cao điểm - Giảm 15%", description: "Sạc giờ cao điểm vẫn rẻ", type: "PERCENT", value: 15, minAmount: 0, maxDiscount: 100000, usageLimit: 200, perUserLimit: 2, validFrom: today, validUntil: next7 },
    { code: "PLATINUM100K", name: "Platinum - Tặng 100K", description: "Voucher exclusive hạng Platinum", type: "FIXED", value: 100000, minAmount: 200000, usageLimit: 50, perUserLimit: 1, validFrom: today, validUntil: next90 },
  ];
  for (const v of voucherData) {
    const exists = await prisma.voucher.findUnique({ where: { code: v.code } });
    if (!exists) await prisma.voucher.create({ data: v });
  }

  // ── REVIEWS ──
  const station1 = await prisma.station.findFirst({ where: { id: "V-GREEN Vincom Đồng Khởi" } });
  if (station1 && customer && vip && driver1) {
    await prisma.review.upsert({
      where: { userId_stationId: { userId: customer.id, stationId: station1.id } }, update: {},
      create: { userId: customer.id, stationId: station1.id, rating: 5, comment: "Trạm V-GREEN xịn xò! Sạc nhanh CCS2 150kW, sạc 80% trong 30 phút.", verified: true }
    });
    await prisma.review.upsert({
      where: { userId_stationId: { userId: vip.id, stationId: station1.id } }, update: {},
      create: { userId: vip.id, stationId: station1.id, rating: 4, comment: "Vị trí ngay trung tâm, gần Vincom rất tiện. Giá hơi cao giờ cao điểm.", verified: true }
    });
    await prisma.review.upsert({
      where: { userId_stationId: { userId: driver1.id, stationId: station1.id } }, update: {},
      create: { userId: driver1.id, stationId: station1.id, rating: 5, comment: "Tài Xanh SM hay sạc ở đây. Có Lounge riêng cho tài xế, rất tâm lý.", verified: true }
    });
    const all = await prisma.review.findMany({ where: { stationId: station1.id } });
    const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
    await prisma.station.update({ where: { id: station1.id }, data: { rating: avg, reviewCount: all.length } });
  }

  // ── WALLETS ──
  if (customer) await prisma.wallet.upsert({ where: { userId: customer.id }, update: {}, create: { userId: customer.id, balance: 500000 } });
  if (vip) await prisma.wallet.upsert({ where: { userId: vip.id }, update: {}, create: { userId: vip.id, balance: 2000000 } });
  if (driver1) await prisma.wallet.upsert({ where: { userId: driver1.id }, update: {}, create: { userId: driver1.id, balance: 800000 } });
  if (driver2) await prisma.wallet.upsert({ where: { userId: driver2.id }, update: {}, create: { userId: driver2.id, balance: 600000 } });

  console.log("Seed done!");
  console.log("- 7 users (Admin, 2 Customer, 2 Driver Xanh SM, 2 Tech)");
  console.log("- 2 Fleets: Xanh SM (15% off), Lazada EV (10% off)");
  console.log("- 4 vehicles (4 VinFast)");
  console.log("- 12 stations: 9 V-GREEN HCM + 2 V-GREEN HN + 2 third-party");
  console.log("- 6 tariffs (V-GREEN realistic: 2,570 - 4,580 VND/kWh)");
  console.log("- 6 vouchers");
}

main().catch(console.error).finally(() => prisma.$disconnect());
