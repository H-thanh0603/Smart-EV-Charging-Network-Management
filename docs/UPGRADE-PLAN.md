# Plan: Hardening + Nâng cấp kiến trúc EV Charging

## Context

Audit toàn diện sau khi hoàn thành UI/UX upgrade (commits `6b84a2b..e3873dd`). Phát hiện 3 race condition trên luồng tiền (double-invoice, double-pay, double-start), 1 endpoint webhook không auth (SSRF + hỏng logic), và các giới hạn kiến trúc (in-memory state, SQLite, Float money, không pagination/test/CI). Plan này chuyển audit thành lộ trình triển khai theo phase, mỗi phase green build + commit riêng. Bước 0 của phase 1: copy plan này vào repo thành `docs/UPGRADE-PLAN.md` (deliverable user yêu cầu).

**Nguyên tắc:** sửa root cause tại điểm dùng chung (claim-pattern trong transaction), không vá từng caller. Ưu tiên fix rẻ-rủi-ro-thấp trước, refactor lớn sau.

---

## Phase 1 — Fix khẩn cấp (~1 ngày)

### 1.1 Webhook trigger: bỏ HTTP self-call, gọi trực tiếp (A1 + bug data/payload)
- Tạo `src/lib/webhook.ts`: extract toàn bộ logic từ `src/app/api/webhooks/trigger/route.ts` thành `export async function triggerWebhooks(event: string, data: unknown)` (giữ nguyên HMAC sign, log, failureCount).
- `src/app/api/sessions/[id]/stop/route.ts:42`: thay `fetch(...)` bằng `triggerWebhooks("session.end", {...}).catch(() => {})` — sửa luôn bug route đọc `data` trong khi caller gửi `payload`.
- Xóa `src/app/api/webhooks/trigger/route.ts` (không còn caller nào khác — đã verify bằng grep auth-list).
- `ponytail:` inline fire-and-forget giữ nguyên; queue/retry ở Phase 4.

### 1.2 Claim-pattern cho `finalizeSession` (A2 — chống double invoice)
`src/lib/session.ts`: trong `$transaction`, câu đầu tiên:
```ts
const claimed = await tx.chargingSession.updateMany({
  where: { id: sessionId, status: "ACTIVE" },
  data: { status: "COMPLETED", endTime, energyKwh },
});
if (claimed.count === 0) throw new Error("SESSION_NOT_ACTIVE");
```
Bỏ `chargingSession.update` cũ (dòng 77-80). Đọc session trước tx giữ nguyên (lấy tariff/fleet info).

### 1.3 Claim-pattern cho invoice pay (A3 — chống double trừ ví)
`src/app/api/invoices/[id]/pay/route.ts`: trong `$transaction`, trước khi trừ ví:
```ts
const claimed = await tx.invoice.updateMany({
  where: { id: invoice.id, status: "UNPAID" },
  data: { status: "PAID", paidAt: new Date(), paymentMethod: "WALLET", subtotal: invoice.amount, discount, voucherCode: ..., pointsRedeemed, amount: finalAmount },
});
if (claimed.count === 0) throw new Error("ALREADY_PAID");
```
Bỏ `invoice.update` cũ; catch `ALREADY_PAID` → 400 "Đã thanh toán".

### 1.4 VNPay constant-time compare (A6)
`src/lib/vnpay.ts:86`:
```ts
const a = Buffer.from(expected, "hex"), b = Buffer.from(vnp_SecureHash || "", "hex");
valid: a.length === b.length && crypto.timingSafeEqual(a, b),
```

### 1.5 Cron endpoint auth (A5)
- `.env.example` + `.env`: thêm `CRON_SECRET`.
- `src/app/api/cron/reservation-reminder/route.ts`: check `req.headers.get("x-cron-secret") === process.env.CRON_SECRET`, sai → 401.
- Dedup reminder 5 phút: thêm field `reminder5SentAt DateTime?` vào `Reservation` (schema.prisma), set sau khi nhắc, thêm vào where clause.
- Ghi chú: endpoint này và `scripts/cron-expire.ts` vẫn trùng logic 15 phút — hợp nhất ở Phase 3 (3.4), không sửa 2 nơi bây giờ.

### 1.6 Station ID: bỏ `id: name` (B1)
`src/app/api/admin/stations/route.ts:31`: xóa `id: name` (để Prisma tự sinh cuid). PUT/DELETE không đổi. DB cũ giữ row ID cũ (String, hoạt động bình thường lẫn cuid mới).

### 1.7 Xóa duplicate topup endpoint (B6)
- Giữ `/api/wallet/topup` (có zod `walletTopupSchema`, client đang dùng).
- Xóa `src/app/api/payments/vnpay/create/route.ts` (không caller — verify bằng grep trước khi xóa).

**Verify Phase 1:** `npm run build` green. Test tay 2 race: mở 2 terminal curl stop cùng session song song → chỉ 1 invoice tạo ra (check DB). Curl `webhooks/trigger` → 404. Curl cron không secret → 401. Commit: `fix: money-path race conditions + webhook auth + misc hardening`.

---

## Phase 2 — Auth & toàn vẹn dữ liệu (~2-3 ngày)

### 2.1 Cookie-only auth, bỏ localStorage token (A4)
Server đã sẵn sàng: login set cookie httpOnly `ev_token` (`auth/login/route.ts:23`), `getTokenFromRequest` đọc cookie (`lib/auth.ts:31`). Chỉ sửa client:
- `src/app/login/page.tsx`: bỏ `localStorage.setItem("token", ...)`, giữ `localStorage.setItem("user", ...)` (phi nhạy cảm, UI cần).
- Sweep ~30 file client: bỏ `const token = localStorage.getItem("token")` + bỏ header `Authorization` trong fetch (fetch cùng origin tự gửi cookie). Pattern grep: `localStorage.getItem("token")`.
- `src/app/api/auth/logout/route.ts`: verify đã xóa cookie `ev_token` (nếu chưa, thêm `cookies.delete`).
- Giữ fallback Bearer trong `getTokenFromRequest` (OCPP/partner API có thể cần) — không phá server.

### 2.2 `middleware.ts` bảo vệ route theo role (A11)
Tạo `src/middleware.ts`: đọc cookie `ev_token`, verify JWT (`lib/auth.ts`), map route → role:
- `/admin*` → ADMIN, `/technician*` → TECHNICIAN, `/driver*` → DRIVER, `/wallet|/sessions|/reservations|...` → login required.
- Sai role/chưa login → redirect `/login`. Thêm security headers (X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy).
- Note: middleware chạy ở edge — `jsonwebtoken` có thể không chạy được trên edge runtime; nếu lỗi, check nhẹ (cookie tồn tại) ở middleware + guard thật giữ ở API. Kiểm tra lúc làm, chọn cách chạy được.

### 2.3 Transaction cho session start (A8)
`src/app/api/sessions/[id]/start/route.ts`: bọc trong `$transaction` — check slot status + check chưa có ACTIVE session + create session + update slot CHARGING, atomic.

### 2.4 Voucher perUserLimit vào transaction (A9)
`src/app/api/invoices/[id]/pay/route.ts`: move `voucherUsage.count` check vào trong tx (trước `voucherUsage.create`). SQLite serialize write → hết race.

### 2.5 Reset token lưu hash (A10)
- `forgot-password/route.ts`: lưu `sha256(token)` thay plaintext.
- `reset-password/route.ts`: lookup bằng `sha256(token)` từ request.

### 2.6 Pagination 5 endpoint list chính (B4)
Pattern chung: đọc `?page=1&limit=20` (max 100), trả `{ items, total, page, limit }`:
- `/api/sessions`, `/api/invoices`, `/api/notifications`, `/api/reservations`, `/api/admin/payments`.
- Client tương ứng: thêm nút "Tải thêm" đơn giản (không làm infinite scroll).
- Các endpoint admin CRUD còn lại giữ nguyên (ít dữ liệu) — ghi chú `ponytail:`.

### 2.7 Fix N+1 `getLiveStations` (B5)
`src/lib/live.ts`: 1 query `chargingSession.findMany({ where: { status: "ACTIVE" }, include slot })` trước vòng lặp, group theo slotId → bỏ query-per-station (dòng 52-55).

**Verify Phase 2:** build green; login → cookie flow hoạt động mọi shell; vào thẳng `/admin` khi chưa login bị chặn bởi middleware; curl 2 request start song song → 1 session. Commit: `feat: cookie auth + middleware guard + pagination + data integrity`.

---

## Phase 3 — Nền chất lượng (~2 ngày)

### 3.1 Test cho 3 hàm tiền tệ (B12)
Node built-in test runner qua tsx (`"test": "tsx --test tests/"`):
- `tests/session.test.ts`: `finalizeSession` — DB SQLite temp (`file:./tests/test.db` + prisma db push schema), seed user/slot/tariff, verify: tính tiền đúng tariff, fleet discount, points, double-call → lần 2 throw.
- `tests/voucher.test.ts`: `validateAndCalculate` — percent cap maxDiscount, fixed vượt amount, expired, limit.
- `tests/vnpay.test.ts`: `buildVNPayUrl` → parse query → `verifyVNPayReturn` roundtrip valid=true; sửa 1 param → valid=false.

### 3.2 CI GitHub Actions
`.github/workflows/ci.yml`: `npm ci` → `npx prisma generate` → `npm run build` → `npm test`. Node 20.

### 3.3 Migrations + index (B8, B9)
- `prisma migrate dev --name init` tạo `prisma/migrations/` từ DB hiện tại.
- Thêm index trong schema: `Reservation(slotId, status, startTime)`, `ChargingSession(status)`, `Notification(userId, read)`, `WalletTransaction(userId)`, `Invoice(userId, status)`.

### 3.4 Hợp nhất cron logic (B7)
- Extract logic tick từ `scripts/cron-expire.ts` vào `src/lib/cron.ts` (`export async function cronTick()`).
- `scripts/cron-expire.ts` và `/api/cron/reservation-reminder` cùng gọi `cronTick()` (route đã có secret guard từ 1.5). cron.ts là nguồn duy nhất, thêm 5-min reminder vào đó.

### 3.5 Soft-delete user (A14)
- Schema: thêm `deletedAt DateTime?` cho User.
- `admin/users/route.ts` DELETE → set `deletedAt`; GET/POST loại user đã xóa; login từ chối user deletedAt.

**Verify Phase 3:** `npm test` green; CI chạy green trên GitHub; `prisma migrate status` sạch. Commit: `test: money-path tests + CI + migrations + soft delete`.

---

## Phase 4 — Scale (chỉ khi cần thật, ~1-2 tuần)

Không làm ngay; roadmap khi có yêu cầu mở rộng:

1. **SQLite → Postgres**: đổi `datasource.provider = "postgresql"`, bỏ `@prisma/adapter-libsql`, `DATABASE_URL` postgres. Code Prisma giữ nguyên ~95%. Bắt buộc khi nhiều instance ghi đồng thời.
2. **Redis**: rate limit (`lib/rate-limit.ts` Map → Redis, fix luôn A7), webhook queue (BullMQ) thay fire-and-forget, cache `getLiveStations`.
3. **OCPP service**: persist `transactionId`/`meterStart` vào cột mới trên `ChargingSession` (sống sót sau restart, fix B3); mTLS hoặc certificate-per-chargepoint thay shared secret; watchdog auto-finalize session > 24h.
4. **Money Float → Int (đồng VND)**: migration schema + soát mọi phép tính. Làm cùng lúc đổi Postgres.
5. **Observability**: structured logging (pino), `/api/health`, error tracking (Sentry).
6. **Nghiệp vụ còn thiếu** (nếu thành sản phẩm thật): phí no-show/deposit đặt chỗ, luồng refund, tariff chia đoạn theo khung giờ, audit log cho admin actions, hóa đơn điện tử chuẩn NĐ123, xác minh email khi đăng ký.

---

## Out of scope (đợt này)

- Phase 4 (chỉ roadmap).
- Đổi UI/UX thêm (đã xong đợt trước).
- OCPP simulator, push notification logic (giữ nguyên).
- `confirm()` → toast còn lại (~14 chỗ, cosmetic).

## Thứ tự & ước lượng

| Phase | Thời gian | Commit |
|---|---|---|
| 1. Fix khẩn cấp | ~1 ngày | 1 commit |
| 2. Auth + integrity | ~2-3 ngày | 1 commit |
| 3. Chất lượng | ~2 ngày | 1 commit |
| 4. Scale | roadmap, không làm đợt này | — |

Mỗi phase: build green trước khi commit + push. Nếu phase 2 (cookie sweep) phát sinh regression ngoài tầm kiểm soát, tách thành commit riêng từng phần (login, shells, pages).

## Verification tổng

1. `npm run build` green sau mỗi phase.
2. `npm test` green từ Phase 3.
3. `npm run dev` + sweep tay: login cookie flow 4 role (admin/customer/driver/tech), stop session song song không double invoice, pay invoice song song không double trừ, cron không secret bị chặn, pagination hoạt động trên /sessions.
4. `git push` sau mỗi commit; CI green trên GitHub (Phase 3 trở đi).
