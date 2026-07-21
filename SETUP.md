# EV Charging — Setup Guide (Phase 3)

## Cài đặt

```bash
cd D:\ev-charging
npm install web-push @types/web-push
npx prisma db push --force-reset
npx prisma generate
npx tsx prisma/seed.ts
npm run dev
```

## Tài khoản

| Email | Mật khẩu | Vai trò |
|-------|----------|---------|
| admin@evcharge.com | 123456 | Admin |
| customer@evcharge.com | 123456 | Khách (350 pts, 500k VND) |
| vip@evcharge.com | 123456 | VIP Gold (2,500 pts, 2M VND) |
| tech@evcharge.com | 123456 | Kỹ thuật |
| tech2@evcharge.com | 123456 | Kỹ thuật |

## Voucher demo (đã seed)

| Code | Loại | Giá trị |
|------|------|---------|
| WELCOME50 | % | 50% tối đa 50K |
| EVDAY10 | % | 10% tối đa 30K |
| FREE20K | Fixed | 20K (đơn từ 100K) |
| PEAK15 | % | 15% tối đa 100K |
| VIP100K | Fixed | 100K (đơn từ 200K) |

## VNPay Sandbox test card

- Số thẻ: `9704198526191432198`
- Tên: `NGUYEN VAN A`  
- Phát hành: `07/15`
- OTP: `123456`

## Web Push Notification

VAPID keys đã set sẵn trong .env. Để generate keys mới:
```bash
npx web-push generate-vapid-keys
```
Cập nhật vào .env: `NEXT_PUBLIC_VAPID_PUBLIC` và `VAPID_PRIVATE`.

User bật push: vào sidebar → click "Bật thông báo" → cấp quyền browser.

## Dark Mode

Toggle bằng:
- Top bar (icon 🌙/☀️)
- User menu sidebar
- Saved trong localStorage

## Geolocation - Tìm trạm gần

Trang `/stations` có 3 view: List / Map / Near (📍).
View "Near" yêu cầu permission browser → tự sort theo khoảng cách.

## Print PDF Hoá đơn

Trang `/invoices/{id}/print` — design hoá đơn print-ready với CSS @media print.
Click "🖨 In / PDF" → browser print dialog → Save as PDF.

## Cron jobs (tự huỷ + nhắc nhở)

PowerShell loop:
```powershell
while ($true) { npx tsx scripts/cron-expire.ts; Start-Sleep 60 }
```

Hoặc Windows Task Scheduler chạy mỗi 1 phút.

## Cấu trúc mới (Phase 3)

```
src/
├── app/
│   ├── vouchers/                    # Customer voucher list
│   ├── admin/vouchers/              # Admin voucher management
│   ├── invoices/[id]/print/         # Print-friendly invoice
│   ├── api/
│   │   ├── vouchers/                # CRUD + validate
│   │   ├── push/                    # subscribe/unsubscribe/test
│   │   ├── stations/near/           # Geolocation search
│   │   └── invoices/[id]/pdf/       # Print data
├── components/
│   ├── ThemeProvider.tsx            # Dark mode
│   └── AppShell.tsx                 # Theme toggle + push toggle
├── lib/
│   ├── voucher.ts                   # Voucher validation logic
│   ├── push.ts                      # Web push helper
│   └── notify.ts                    # Auto-trigger DB + push
└── public/
    ├── sw.js                        # Service Worker
    └── manifest.json                # PWA manifest
```


## Nâng cấp mới (Realtime + OCPP)

### Giám sát realtime (SSE)
- Trang `/admin/live` — dashboard trạng thái trụ sạc realtime qua Server-Sent Events (`/api/stations/live/stream`), thay cho polling. Client mở 1 kết nối `EventSource`, server đẩy dữ liệu khi trạng thái slot thay đổi.

### Biểu đồ doanh thu (Chart.js)
- Trang `/admin/revenue` — biểu đồ kết hợp cột doanh thu (₫) + đường năng lượng (kWh) hai trục, dùng `chart.js` + `react-chartjs-2`.

### OCPP 1.6-J thật (WebSocket)
Central System (CSMS) + charge point simulator nói giao thức OCPP 1.6 JSON qua WebSocket. Năng lượng đo từ `MeterValues` chảy vào đúng pipeline tính cước + tích điểm loyalty của app.

```bash
# 1) Chạy Central System (cổng mặc định 9220)
npm run ocpp:server

# 2) Ở terminal khác, chạy trụ sạc mô phỏng (tự lấy 1 station + 1 khách hàng từ DB)
npm run ocpp:sim

# Hoặc chỉ định station + idTag (email/userId):
npm run ocpp:sim -- "<stationId>" "customer@evcharge.com"
```

Luồng mô phỏng: `BootNotification → StatusNotification → StartTransaction → MeterValues×N → StopTransaction`. Sau khi chạy, kiểm tra hóa đơn mới + điểm loyalty của user tăng, và `/admin/live` phản ánh trạng thái trụ theo thời gian thực.

- URL trụ kết nối: `ws://localhost:9220/ocpp/{stationId}` (subprotocol `ocpp1.6`).
- Cấu hình cổng: `OCPP_PORT` trong `.env`.
