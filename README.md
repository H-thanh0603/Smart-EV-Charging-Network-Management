# EV Charging Network Management

Hệ thống quản lý mạng lưới trạm sạc xe điện — đặt lịch, sạc, ví điện tử, tích điểm loyalty, đội xe tài xế, admin dashboard. Next.js + Prisma (SQLite/libsql) + OCPP 1.6-J.

## Tính năng

- **Khách hàng:** tìm trạm theo bản đồ/khoảng cách, check-in bằng mã QR, theo dõi phiên sạc realtime, ví điện tử (nạp VNPay, VP Bank QR), voucher, tích điểm loyalty, đánh giá trạm.
- **Tài xế (Xanh SM):** đội xe, mức tiêu hao, thu nhập.
- **Kỹ thuật:** tiếp nhận + xử lý phiếu bảo trì trạm.
- **Admin:** quản lý trạm/trụ, khung giá, phiếu bảo trì, voucher, doanh thu (biểu đồ), giám sát realtime (SSE), webhooks, API keys.
- **OCPP 1.6-J:** Central System (WebSocket `:9220`) + charge point simulator, energy từ MeterValues chảy đúng pipeline tính cước + tích điểm.

## Cài đặt

```bash
npm install
cp .env.example .env   # rồi điền DATABASE_URL, VAPID keys
npx prisma db push
npx prisma generate
npx tsx prisma/seed.ts
npm run dev
```

DB mặc định nằm tại `prisma/dev.db` (SQLite/libsql). Override bằng `DATABASE_URL` trong `.env`.

## Tài khoản mẫu (sau seed)

| Email | Mật khẩu | Vai trò |
|-------|----------|---------|
| admin@evcharge.com | 123456 | Admin |
| customer@evcharge.com | 123456 | Khách (350 pts, 500k VND) |
| vip@evcharge.com | 123456 | VIP Gold (2,500 pts, 2M VND) |
| tech@evcharge.com | 123456 | Kỹ thuật |

## Chạy cron tự huỷ đặt chỗ + nhắc sạc

```bash
npm run cron:expire          # daemon, tick mỗi 60s
```

Huỷ reservation `PENDING` quá 15 phút giờ bắt đầu + gửi thông báo nhắc 15 phút trước giờ sạc. Khoảng tick: `CRON_INTERVAL_MS` env (mặc định 60000). Có thể gắn vào systemd/Task Scheduler cho chạy nền lâu dài.

## OCPP (Central System + simulator)

```bash
npm run ocpp:server          # CSMS WebSocket, mặc định :9220 (OCPP_PORT)
npm run ocpp:sim             # simulator — tự chọn 1 station + khách hàng từ DB
npm run ocpp:sim -- "<stationId>" customer@evcharge.com
```

Flow: `BootNotification → StatusNotification → StartTransaction → MeterValues×N → StopTransaction`. Sau khi chạy, xem hóa đơn + loyalty mới và `/admin/live`.

## Tài liệu

- `GIOI_THIEU_DO_AN.md` — giới thiệu, phạm vi, mô hình nghiệp vụ.
- `MO_HINH_HOA_YEU_CAU.md` — use case, lớp, hoạt động, sequence (tạo bằng scripts/`gen_*.py`).
- `PHAN_TICH_THIET_KE_HE_THONG.md` — phân tích + thiết kế hệ thống.
- `SETUP.md` — hướng dẫn cài đặt chi tiết + test card VNPay + voucher demo.

## Scripts

`npm run dev` · `npm run build` · `npm run start` · `npm run cron:expire` · `npm run ocpp:server` · `npm run ocpp:sim`