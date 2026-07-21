# PHẦN MỞ ĐẦU — HỆ THỐNG QUẢN LÝ TRẠM SẠC XE ĐIỆN V-GREEN

## 1. Giới thiệu tổng quan đồ án

**V-GREEN EV Charging** là hệ thống vận hành và quản lý mạng lưới trạm sạc xe điện thông minh, được xây dựng nhằm kết nối ba nhóm đối tượng chính trong hệ sinh thái xe điện: **người dùng cá nhân**, **doanh nghiệp vận hành đội xe** (fleet) và **đơn vị quản lý trạm sạc**.

Hệ thống cho phép người dùng tìm kiếm trạm sạc trên bản đồ thời gian thực, đặt chỗ trước, check-in bằng mã QR, thực hiện phiên sạc, thanh toán qua ví điện tử tích hợp và tích lũy điểm thưởng. Ở phía vận hành, hệ thống cung cấp bảng điều khiển quản trị để theo dõi doanh thu, quản lý trạm và trụ sạc, cấu hình biểu giá điện theo khung giờ, xử lý phiếu bảo trì và quản lý các chương trình khuyến mãi.

Đồ án lấy cảm hứng từ thực tế phát triển nhanh chóng của thị trường xe điện Việt Nam, đặc biệt là mạng lưới trạm sạc VinFast và các dịch vụ gọi xe điện như Xanh SM. Hệ thống được phát triển trên nền tảng web hiện đại với các công nghệ:

| Thành phần | Công nghệ |
|------------|-----------|
| Framework | Next.js 14 (App Router) |
| Ngôn ngữ | TypeScript |
| Truy xuất dữ liệu | Prisma ORM |
| Cơ sở dữ liệu | SQLite |
| Cổng thanh toán | VNPay |
| Bản đồ | Leaflet Maps |
| Giao diện | Tailwind CSS |
| Xác thực | JWT (JSON Web Token) |

Hệ thống quản lý đầy đủ các đối tượng nghiệp vụ: người dùng (4 vai trò), trạm sạc, trụ sạc, đặt chỗ, phiên sạc, hóa đơn, ví điện tử, giao dịch thanh toán, biểu giá điện, điểm thưởng, voucher, đánh giá, phương tiện, đội xe doanh nghiệp, phiếu bảo trì và thông báo.

---

## 2. Thực trạng hiện nay

Thị trường xe điện Việt Nam đang tăng trưởng mạnh mẽ, kéo theo nhu cầu sạc điện ngày càng lớn. Tuy nhiên, trải nghiệm sử dụng trạm sạc và công tác vận hành vẫn còn nhiều hạn chế:

**Đối với người dùng cá nhân:**
- **Không nắm được tình trạng trụ sạc trước khi đến.** Người dùng phải lái xe đến tận nơi mới biết trạm còn chỗ trống hay không, gây mất thời gian và tốn pin khi phải di chuyển sang trạm khác.
- **Thiếu cơ chế đặt chỗ trước.** Việc sạc theo kiểu "ai đến trước sạc trước" khiến người dùng không thể chủ động lên kế hoạch, đặc biệt vào giờ cao điểm.
- **Thanh toán rời rạc, bất tiện.** Thiếu ví điện tử tích hợp, thiếu mã giảm giá và không có chương trình tích điểm để khuyến khích sử dụng lâu dài.

**Đối với doanh nghiệp đội xe (Xanh SM, giao vận…):**
- **Khó quản lý tập trung.** Các công ty có hàng trăm đến hàng nghìn xe điện không có công cụ theo dõi: tài xế nào sạc ở đâu, chi phí bao nhiêu, chính sách chiết khấu ra sao.
- **Không có chính sách giá riêng** cho khách hàng doanh nghiệp dùng số lượng lớn.

**Đối với đơn vị vận hành trạm:**
- **Quản lý bảo trì thủ công.** Khi trụ sạc hỏng, việc tiếp nhận, phân loại mức độ ưu tiên và phân công kỹ thuật viên còn chậm và thiếu hệ thống.
- **Thiếu dữ liệu vận hành.** Người quản lý khó nắm được doanh thu theo thời gian, trạm nào hoạt động hiệu quả, khung giờ nào đông khách để tối ưu nguồn lực.
- **Biểu giá cứng nhắc.** Chưa áp dụng linh hoạt giá theo khung giờ cao/thấp điểm để điều tiết nhu cầu.

Những hạn chế trên cho thấy nhu cầu cấp thiết về một nền tảng thống nhất, kết nối toàn bộ quy trình từ tìm trạm, đặt chỗ, sạc, thanh toán cho đến quản trị và bảo trì.

---

## 3. Mục đích đồ án

Đồ án hướng đến xây dựng một hệ thống quản lý trạm sạc xe điện hoàn chỉnh nhằm giải quyết các vấn đề thực trạng nêu trên, với các mục tiêu cụ thể:

1. **Nâng cao trải nghiệm người dùng:** cung cấp bản đồ trạm sạc thời gian thực, cho phép tìm trạm theo vị trí, lọc theo loại đầu cắm và công suất, đặt chỗ trước (một lần hoặc lặp lại hàng tuần), check-in nhanh bằng mã QR.

2. **Tích hợp thanh toán liền mạch:** xây dựng ví điện tử trong ứng dụng, hỗ trợ nạp tiền qua cổng VNPay, thanh toán hóa đơn tự động, áp dụng mã giảm giá (voucher) và chương trình tích điểm đổi quà.

3. **Tự động hóa tính cước:** áp dụng biểu giá điện linh hoạt theo khung giờ (cao điểm/thấp điểm), tự động tính lượng điện tiêu thụ và lập hóa đơn ngay khi kết thúc phiên sạc.

4. **Hỗ trợ khách hàng doanh nghiệp:** quản lý đội xe (fleet), tự động áp dụng chiết khấu cho tài xế thuộc doanh nghiệp, quản lý phương tiện gắn với từng đội xe.

5. **Cung cấp công cụ quản trị toàn diện:** bảng điều khiển thống kê doanh thu, quản lý trạm/trụ, người dùng, biểu giá, voucher; quy trình quản lý bảo trì có phân công kỹ thuật viên và theo dõi tiến độ.

6. **Đảm bảo chất lượng dịch vụ:** cơ chế tự động hủy đặt chỗ quá hạn để chống chiếm trụ, hệ thống đánh giá trạm có xác thực (chỉ người đã sạc mới được đánh giá), thông báo đẩy cho các sự kiện quan trọng.

7. **Áp dụng kiến thức phân tích thiết kế hệ thống:** vận dụng mô hình hóa yêu cầu bằng UML (Use Case, Activity Diagram, Sequence Diagram) và thiết kế cơ sở dữ liệu quan hệ cho một bài toán nghiệp vụ thực tế.

---

## 4. Phạm vi thực hiện

### 4.1 Phạm vi chức năng

Hệ thống được triển khai với các nhóm chức năng chính:

| Nhóm chức năng | Nội dung |
|----------------|----------|
| Tài khoản & xác thực | Đăng ký, đăng nhập, đăng xuất, quên/đặt lại mật khẩu, đổi mật khẩu, quản lý hồ sơ |
| Tìm kiếm & xem trạm | Bản đồ trạm, danh sách, tìm trạm gần, gợi ý, chi tiết trạm, trạng thái trụ thời gian thực, quét QR |
| Đặt chỗ | Đặt chỗ một lần, đặt lặp lại hàng tuần, check-in, hủy, tự động hủy quá hạn, nhắc lịch |
| Phiên sạc | Bắt đầu, theo dõi, kết thúc phiên, tính điện năng & cước, lịch sử, thống kê |
| Hóa đơn & thanh toán | Xem hóa đơn, thanh toán bằng ví, áp voucher, xuất hóa đơn PDF |
| Ví điện tử | Xem số dư & lịch sử, nạp tiền qua VNPay |
| Khách hàng thân thiết | Tích điểm, đổi điểm, phân hạng thành viên (Bronze/Silver/Gold/Platinum) |
| Đánh giá trạm | Xem, gửi/sửa đánh giá (có xác thực đã sạc), duyệt đánh giá |
| Phương tiện | Quản lý xe cá nhân, liên kết xe với đội xe |
| Thông báo | Xem, đánh dấu đã đọc, đăng ký & nhận thông báo đẩy |
| Bảo trì | Tạo phiếu, phân công kỹ thuật viên, cập nhật & đóng phiếu |
| Quản trị | Bảng điều khiển, quản lý trạm/người dùng/biểu giá/voucher/fleet, báo cáo doanh thu |

### 4.2 Phạm vi người dùng (Actor)

Hệ thống phục vụ **4 vai trò người dùng**:
- **Khách hàng (Customer):** người dùng cá nhân sở hữu xe điện.
- **Tài xế đội xe (Driver):** tài xế thuộc doanh nghiệp, hưởng chiết khấu fleet.
- **Kỹ thuật viên (Technician):** xử lý phiếu bảo trì được phân công.
- **Quản trị viên (Admin):** quản lý toàn bộ hệ thống.

Ngoài ra có các tác nhân ngoài: **cổng thanh toán VNPay**, **bộ định thời (cron)** chạy tự động và **dịch vụ thông báo đẩy**.

### 4.3 Phạm vi dữ liệu mẫu

Hệ thống được khởi tạo với dữ liệu mẫu sát thực tế: 16 trạm sạc (13 tại TP.HCM, 2 tại Hà Nội, 1 trạm đối tác), nhiều loại đầu cắm (CCS2, Type 2, CHAdeMO, GB/T), công suất từ 7 kW đến 150 kW; 6 mức biểu giá theo khung giờ; 2 đội xe doanh nghiệp; cùng dữ liệu người dùng, phương tiện, voucher và lịch sử phiên sạc mẫu.

### 4.4 Giới hạn phạm vi

Trong khuôn khổ đồ án, hệ thống tập trung vào **phần mềm quản lý và nghiệp vụ**, không bao gồm:
- Tích hợp phần cứng trụ sạc thật (giao thức OCPP với thiết bị vật lý) — phiên sạc và lượng điện được mô phỏng theo công suất và thời gian.
- Ứng dụng di động native — hệ thống triển khai dưới dạng ứng dụng web (responsive).
- Thanh toán tiền thật — sử dụng môi trường thử nghiệm (sandbox) của VNPay.
- Sử dụng cơ sở dữ liệu SQLite phục vụ phát triển và minh họa, chưa triển khai ở quy mô production.

---

## 5. Tác nhân (Actor) của hệ thống

Hệ thống V-GREEN có **5 tác nhân chính** (con người) và **3 tác nhân phụ/hệ thống ngoài**, được xác định chi tiết trong tài liệu mô hình hóa yêu cầu (`MO_HINH_HOA_YEU_CAU.md`).

### 5.1 Tác nhân chính (Primary Actors)

| Actor | Mô tả | Quyền hạn tiêu biểu |
|-------|-------|----------------------|
| **Khách vãng lai (Guest)** | Người dùng chưa đăng nhập, truy cập hệ thống ở mức công khai | Đăng ký, đăng nhập, quên mật khẩu, xem bản đồ & danh sách trạm công khai |
| **Khách hàng (Customer)** | Người dùng cá nhân sở hữu xe điện, đã đăng nhập | Tìm/đặt chỗ trạm sạc, thực hiện phiên sạc, thanh toán hóa đơn, quản lý ví, tích điểm, đánh giá trạm, quản lý xe cá nhân, nhận thông báo |
| **Tài xế đội xe (Driver)** | Tài xế thuộc doanh nghiệp vận hành đội xe (fleet), ví dụ Xanh SM | Kế thừa toàn bộ quyền của Customer; tự động được áp **chiết khấu fleet** khi thanh toán; xe được gắn với `fleetId` của doanh nghiệp |
| **Kỹ thuật viên (Technician)** | Nhân sự kỹ thuật xử lý sự cố trụ sạc | Xem các phiếu bảo trì được phân công, cập nhật trạng thái xử lý (OPEN → IN_PROGRESS → RESOLVED), nhận thông báo phân công |
| **Quản trị viên (Admin)** | Người quản lý toàn bộ hệ thống | Toàn quyền: dashboard doanh thu, quản lý trạm/trụ, người dùng & phân quyền, biểu giá, voucher, đội xe (fleet), phiếu bảo trì, duyệt đánh giá |

**Quan hệ kế thừa (generalization) giữa các actor:**

```
Customer  is-a  Guest       (Customer thực hiện được mọi việc Guest làm được, cộng thêm quyền riêng)
Driver    is-a  Customer    (Driver kế thừa toàn bộ use case của Customer)
Technician is-a Guest       (đăng nhập rồi có vùng chức năng riêng)
Admin     is-a  Guest       (đăng nhập rồi có vùng chức năng riêng)
```

Việc phân quyền theo vai trò (role-based access control) được thực hiện thông qua **JWT token** — mỗi token mang theo `role` (`CUSTOMER`, `DRIVER`, `TECHNICIAN`, `ADMIN`) để middleware kiểm tra quyền truy cập API và route.

### 5.2 Tác nhân phụ / Hệ thống ngoài (Secondary Actors)

| Actor | Vai trò trong hệ thống |
|-------|--------------------------|
| **Cổng thanh toán VNPay** | Nhận yêu cầu nạp tiền từ hệ thống, xử lý thanh toán, trả kết quả về qua **Return URL** (khi người dùng quay lại trình duyệt) và **IPN** (thông báo server-to-server, đáng tin cậy hơn để chốt giao dịch) |
| **Bộ định thời (Cron/Scheduler)** | Chạy các tác vụ tự động theo lịch: tự động hủy đặt chỗ quá hạn 15 phút, nhắc lịch sạc trước giờ hẹn |
| **Dịch vụ thông báo đẩy (Web Push)** | Gửi thông báo tới trình duyệt/thiết bị của người dùng khi có sự kiện quan trọng (hoàn tất phiên sạc, phiếu bảo trì được phân công, lên hạng thành viên…) |

---

## 6. Chức năng chi tiết theo nhóm

Toàn bộ chức năng của hệ thống được tổ chức thành **12 gói (module)**, ký hiệu A → L, mỗi gói gắn với các tác nhân cụ thể. Bảng dưới tổng hợp mục tiêu chính và tác nhân sử dụng của từng gói (chi tiết từng use case xem tại `MO_HINH_HOA_YEU_CAU.md`):

| Gói | Tên gói chức năng | Tác nhân chính | Chức năng nổi bật |
|-----|--------------------|-----------------|---------------------|
| **1** | Tài khoản & Xác thực | Guest, mọi người dùng đã đăng nhập | Đăng ký, đăng nhập/đăng xuất, quên & đặt lại mật khẩu, đổi mật khẩu, xem/cập nhật hồ sơ |
| **2** | Tìm kiếm & Xem trạm sạc | Guest, Customer/Driver, Admin | Bản đồ trạm thời gian thực (Leaflet), tìm trạm gần, gợi ý trạm, chi tiết trạm, trạng thái trụ live, lọc theo connector/công suất, quét mã QR trụ |
| **3** | Đặt chỗ | Customer/Driver, Cron, Admin | Đặt chỗ một lần & lặp lại hàng tuần, kiểm tra trùng khung giờ, check-in tại trạm, hủy đặt chỗ, tự động hủy quá hạn 15 phút, nhắc lịch |
| **4** | Phiên sạc | Customer/Driver | Bắt đầu/theo dõi/kết thúc phiên sạc, tự động tính điện năng & cước theo biểu giá theo giờ, áp chiết khấu fleet, cộng điểm thưởng, lịch sử & thống kê phiên |
| **5** | Hóa đơn & Thanh toán | Customer/Driver | Xem hóa đơn, thanh toán bằng ví điện tử, áp dụng & kiểm tra hợp lệ voucher, xuất hóa đơn PDF |
| **6** | Ví điện tử & VNPay | Customer/Driver, VNPay | Xem số dư & lịch sử ví, nạp tiền qua cổng VNPay, xử lý Return URL & IPN, đối soát chữ ký giao dịch |
| **7** | Khách hàng thân thiết (Loyalty) | Customer/Driver, Admin | Tích điểm khi thanh toán, đổi điểm lấy tiền vào ví, tự động nâng hạng (Bronze/Silver/Gold/Platinum), quản trị điểm |
| **8** | Đánh giá trạm | Customer, Admin | Gửi/sửa đánh giá 1–5 sao có xác thực đã từng sạc (verified purchase), tự động cập nhật rating trung bình, Admin duyệt/xóa đánh giá |
| **9** | Quản lý phương tiện | Customer/Driver | Thêm/sửa/xóa xe cá nhân, liên kết xe với đội xe (fleet) đối với Driver |
| **10** | Thông báo | Customer, Technician, Cron | Xem thông báo, đánh dấu đã đọc, đăng ký nhận Web Push, hệ thống/Cron tự động gửi thông báo |
| **11** | Quản lý bảo trì | Admin, Technician | Tạo phiếu bảo trì (tự động khóa trụ về `MAINTENANCE`), phân công kỹ thuật viên, cập nhật tiến độ, đóng phiếu (mở lại trụ về `AVAILABLE`) |
| **12** | Quản trị hệ thống | Admin | Dashboard & thống kê doanh thu, quản lý trạm/trụ, người dùng & phân quyền, biểu giá theo khung giờ, voucher, đội xe (fleet), theo dõi thanh toán, duyệt đánh giá |

### 6.1 Chức năng theo từng vai trò người dùng

**Khách vãng lai (Guest)** có thể: đăng ký/đăng nhập, quên & đặt lại mật khẩu, xem bản đồ và danh sách trạm sạc công khai — chưa đặt chỗ hay sạc được.

**Khách hàng (Customer)** — vai trò trung tâm của hệ thống, sở hữu đầy đủ vòng đời sử dụng dịch vụ:
1. Tìm trạm phù hợp (gần, còn trống, đúng loại đầu cắm/công suất cần).
2. Đặt chỗ trước (một lần hoặc lặp lại hàng tuần) và check-in bằng QR khi đến trạm.
3. Thực hiện phiên sạc, theo dõi thời gian/điện năng theo thời gian thực.
4. Nhận hóa đơn tự động, thanh toán bằng ví điện tử (có thể áp voucher giảm giá).
5. Tích điểm thưởng, đổi điểm lấy tiền, theo dõi hạng thành viên.
6. Đánh giá trạm sau khi đã sạc, quản lý xe cá nhân, nhận thông báo.

**Tài xế đội xe (Driver)** thực hiện toàn bộ quy trình như Customer, khác biệt duy nhất là **được tự động áp dụng chiết khấu theo chính sách của doanh nghiệp (fleet)** khi tính cước và thanh toán, phục vụ mô hình B2B2C (doanh nghiệp — tài xế — trạm sạc).

**Kỹ thuật viên (Technician)** tập trung vào nghiệp vụ bảo trì: nhận thông báo khi được phân công phiếu, xem chi tiết sự cố, cập nhật tiến độ xử lý và đóng phiếu khi hoàn tất, giúp trụ sạc quay lại trạng thái `AVAILABLE`.

**Quản trị viên (Admin)** giữ vai trò vận hành & giám sát toàn hệ thống: theo dõi doanh thu và hiệu suất qua dashboard, quản lý hạ tầng trạm/trụ, cấu hình biểu giá điện theo khung giờ, quản lý người dùng và đội xe doanh nghiệp, thiết lập chương trình voucher/khuyến mãi, kiểm duyệt đánh giá và giám sát công tác bảo trì.

---

## 7. Quy tắc nghiệp vụ & vòng đời trạng thái (cơ sở vẽ Use Case Model & Activity Diagram)

Phần này bổ sung các **quy tắc nghiệp vụ** và **vòng đời trạng thái (state machine)** của từng đối tượng — thông tin bắt buộc phải có để vẽ đúng luồng rẽ nhánh (decision/guard condition) trong Activity Diagram, cũng như xác định quan hệ `<<include>>`/`<<extend>>` giữa các use case.

### 7.1 Vòng đời trạng thái các đối tượng chính

| Đối tượng | Các trạng thái | Chuyển trạng thái | Điều kiện chuyển |
|-----------|-----------------|---------------------|--------------------|
| **Reservation** (Đặt chỗ) | `PENDING → CONFIRMED → COMPLETED`; `PENDING → CANCELLED` | Tạo mới → PENDING; Check-in đúng giờ → CONFIRMED; Kết thúc phiên sạc → COMPLETED; Quá 15' không check-in hoặc người dùng hủy → CANCELLED | Check-in phải trong vòng 15 phút kể từ `startTime` |
| **Slot** (Trụ sạc) | `AVAILABLE ⇄ OCCUPIED ⇄ CHARGING`; `AVAILABLE ⇄ MAINTENANCE` | Check-in → OCCUPIED; Bắt đầu sạc → CHARGING; Kết thúc phiên → AVAILABLE; Tạo phiếu bảo trì gắn trụ → MAINTENANCE; Đóng phiếu bảo trì → AVAILABLE | Trụ đang MAINTENANCE không thể được đặt chỗ/sạc |
| **ChargingSession** (Phiên sạc) | `ACTIVE → COMPLETED` | Check-in tạo phiên → ACTIVE; Người dùng bấm kết thúc → COMPLETED | Khi COMPLETED thì tính `energyKwh`, tạo Invoice |
| **Invoice** (Hóa đơn) | `UNPAID → PAID` | Tạo tự động khi kết thúc phiên → UNPAID; Thanh toán bằng ví thành công → PAID | Chỉ thanh toán khi số dư ví ≥ `amount` sau giảm giá |
| **Payment** (Giao dịch VNPay) | `PENDING → SUCCESS`; `PENDING → FAILED` | Tạo giao dịch nạp → PENDING; VNPay phản hồi mã `00` & chữ ký hợp lệ → SUCCESS; ngược lại → FAILED | Idempotent: chỉ cộng ví một lần dù nhận phản hồi qua cả Return URL và IPN |
| **MaintenanceTicket** (Phiếu bảo trì) | `OPEN → IN_PROGRESS → RESOLVED → CLOSED` | Admin tạo phiếu → OPEN; Kỹ thuật viên nhận xử lý → IN_PROGRESS; Sửa xong → RESOLVED (+ `resolvedAt`); Admin xác nhận → CLOSED | RESOLVED/CLOSED trả trụ liên quan về `AVAILABLE` |
| **Voucher** (Mã giảm giá) | `active = true/false`; `usedCount` tăng dần | Tạo mới → active; Hết `validUntil` hoặc đạt `usageLimit` → hết hiệu lực | Hợp lệ khi: còn hạn (`validFrom ≤ now ≤ validUntil`), `amount ≥ minAmount`, `usedCount < usageLimit`, số lần dùng của user < `perUserLimit` |
| **User.loyaltyTier** (Hạng thành viên) | `BRONZE → SILVER → GOLD → PLATINUM` | Tự động tính lại sau mỗi lần cộng điểm (`G2 <<include>> G5`) dựa trên tổng điểm lũy kế | Không giảm hạng, chỉ tăng theo ngưỡng điểm |

### 7.2 Quy tắc nghiệp vụ then chốt (business rules)

Các công thức/điều kiện dưới đây là "guard condition" cần thể hiện trong các nhánh rẽ (`if/else`) của Activity Diagram:

1. **Chống trùng khung giờ (C9):** một `Slot` không được có 2 `Reservation` ở trạng thái `PENDING/CONFIRMED` có khung giờ giao nhau (`startTime`/`endTime` chồng lấp).
2. **Cửa sổ check-in:** người dùng phải check-in trong vòng **15 phút** kể từ `startTime`; quá hạn → Cron tự động chuyển `CANCELLED`.
3. **Tính điện năng tiêu thụ:** `energyKwh = (thời gian sạc theo giờ) × powerKw × hệ số hiệu suất 0.9`.
4. **Áp biểu giá theo giờ (Tariff):** tra `Tariff` có `startHour ≤ giờ hiện tại < endHour` để lấy `ratePerKwh`; có cấu hình khung `isPeak` (cao điểm) và không cao điểm.
5. **Chiết khấu đội xe (fleet):** nếu người thực hiện phiên sạc có `fleetId` (Driver) → `subtotal × (1 − Fleet.discountRate)`.
6. **Tích điểm thưởng:** `pointsEarned = floor(amount / 10000)` (mỗi 10.000đ = 1 điểm).
7. **Đổi điểm lấy tiền:** tối thiểu 100 điểm, phải là bội số của 100; `value (VND) = điểm × 100`.
8. **Áp dụng voucher:** loại `PERCENT` (giảm theo %, có `maxDiscount` giới hạn) hoặc `FIXED` (giảm số tiền cố định); chỉ áp khi `amount ≥ minAmount`.
9. **Điều kiện được đánh giá trạm (verified purchase):** chỉ cho phép `Review` nếu người dùng có ít nhất một `ChargingSession` trạng thái hoàn tất tại đúng `stationId`; mỗi user chỉ 1 review/trạm (`@@unique([userId, stationId])`).
10. **Cập nhật rating trung bình:** `Station.rating` và `Station.reviewCount` được tính lại mỗi khi có review mới/sửa/xóa.
11. **Chu kỳ Cron:** chạy mỗi 1 phút để quét đặt chỗ quá hạn; chạy định kỳ để nhắc lịch sạc sắp tới.
12. **Đối soát thanh toán VNPay:** phải kiểm tra chữ ký HMAC-SHA512 và số tiền khớp trước khi cộng ví — thực hiện độc lập ở cả hai kênh Return URL và IPN.

### 7.3 Danh sách luồng cần thể hiện bằng Activity Diagram

| # | Tên luồng | Actor liên quan | Điểm rẽ nhánh chính |
|---|-----------|-------------------|-------------------------|
| 1 | Đăng ký & Đăng nhập | Guest | Email đã tồn tại? / Sai thông tin đăng nhập? |
| 2 | Đặt chỗ → Check-in → Sạc → Lập hóa đơn (luồng lõi, xuyên suốt gói C+D) | Customer/Driver, Cron | Trùng khung giờ? / Quá hạn check-in? / Thuộc fleet? |
| 3 | Thanh toán hóa đơn bằng ví + áp voucher | Customer/Driver | Có dùng voucher? / Voucher hợp lệ? / Số dư đủ? |
| 4 | Nạp tiền qua VNPay (Return URL + IPN song song) | Customer, VNPay | Chữ ký hợp lệ? / Mã phản hồi thành công? |
| 5 | Đổi điểm thưởng lấy tiền vào ví | Customer/Driver | Đủ điều kiện quy tắc điểm? / Đủ điểm? |
| 6 | Gửi/sửa đánh giá trạm | Customer | Rating hợp lệ (1–5)? / Đã từng sạc tại trạm? |
| 7 | Quy trình quản lý bảo trì (tạo → phân công → xử lý → đóng phiếu) | Admin, Technician | Có gắn trụ? / Có phân công ngay? / Đã sửa xong? / Đạt yêu cầu? |
| 8 | Cron tự động hủy đặt chỗ quá hạn (vòng lặp `repeat`) | Cron | Còn phiếu quá hạn chưa xử lý? |

---

## 8. Luồng tương tác hệ thống (cơ sở vẽ Sequence Diagram)

### 8.1 Các thành phần tham gia (lifelines)

Mỗi Sequence Diagram trong đồ án sử dụng tối đa các "vai" sau, theo đúng kiến trúc 3 lớp của hệ thống:

| Lifeline | Vai trò |
|----------|---------|
| **Actor** | Khách hàng / Tài xế / Kỹ thuật viên / Admin / Guest — người khởi tạo hành động |
| **UI (Giao diện)** | Trang/màn hình Next.js (App Router) mà actor tương tác |
| **API Route** | Route Handler xử lý nghiệp vụ (`/app/api/**`), tương ứng 1 use case |
| **Database** | Truy vấn qua Prisma ORM đến SQLite |
| **Hệ thống ngoài** | VNPay (cổng thanh toán), Cron/Scheduler, Web Push service |

### 8.2 Nhóm endpoint API chính làm cơ sở xác định message trao đổi

| Gói | Endpoint tiêu biểu | Method | Actor gọi |
|-----|---------------------|--------|-----------|
| A | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/change-password`, `/api/auth/me` | POST/GET/PATCH | Guest, User |
| B | `/api/stations`, `/api/stations/near`, `/api/stations/suggest`, `/api/stations/[id]`, `/api/stations/[id]/slots`, `/api/stations/live`, `/api/slots/qr/[code]` | GET | Guest, Customer |
| C | `/api/reservations`, `/api/reservations/recurring`, `/api/reservations/[id]`, `/api/reservations/[id]/checkin`, `/api/cron/expire-reservations`, `/api/cron/reservation-reminder` | POST/GET/DELETE | Customer/Driver, Cron |
| D | `/api/sessions/[id]/start`, `/api/sessions/[id]`, `/api/sessions/[id]/stop`, `/api/sessions`, `/api/sessions/stats` | POST/GET | Customer/Driver |
| E | `/api/invoices`, `/api/invoices/[id]`, `/api/invoices/[id]/pay`, `/api/invoices/[id]/pdf` | GET/POST | Customer/Driver |
| F | `/api/wallet`, `/api/wallet/topup`, `/api/payments/vnpay/create`, `/api/payments/vnpay/return`, `/api/payments/vnpay/ipn` | GET/POST | Customer, VNPay |
| G | `/api/loyalty`, `/api/loyalty/redeem`, `/api/admin/loyalty` | GET/POST | Customer/Driver, Admin |
| H | `/api/stations/[id]/reviews`, `/api/admin/reviews/[id]` | GET/POST/DELETE | Customer, Admin |
| I | `/api/vehicles`, `/api/vehicles/[id]` | GET/POST/PUT/DELETE | Customer/Driver |
| J | `/api/notifications`, `/api/push/subscribe`, `/api/push/send` | GET/POST | Customer, Technician, Cron |
| K | `/api/maintenance`, `/api/maintenance/[id]` | GET/POST/PATCH | Admin, Technician |
| L | `/api/admin/stats`, `/api/admin/stations`, `/api/admin/users`, `/api/tariffs`, `/api/admin/fleets`, `/admin/vouchers`, `/api/admin/revenue` | GET/POST | Admin |

### 8.3 Danh sách Sequence Diagram cần vẽ (tối thiểu 1 sơ đồ / use case quan trọng)

Gợi ý nhóm theo mức độ ưu tiên — nhóm 1 là các luồng **bắt buộc** phải có vì thể hiện nghiệp vụ lõi và có nhiều actor/hệ thống ngoài tham gia:

**Nhóm 1 — Luồng lõi (nhiều actor, có external system):**
1. Đăng ký tài khoản (A1)
2. Đăng nhập (A2)
3. Đặt chỗ & kiểm tra trùng khung giờ (C1+C9)
4. Check-in & bắt đầu phiên sạc (C6→D1)
5. Kết thúc phiên sạc & lập hóa đơn tự động (D3+D7..D10)
6. Thanh toán hóa đơn bằng ví + áp voucher (E3+E4+E5)
7. Nạp tiền qua VNPay — 2 kênh Return URL & IPN (F3+F4+F5)
8. Tự động hủy đặt chỗ quá hạn (C7 — Cron)
9. Tạo & phân công phiếu bảo trì (K1+K2+K6)

**Nhóm 2 — Luồng bổ trợ:**
10. Tìm kiếm trạm gần đây / bản đồ (B1..B4)
11. Quét QR trụ sạc (B9)
12. Đặt chỗ lặp lại hàng tuần (C2)
13. Đổi điểm thưởng lấy tiền (G3)
14. Gửi/sửa đánh giá trạm (H2+H3+H4)
15. Quản lý phương tiện (I1..I4)
16. Đăng ký & gửi thông báo đẩy (J3+J4)
17. Admin xem dashboard & báo cáo doanh thu (L1+L7)

---

## 9. Mô hình dữ liệu (cơ sở vẽ Class Diagram)

Toàn bộ mô hình dữ liệu được định nghĩa trong `prisma/schema.prisma` với **19 thực thể (model)**. Đây là nguồn thông tin chính xác nhất để vẽ Class Diagram — mỗi `model` Prisma tương ứng 1 lớp, mỗi trường là 1 thuộc tính, mỗi `@relation` là 1 quan hệ giữa lớp.

### 9.1 Phân nhóm thực thể theo domain nghiệp vụ

| Domain | Thực thể (Class) |
|--------|----------------------|
| **Core Business** (Trạm sạc & Đặt chỗ & Phiên sạc) | `User`, `Station`, `Slot`, `Reservation`, `RecurringReservation`, `ChargingSession` |
| **Wallet & Payment** (Ví & Thanh toán) | `Invoice`, `Wallet`, `WalletTransaction`, `Payment`, `Tariff` |
| **Loyalty & Voucher** (Khách hàng thân thiết & Khuyến mãi) | `LoyaltyTransaction`, `Voucher`, `VoucherUsage` |
| **Maintenance** (Bảo trì) | `MaintenanceTicket` |
| **Fleet & Vehicle** (Đội xe & Phương tiện) | `Fleet`, `Vehicle` |
| **Notification & Integration** (Thông báo & Tích hợp) | `Notification`, `Review`, `PushSubscription`, `Webhook`, `WebhookLog`, `ApiKey` |

### 9.2 Thuộc tính & quan hệ chính của từng thực thể

**Domain Core Business**

| Lớp | Thuộc tính chính | Quan hệ |
|-----|---------------------|---------|
| `User` | id, email (unique), password, name, phone, avatar, role, loyaltyPoints, loyaltyTier, emailVerified, resetToken, resetTokenExp, theme, fleetId | 1—N với `Reservation`, `RecurringReservation`, `ChargingSession`, `Invoice`, `WalletTransaction`, `Notification`, `Review`, `LoyaltyTransaction`, `Payment`, `VoucherUsage`, `PushSubscription`, `Vehicle`; 1—1 với `Wallet`; N—1 với `Fleet`; 1—N với `MaintenanceTicket` (2 vai trò: `createdBy` và `assignedTo`) |
| `Station` | id, name, address, city, district, lat, lng, status, openHours, phone, rating, reviewCount, brand, isPremium, imageUrl, amenities, description | 1—N với `Slot`, `MaintenanceTicket`, `Review` |
| `Slot` | id, slotNumber, connectorType, powerKw, status, qrCode (unique), stationId, lastError, lastHeartbeat | N—1 với `Station`; 1—N với `Reservation`, `ChargingSession`, `MaintenanceTicket` |
| `Reservation` | id, userId, slotId, startTime, endTime, status, recurringId | N—1 với `User`, `Slot`, `RecurringReservation`; 1—1 với `ChargingSession` |
| `RecurringReservation` | id, userId, slotId, daysOfWeek, startHour, endHour, startDate, endDate, active | N—1 với `User`; 1—N với `Reservation` |
| `ChargingSession` | id, userId, slotId, reservationId (unique), startTime, endTime, energyKwh, status | N—1 với `User`, `Slot`; 1—1 với `Reservation`, `Invoice` |

**Domain Wallet & Payment**

| Lớp | Thuộc tính chính | Quan hệ |
|-----|---------------------|---------|
| `Invoice` | id, invoiceNo (unique), sessionId (unique), userId, energyKwh, subtotal, discount, voucherCode, amount, pointsEarned, pointsRedeemed, status, paidAt, paymentMethod | 1—1 với `ChargingSession`; N—1 với `User` |
| `Wallet` | id, userId (unique), balance | 1—1 với `User` |
| `WalletTransaction` | id, userId, type, amount, balance, note, paymentId | N—1 với `User` |
| `Payment` | id, userId, txnRef (unique), amount, status, provider, responseCode, bankCode, bankTranNo, ipAddress, paidAt | N—1 với `User` |
| `Tariff` | id, name, startHour, endHour, ratePerKwh, isPeak, active | Không có FK — dùng làm bảng tra cứu (lookup) theo khung giờ |

**Domain Loyalty & Voucher**

| Lớp | Thuộc tính chính | Quan hệ |
|-----|---------------------|---------|
| `LoyaltyTransaction` | id, userId, type, points, balance, reason | N—1 với `User` |
| `Voucher` | id, code (unique), name, description, type (PERCENT/FIXED), value, minAmount, maxDiscount, usageLimit, perUserLimit, validFrom, validUntil, active, usedCount | 1—N với `VoucherUsage` |
| `VoucherUsage` | id, voucherId, userId, invoiceId, discount | N—1 với `Voucher`, `User` |

**Domain Maintenance**

| Lớp | Thuộc tính chính | Quan hệ |
|-----|---------------------|---------|
| `MaintenanceTicket` | id, stationId, slotId (nullable), title, description, priority, status, createdById, assignedToId (nullable), resolvedAt | N—1 với `Station`, `Slot`; N—1 với `User` (2 vai trò: `createdBy`, `assignedTo`) |

**Domain Fleet & Vehicle**

| Lớp | Thuộc tính chính | Quan hệ |
|-----|---------------------|---------|
| `Fleet` | id, name, code (unique), contact, phone, email, vehicleCount, walletShared, discountRate, active | 1—N với `User` (drivers), `Vehicle` |
| `Vehicle` | id, userId, fleetId (nullable), brand, model, licensePlate (unique), connectorType, batteryKwh, vinNumber, active | N—1 với `User`, `Fleet` |

**Domain Notification & Integration**

| Lớp | Thuộc tính chính | Quan hệ |
|-----|---------------------|---------|
| `Notification` | id, userId, title, message, type, read, link | N—1 với `User` |
| `Review` | id, userId, stationId, rating, comment, verified | N—1 với `User`, `Station`; ràng buộc duy nhất `@@unique([userId, stationId])` |
| `PushSubscription` | id, userId, endpoint (unique), p256dh, auth, userAgent | N—1 với `User` |
| `Webhook` | id, name, url, events, secret, active, lastTriggered, failureCount | 1—N (logic) với `WebhookLog` qua `webhookId` |
| `WebhookLog` | id, webhookId, event, payload, responseStatus, responseBody, success | Liên kết logic tới `Webhook` |
| `ApiKey` | id, name, key (unique), partnerId, active, lastUsed, rateLimit | Độc lập, dùng cho tích hợp đối tác bên ngoài |

### 9.3 Ghi chú khi vẽ Class Diagram

- **Đa số thuộc tính "enum" (role, status, type…) được lưu dưới dạng `String`** trong Prisma (SQLite không hỗ trợ enum native) — khi vẽ Class Diagram nên chú thích rõ tập giá trị hợp lệ ngay trong sơ đồ hoặc ghi chú riêng, ví dụ:
  - `User.role`: `CUSTOMER | DRIVER | TECHNICIAN | ADMIN`
  - `User.loyaltyTier`: `BRONZE | SILVER | GOLD | PLATINUM`
  - `Reservation.status`: `PENDING | CONFIRMED | COMPLETED | CANCELLED`
  - `Slot.status`: `AVAILABLE | OCCUPIED | CHARGING | MAINTENANCE`
  - `ChargingSession.status`: `ACTIVE | COMPLETED`
  - `Invoice.status`: `UNPAID | PAID`
  - `Payment.status`: `PENDING | SUCCESS | FAILED`
  - `MaintenanceTicket.status`: `OPEN | IN_PROGRESS | RESOLVED | CLOSED`
  - `MaintenanceTicket.priority`: `LOW | MEDIUM | HIGH | CRITICAL`
  - `Voucher.type`: `PERCENT | FIXED`
  - `WalletTransaction.type` / `LoyaltyTransaction.type`: `TOPUP | PAYMENT | REFUND` / `EARN | REDEEM | ADJUST`
- **Bội số quan hệ (multiplicity):** hầu hết là `1—N` hoặc `N—1`; các quan hệ `1—1` cần lưu ý (`Wallet↔User`, `Invoice↔ChargingSession`, `Reservation↔ChargingSession`) vì được ràng buộc bằng field `@unique`.
- **Quan hệ nhiều vai trò trên cùng 1 lớp `User`:** `MaintenanceTicket` có 2 quan hệ riêng biệt tới `User` (`createdBy` và `assignedTo`) — cần vẽ 2 đường liên kết có nhãn (role name) khác nhau, không gộp chung.
- **Ràng buộc nghiệp vụ nên chú thích trên sơ đồ:** `@@unique([userId, stationId])` của `Review` (mỗi người chỉ đánh giá 1 lần/trạm); `qrCode`, `txnRef`, `licensePlate`, `code` (Fleet/Voucher), `endpoint` (PushSubscription), `key` (ApiKey) đều là `unique`.
- Có thể tham khảo thêm các sơ đồ lớp theo domain đã dựng sẵn dạng draw.io tại `diagrams-drawio/from-markdown/29..34-*.drawio` (Core Business, Wallet/Payment, Loyalty/Voucher, Maintenance, Fleet/Vehicle, Notification/Push Domain) để đối chiếu khi vẽ lại hoặc chuẩn hóa theo cùng bố cục.
