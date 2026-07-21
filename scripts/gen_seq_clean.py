# -*- coding: utf-8 -*-
"""Part 2: Sequence Diagrams cho V-GREEN EV Charging - chuan UML den-trang."""
import os, html, xml.etree.ElementTree as ET

OUT = os.path.join(os.path.dirname(__file__), "..", "Diagrams")
os.makedirs(OUT, exist_ok=True)

def esc(s): return html.escape(str(s), quote=True)
_uid = 0
def nid(p="n"): global _uid; _uid+=1; return f"{p}{_uid}"

S_ACTOR_S = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=none;strokeColor=#000000;"
S_LIFELINE = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=0;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=none;strokeColor=#000000;fontSize=11;"
S_MSG     = "html=1;verticalAlign=bottom;endArrow=block;strokeColor=#000000;fontSize=10;"
S_REPLY   = "html=1;verticalAlign=bottom;endArrow=open;dashed=1;strokeColor=#000000;fontSize=10;"
S_SELF    = "html=1;verticalAlign=bottom;endArrow=block;strokeColor=#000000;fontSize=10;"
S_FRAME   = "shape=umlFrame;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;fontSize=10;"
S_ACTBAR  = "html=1;points=[];perimeter=orthogonalPerimeter;fillColor=none;strokeColor=#000000;"
S_NOTE    = "shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;darkOpacity=0.05;fillColor=none;strokeColor=#000000;fontSize=9;align=left;"

class Page:
    def __init__(self, name): self.name=name; self.cells=[]
    def vertex(self, vid, val, style, x, y, w, h, parent="1"):
        self.cells.append(f'<mxCell id="{vid}" value="{esc(val)}" style="{style}" vertex="1" parent="{parent}"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')
        return vid
    def edge(self, eid, val, style, src, tgt, pts=None):
        geo = '<mxGeometry relative="1" as="geometry">'
        if pts: geo += '<Array as="points">'+''.join(f'<mxPoint x="{px}" y="{py}"/>' for px,py in pts)+'</Array>'
        geo += '</mxGeometry>'
        self.cells.append(f'<mxCell id="{eid}" value="{esc(val)}" style="{style}" edge="1" parent="1" source="{src}" target="{tgt}">{geo}</mxCell>')
        return eid
    def toxml(self):
        body="".join(self.cells)
        return f'<diagram id="{esc(self.name)}" name="{esc(self.name)}"><mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="2000" pageHeight="1500" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>{body}</root></mxGraphModel></diagram>'

def save(fname, page):
    xml = f'<mxfile host="app.diagrams.net" type="device">{page.toxml()}</mxfile>'
    path = os.path.join(OUT, fname)
    with open(path,"w",encoding="utf-8") as f: f.write(xml)
    ET.fromstring(xml)
    print(f"  {fname}")

class SeqBuilder:
    """Builder don gian cho Sequence Diagram."""
    def __init__(self, title):
        self.p = Page(title)
        self.lifelines = {}  # name -> (x, id)
        self.ly = 80  # current y
        self.lx = 60  # starting x
        self.lw = 120  # width per lifeline
        self.msg_h = 36  # message height step
        self.actor_labels = {}  # name -> label text
        self.act_bars = {}  # name -> current activation bar id

    def add_actor(self, name, label):
        x = self.lx; self.lx += self.lw
        cid = self.p.vertex(nid("a"), label, S_ACTOR_S, x, 60, 40, 70)
        lid = self.p.vertex(nid("l"), "", S_LIFELINE, x+15, 140, 10, 900)
        self.lifelines[name] = (x, cid, lid)
        self.actor_labels[name] = label
        return name

    def add_participant(self, name, label):
        x = self.lx; self.lx += self.lw
        rect_id = self.p.vertex(nid("p"), label, "rounded=1;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;fontSize=10;", x, 50, 100, 30)
        lid = self.p.vertex(nid("l"), "", S_LIFELINE, x+45, 90, 10, 900)
        self.lifelines[name] = (x, rect_id, lid)
        self.actor_labels[name] = label
        return name

    def msg(self, src, dst, label, reply=False):
        """Ve message tu src -> dst."""
        sx, scid, slid = self.lifelines[src]
        dx, dcid, dlid = self.lifelines[dst]
        style = S_REPLY if reply else S_MSG
        eid = self.p.edge(nid("m"), label, style, slid, dlid)
        self.ly += self.msg_h
        return eid

    def self_msg(self, who, label):
        """Self-call."""
        x, cid, lid = self.lifelines[who]
        pts = [(x+80, self.ly+10), (x+150, self.ly+10), (x+150, self.ly+30), (x+80, self.ly+30)]
        eid = self.p.edge(nid("m"), label, S_SELF, lid, lid, pts)
        self.ly += self.msg_h
        return eid

    def note(self, label, x=None, y=None):
        if x is None: x = 50
        if y is None: y = self.ly
        self.p.vertex(nid("n"), label, S_NOTE, x, y, 280, 40)
        self.ly += 50
    def note_wide(self, label):
        self.p.vertex(nid("n"), label, S_NOTE, 30, self.ly, 1100, 30)
        self.ly += 45

    def frame_start(self, label, kind="alt"):
        """Ve combined fragment mo dau."""
        self.p.vertex(nid("f"), f"{kind}\n{label}", S_FRAME, 40, self.ly-10, 1100, 60)
        self.frame_y = self.ly
        self.ly += 20

    def frame_sep(self):
        """Dau phan cach trong alt."""
        self.p.vertex(nid("s"), "", "line;strokeWidth=1;fillColor=none;strokeColor=#000000;dashed=1;", 40, self.ly, 1100, 1)
        self.ly += 15

    def frame_end(self):
        """Ket thuc combined fragment."""
        h = self.ly - self.frame_y + 10
        # update frame height (can't easily, skip for now)

    def gap(self, px=20):
        self.ly += px

def build_seq_register():
    s = SeqBuilder("17-Sequence-DangKy")
    s.add_actor("G","Khach vang lai"); s.add_participant("UI","Giao dien dang ky")
    s.add_participant("API","API Route"); s.add_participant("DB","Database")
    s.msg("G","UI","Nhap email, mat khau, ho ten, so dien thoai")
    s.msg("UI","API","POST /api/auth/register {email, password, name, phone}")
    s.msg("API","DB","SELECT * FROM User WHERE email = ?")
    s.frame_start("[Email da ton tai]","alt")
    s.msg("DB","API","Tim thay user",True)
    s.msg("API","UI","400 Loi \"Email da duoc su dung\"",True)
    s.msg("UI","G","Hien thi thong bao loi",True)
    s.frame_sep()
    s.msg("DB","API","Khong tim thay",True)
    s.self_msg("API","Bam mat khau bcrypt (saltRounds=10)")
    s.msg("API","DB","INSERT INTO User (email, password_hash, name, phone, role='CUSTOMER')")
    s.msg("DB","API","Tao user thanh cong",True)
    s.msg("API","UI","201 Created {user}",True)
    s.msg("UI","G","Chuyen huong sang trang dang nhap",True)
    return s.p

def build_seq_login():
    s = SeqBuilder("18-Sequence-DangNhap")
    s.add_actor("G","Khach vang lai"); s.add_participant("UI","Giao dien dang nhap")
    s.add_participant("API","API Route"); s.add_participant("DB","Database")
    s.msg("G","UI","Nhap email va mat khau")
    s.msg("UI","API","POST /api/auth/login {email, password}")
    s.msg("API","DB","SELECT * FROM User WHERE email = ?")
    s.frame_start("[Email khong ton tai]","alt")
    s.msg("DB","API","Khong tim thay",True)
    s.msg("API","UI","401 \"Email hoac mat khau khong dung\"",True)
    s.msg("UI","G","Hien thi thong bao loi",True)
    s.frame_sep()
    s.msg("DB","API","user {id, email, password_hash, role}",True)
    s.self_msg("API","bcrypt.compare(password, user.password)")
    s.frame_start("[Sai mat khau]","alt")
    s.msg("API","UI","401 \"Email hoac mat khau khong dung\"",True)
    s.msg("UI","G","Hien thi thong bao loi",True)
    s.frame_sep()
    s.self_msg("API","jwt.sign({id,email,role}, SECRET, {expiresIn:'7d'})")
    s.msg("API","UI","200 OK + Set-Cookie: ev_token=JWT",True)
    s.msg("UI","G","Chuyen huong ve trang chu",True)
    return s.p

def build_seq_search():
    s = SeqBuilder("19-Sequence-TimTramGanDay")
    s.add_actor("C","Khach hang"); s.add_participant("UI","Giao dien ban do")
    s.add_participant("API","API Route"); s.add_participant("DB","Database")
    s.msg("C","UI","Mo ban do tram sac")
    s.msg("UI","API","GET /api/stations/near?lat=10.77&lng=106.70&radius=10")
    s.msg("API","DB","SELECT * FROM Station WHERE status='ACTIVE'")
    s.msg("DB","API","Danh sach 16 tram (kem slots)",True)
    s.self_msg("API","Haversine: tinh khoang cach, loc <= ban kinh, sap xep tang dan")
    s.msg("API","UI","200 OK [{id, name, distance, slots}]",True)
    s.msg("UI","C","Hien thi marker Leaflet (xanh=trong, do=het, vang=dang sac)",True)
    return s.p

def build_seq_reservation():
    s = SeqBuilder("20-Sequence-DatCho")
    s.add_actor("C","Khach hang"); s.add_participant("UI","Giao dien dat cho")
    s.add_participant("API","API Route"); s.add_participant("DB","Database")
    s.msg("C","UI","Chon tru va khung gio (startTime, endTime)")
    s.msg("UI","API","POST /api/reservations {slotId, startTime, endTime}")
    s.note_wide("Kiem tra trung khung gio - 3 dieu kien overlap")
    s.msg("API","DB","SELECT * FROM Reservation WHERE slotId=? AND status IN ('PENDING','CONFIRMED') AND (chong start HOAC chong end HOAC bao phu)")
    s.frame_start("[Co trung khung gio]","alt")
    s.msg("DB","API","Tim thay dat cho trung",True)
    s.msg("API","UI","409 \"Tru da duoc dat trong khung gio nay\"",True)
    s.msg("UI","C","Hien thi thong bao loi, de xuat khung gio khac",True)
    s.frame_sep()
    s.msg("DB","API","Khong tim thay",True)
    s.msg("API","DB","INSERT INTO Reservation (userId, slotId, startTime, endTime, status='PENDING')")
    s.msg("DB","API","Tao dat cho thanh cong",True)
    s.msg("API","UI","200 OK {reservation}",True)
    s.msg("UI","C","Hien thi xac nhan dat cho thanh cong",True)
    return s.p

def build_seq_checkin():
    s = SeqBuilder("21-Sequence-CheckIn")
    s.add_actor("C","Khach hang"); s.add_participant("UI","Giao dien dat cho")
    s.add_participant("API","API Route"); s.add_participant("DB","Database")
    s.add_participant("Push","Dich vu thong bao day")
    s.msg("C","UI","Nhan nut \"Check-in\" hoac quet ma QR")
    s.msg("UI","API","POST /api/reservations/{id}/checkin")
    s.msg("API","DB","SELECT * FROM Reservation WHERE id=? AND userId=?")
    s.frame_start("[Qua han check-in (now > startTime + 15phut)]","alt")
    s.msg("DB","API","Tra ve dat cho (PENDING, startTime)",True)
    s.self_msg("API","deadline = startTime + 15phut. now > deadline")
    s.msg("API","DB","UPDATE Reservation SET status='CANCELLED'")
    s.msg("API","DB","INSERT INTO Notification (userId, 'Lich dat bi huy', WARNING)")
    s.msg("DB","API","Da huy",True)
    s.msg("API","UI","400 \"Qua 15 phut, dat cho da bi huy\"",True)
    s.msg("UI","C","Hien thi thong bao qua han",True)
    s.frame_sep()
    s.msg("DB","API","Tra ve dat cho (PENDING, startTime)",True)
    s.self_msg("API","now <= deadline")
    s.msg("API","DB","UPDATE Reservation SET status='CONFIRMED'")
    s.msg("API","DB","INSERT INTO ChargingSession (userId, slotId, reservationId, startTime=now, status='ACTIVE')")
    s.msg("API","DB","UPDATE Slot SET status='OCCUPIED'")
    s.msg("DB","API","Hoan tat",True)
    s.msg("API","Push","Gui thong bao \"Phien sac bat dau\"")
    s.msg("Push","C","Hien thi thong bao tren trinh duyet",True)
    s.msg("API","UI","200 OK {reservation:CONFIRMED, session:ACTIVE}",True)
    s.msg("UI","C","Hien thi man hinh theo doi phien sac",True)
    return s.p

def build_seq_cron():
    s = SeqBuilder("22-Sequence-Cron-HuyDatCho")
    s.add_participant("Cron","Bo dinh thoi (1 phut)"); s.add_participant("API","API Route")
    s.add_participant("DB","Database"); s.add_participant("Notify","Dich vu thong bao day")
    s.note_wide("Kich hoat tu dong moi 60 giay")
    s.msg("Cron","API","GET /api/cron/expire-reservations")
    s.self_msg("API","cutoff = now() - 15 phut")
    s.msg("API","DB","SELECT * FROM Reservation WHERE status='PENDING' AND startTime <= cutoff")
    s.frame_start("[Khong co dat cho qua han]","alt")
    s.msg("DB","API","Khong co ket qua",True)
    s.msg("API","Cron","200 OK {cancelled:0, checkedAt}",True)
    s.frame_sep()
    s.msg("DB","API","Danh sach dat cho qua han",True)
    s.note_wide("[loop] Moi dat cho qua han")
    s.msg("API","DB","BEGIN TRANSACTION")
    s.msg("API","DB","UPDATE Reservation SET status='CANCELLED'")
    s.msg("API","DB","INSERT INTO Notification (userId, 'Lich dat bi huy', WARNING)")
    s.msg("API","DB","COMMIT")
    s.msg("DB","API","Da huy + tao thong bao",True)
    s.msg("API","Notify","Gui thong bao day (Web Push)")
    s.self_msg("Notify","webpush.sendNotification(...)")
    s.msg("API","Cron","200 OK {cancelled:N, checkedAt}",True)
    return s.p

def build_seq_stop():
    s = SeqBuilder("23-Sequence-KetThucSac")
    s.add_actor("C","Khach hang"); s.add_participant("UI","Giao dien phien sac")
    s.add_participant("API","API Route"); s.add_participant("DB","Database")
    s.add_participant("Notify","Dich vu thong bao")
    s.msg("C","UI","Nhan \"Ket thuc sac\"")
    s.msg("UI","API","POST /api/sessions/{id}/stop")
    s.msg("API","DB","SELECT session, slot, user, fleet JOIN ... WHERE session.id=?")
    s.msg("DB","API","session (ACTIVE) + slot.powerKw + user.fleet",True)
    s.note_wide("=== TINH TOAN ===")
    s.self_msg("API","endTime=now(); durationHours=(end-start)/3600000; energyKwh = hours x powerKw x 0.9")
    s.msg("API","DB","SELECT * FROM Tariff WHERE active=1 AND startHour<=h<endHour ORDER BY isPeak DESC")
    s.msg("DB","API","bieu gia {ratePerKwh, isPeak}",True)
    s.self_msg("API","subtotal = energyKwh x ratePerKwh")
    s.note_wide("[opt] La Tai xe doi xe: fleetDiscount = subtotal x fleet.discountRate/100")
    s.self_msg("API","pointsEarned = floor(amount/10000); newTier = tinh hang")
    s.note_wide("=== TRANSACTION (atomic) ===")
    s.msg("API","DB","BEGIN TRANSACTION")
    s.msg("API","DB","UPDATE ChargingSession SET status='COMPLETED', endTime, energyKwh")
    s.msg("API","DB","UPDATE Slot SET status='AVAILABLE'")
    s.msg("API","DB","INSERT INTO Invoice (sessionId, userId, energyKwh, subtotal, discount, amount, pointsEarned)")
    s.msg("API","DB","UPDATE User SET loyaltyPoints+=pointsEarned, loyaltyTier=newTier")
    s.msg("API","DB","INSERT INTO LoyaltyTransaction (EARN, points, balance)")
    s.msg("API","DB","COMMIT")
    s.msg("DB","API","Giao dich thanh cong",True)
    s.msg("API","Notify","Gui thong bao + kWh, so tien, diem thuong")
    s.msg("Notify","C","Hien thi thong bao",True)
    s.msg("API","UI","200 OK {session, invoice, pointsEarned, fleetDiscount}",True)
    s.msg("UI","C","Hien thi ket qua va hoa don",True)
    return s.p

def build_seq_pay():
    s = SeqBuilder("24-Sequence-ThanhToanHoaDon")
    s.add_actor("C","Khach hang"); s.add_participant("UI","Giao dien hoa don")
    s.add_participant("API","API Route"); s.add_participant("VLib","Kiem tra voucher")
    s.add_participant("DB","Database")
    s.msg("C","UI","Mo hoa don can thanh toan")
    s.msg("UI","API","GET /api/invoices/{id}")
    s.msg("API","DB","SELECT * FROM Invoice WHERE id=?")
    s.msg("DB","API","hoa don (UNPAID, amount=85.000d)",True)
    s.msg("API","UI","Hien thi chi tiet hoa don",True)
    s.note_wide("[opt] Nguoi dung nhap ma giam gia \"WELCOME50\"")
    s.msg("C","UI","Nhap ma \"WELCOME50\"")
    s.msg("UI","API","POST /api/invoices/{id}/pay {method:\"wallet\", voucherCode:\"WELCOME50\"}")
    s.msg("API","VLib","validateAndCalculate(\"WELCOME50\", userId, 85000)")
    s.msg("VLib","DB","SELECT * FROM Voucher WHERE code='WELCOME50'")
    s.msg("DB","VLib","voucher {type:PERCENT, value:50, maxDiscount:50000}",True)
    s.self_msg("VLib","Kiem tra: active? con han? usageLimit? perUserLimit? minAmount?")
    s.frame_start("[Ma khong hop le]","alt")
    s.msg("VLib","API","{valid:false, error:\"...\"}",True)
    s.msg("API","UI","400 Ma khong hop le",True)
    s.msg("UI","C","Hien thi loi",True)
    s.frame_sep()
    s.self_msg("VLib","discount = min(85000x50%, 50000) = 42.500d")
    s.msg("VLib","API","{valid:true, discount:42500, voucher}",True)
    s.self_msg("API","finalAmount = 85000 - 42500 = 42.500d")
    s.gap(10)
    s.msg("C","UI","Chon thanh toan bang vi")
    s.msg("UI","API","POST /api/invoices/{id}/pay {method:\"wallet\"}")
    s.msg("API","DB","SELECT * FROM Wallet WHERE userId=?")
    s.msg("DB","API","wallet {balance:100.000d}",True)
    s.frame_start("[So du khong du]","alt")
    s.msg("API","UI","400 \"So du vi khong du de thanh toan\"",True)
    s.msg("UI","C","Hien thi thong bao, de xuat nap them tien",True)
    s.frame_sep()
    s.note_wide("TRANSACTION")
    s.msg("API","DB","BEGIN TRANSACTION")
    s.msg("API","DB","UPDATE Wallet SET balance=100000-42500")
    s.msg("API","DB","INSERT INTO WalletTransaction (PAYMENT, -42500)")
    s.msg("API","DB","UPDATE Invoice SET status='PAID', paymentMethod='WALLET', discount=42500")
    s.msg("API","DB","UPDATE Voucher SET usedCount+=1")
    s.msg("API","DB","INSERT INTO VoucherUsage")
    s.msg("API","DB","COMMIT")
    s.msg("DB","API","Giao dich thanh cong",True)
    s.msg("API","UI","200 OK {success, finalAmount:42500, discount:42500}",True)
    s.msg("UI","C","Hien thi \"Thanh toan thanh cong\"",True)
    return s.p

def build_seq_vnpay():
    s = SeqBuilder("25-Sequence-NapTien-VNPay")
    s.add_actor("C","Khach hang"); s.add_participant("UI","Giao dien vi")
    s.add_participant("API","API Route"); s.add_participant("VNPay","VNPay Sandbox")
    s.add_participant("DB","Database")
    s.msg("C","UI","Chon \"Nap tien\", nhap so tien 100.000d")
    s.msg("UI","API","POST /api/payments/vnpay/create {amount:100000}")
    s.self_msg("API","txnRef = \"EV\"+timestamp+random; lay IP tu x-forwarded-for")
    s.msg("API","DB","INSERT INTO Payment (userId, txnRef, amount, status='PENDING', provider='VNPAY')")
    s.msg("DB","API","Tao payment thanh cong",True)
    s.self_msg("API","Xay dung URL VNPay: sap xep tham so + ky HMAC-SHA512")
    s.msg("API","UI","200 OK {paymentUrl}",True)
    s.msg("UI","VNPay","Chuyen huong den VNPay Sandbox")
    s.note_wide("NGUOI DUNG THANH TOAN TAI VNPAY SANDBOX")
    s.msg("C","VNPay","Chon ngan hang, nhap thong tin the, xac nhan")
    s.self_msg("VNPay","Xu ly thanh toan (sandbox)")
    s.msg("VNPay","API","GET /api/payments/vnpay/return?vnp_Amount=...&vnp_ResponseCode=00&vnp_SecureHash=...",True)
    s.note_wide("XU LY PHAN HOI")
    s.self_msg("API","verifyVNPayReturn: tach SecureHash -> sap xep params -> HMAC-SHA512 -> so sanh")
    s.frame_start("[Chu ky khong hop le]","alt")
    s.msg("API","UI","Redirect /wallet?status=invalid",True)
    s.msg("UI","C","Hien thi \"Giao dich khong hop le\"",True)
    s.frame_sep()
    s.msg("API","DB","SELECT * FROM Payment WHERE txnRef=?")
    s.msg("DB","API","payment {PENDING}",True)
    s.frame_start("[Ma phan hoi = \"00\" (Thanh cong)]","alt")
    s.msg("API","DB","BEGIN TRANSACTION")
    s.msg("API","DB","UPDATE Payment SET status='SUCCESS', responseCode, bankCode, paidAt")
    s.msg("API","DB","INSERT OR UPDATE Wallet SET balance+=100000")
    s.msg("API","DB","INSERT INTO WalletTransaction (TOPUP, +100000)")
    s.msg("API","DB","INSERT INTO Notification (\"Nap tien thanh cong\")")
    s.msg("API","DB","COMMIT")
    s.msg("DB","API","Giao dich thanh cong",True)
    s.msg("API","UI","Redirect /wallet?status=success&amount=100000",True)
    s.msg("UI","C","Hien thi \"Nap tien thanh cong\"",True)
    s.frame_sep()
    s.msg("API","DB","UPDATE Payment SET status='FAILED', responseCode")
    s.msg("DB","API","Da cap nhat",True)
    s.msg("API","UI","Redirect /wallet?status=failed",True)
    s.msg("UI","C","Hien thi \"Thanh toan that bai\"",True)
    return s.p

def build_seq_maintenance():
    s = SeqBuilder("26-Sequence-BaoTri")
    s.add_actor("Admin","Quan tri vien"); s.add_actor("Tech","Ky thuat vien")
    s.add_participant("UI","Giao dien quan tri"); s.add_participant("API","API Route")
    s.add_participant("DB","Database"); s.add_participant("Notify","Dich vu thong bao")
    s.note_wide("=== QUAN TRI VIEN TAO PHIEU BAO TRI ===")
    s.msg("Admin","UI","Nhap: tram, tru, tieu de, mo ta, muc uu tien, ky thuat vien")
    s.msg("UI","API","POST /api/maintenance {stationId, slotId?, title, description, priority, assignedToId?}")
    s.msg("API","DB","INSERT INTO MaintenanceTicket (stationId, title, priority, status='OPEN', createdById, assignedToId)")
    s.msg("DB","API","Tao phieu bao tri thanh cong",True)
    s.note_wide("[opt] Co phan cong ky thuat vien")
    s.msg("API","Notify","Gui thong bao \"Phieu bao tri moi\"")
    s.msg("Notify","Tech","Hien thi thong bao",True)
    s.msg("API","UI","201 Created {ticket}",True)
    s.msg("UI","Admin","Hien thi phieu bao tri da tao",True)
    s.note_wide("=== KY THUAT VIEN XU LY ===")
    s.msg("Tech","UI","Mo danh sach phieu duoc phan cong")
    s.msg("UI","API","GET /api/maintenance")
    s.msg("API","DB","SELECT * FROM MaintenanceTicket WHERE assignedToId=?")
    s.msg("DB","API","Danh sach phieu",True)
    s.note_wide("[loop] Voi moi phieu can xu ly")
    s.msg("API","UI","Tra ve danh sach",True)
    s.msg("UI","Tech","Hien thi danh sach",True)
    s.msg("Tech","UI","Chon phieu -> \"Bat dau sua\"")
    s.msg("UI","API","PATCH /api/maintenance/{id} {status:\"IN_PROGRESS\"}")
    s.msg("API","DB","UPDATE MaintenanceTicket SET status='IN_PROGRESS'")
    s.msg("API","DB","UPDATE Slot SET status='MAINTENANCE' (neu co)")
    s.msg("DB","API","Cap nhat thanh cong",True)
    s.msg("Tech","UI","Sau khi sua xong, nhap ghi chu")
    s.msg("UI","API","PATCH /api/maintenance/{id} {status:\"RESOLVED\", note:\"...\"}")
    s.msg("API","DB","UPDATE MaintenanceTicket SET status='RESOLVED'")
    s.msg("DB","API","Cap nhat thanh cong",True)
    s.msg("API","Notify","Gui thong bao \"Phieu bao tri da xu ly\"")
    s.msg("Notify","Admin","Hien thi thong bao",True)
    s.note_wide("=== QUAN TRI VIEN DONG PHIEU ===")
    s.msg("Admin","UI","Kiem tra phieu da RESOLVED -> \"Dong phieu\"")
    s.msg("UI","API","PATCH /api/maintenance/{id} {status:\"CLOSED\"}")
    s.msg("API","DB","UPDATE MaintenanceTicket SET status='CLOSED', resolvedAt=now")
    s.msg("API","DB","UPDATE Slot SET status='AVAILABLE' (neu co)")
    s.msg("DB","API","Dong phieu thanh cong",True)
    s.msg("API","Notify","Gui thong bao \"Phieu bao tri da dong\"")
    s.msg("Notify","Tech","Hien thi thong bao",True)
    s.msg("API","UI","200 OK {ticket}",True)
    s.msg("UI","Admin","Hien thi phieu da dong",True)
    return s.p

def build_all_seq():
    save("17-Sequence-DangKy.drawio", build_seq_register())
    save("18-Sequence-DangNhap.drawio", build_seq_login())
    save("19-Sequence-TimTramGanDay.drawio", build_seq_search())
    save("20-Sequence-DatCho.drawio", build_seq_reservation())
    save("21-Sequence-CheckIn.drawio", build_seq_checkin())
    save("22-Sequence-Cron-HuyDatCho.drawio", build_seq_cron())
    save("23-Sequence-KetThucSac.drawio", build_seq_stop())
    save("24-Sequence-ThanhToanHoaDon.drawio", build_seq_pay())
    save("25-Sequence-NapTien-VNPay.drawio", build_seq_vnpay())
    save("26-Sequence-BaoTri.drawio", build_seq_maintenance())

if __name__ == "__main__":
    build_all_seq()
    print("=== DONE SEQUENCE ===")
