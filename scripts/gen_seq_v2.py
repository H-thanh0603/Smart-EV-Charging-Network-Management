# -*- coding: utf-8 -*-
"""Sequence Diagrams V2 - Co Activation Bar + Combined Fragment (alt/opt/loop)."""
import os, html, xml.etree.ElementTree as ET

OUT = os.path.join(os.path.dirname(__file__), "..", "Diagrams")
os.makedirs(OUT, exist_ok=True)
def esc(s): return html.escape(str(s), quote=True)
_uid = [0]
def nid(p="n"): _uid[0]+=1; return f"{p}{_uid[0]}"

S_ACTOR_S = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=none;strokeColor=#000000;fontSize=11;"
S_LIFELINE = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=0;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=none;strokeColor=#000000;fontSize=10;size=10;"
S_RECT_S = "rounded=1;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;fontSize=10;"
S_MSG = "html=1;verticalAlign=bottom;endArrow=block;strokeColor=#000000;fontSize=9;"
S_REPLY = "html=1;verticalAlign=bottom;endArrow=open;dashed=1;strokeColor=#000000;fontSize=9;"
S_SELF = "html=1;verticalAlign=bottom;endArrow=block;strokeColor=#000000;fontSize=9;"
S_FRAME = "shape=umlFrame;whiteSpace=wrap;html=1;width=80;height=24;fillColor=none;strokeColor=#000000;fontSize=9;fontStyle=1;"
S_ACTBAR = "rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;"
S_NOTE_S = "shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;darkOpacity=0.05;fillColor=none;strokeColor=#000000;fontSize=8;align=left;"

class Page:
    def __init__(self, name, w=1800, h=1200):
        self.name=name; self.cells=[]; self.w=w; self.h=h
    def vertex(self, vid, val, style, x, y, w, h, parent="1"):
        self.cells.append(f'<mxCell id="{vid}" value="{esc(val)}" style="{style}" vertex="1" parent="{parent}"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')
        return vid
    def edge(self, eid, val, style, src, tgt, pts=None):
        geo = '<mxGeometry relative="1" as="geometry">'
        if pts: geo += '<Array as="points">'+''.join(f'<mxPoint x="{px}" y="{py}"/>' for px,py in pts)+'</Array>'
        geo += '</mxGeometry>'
        self.cells.append(f'<mxCell id="{eid}" value="{esc(val)}" style="{style}" edge="1" parent="1" source="{src}" target="{tgt}">{geo}</mxCell>')
        return eid
    def edge_free(self, eid, val, style, sx, sy, tx, ty, pts=None):
        geo = '<mxGeometry relative="1" as="geometry">'
        geo += f'<mxPoint x="{sx}" y="{sy}" as="sourcePoint"/>'
        geo += f'<mxPoint x="{tx}" y="{ty}" as="targetPoint"/>'
        if pts: geo += '<Array as="points">'+''.join(f'<mxPoint x="{px}" y="{py}"/>' for px,py in pts)+'</Array>'
        geo += '</mxGeometry>'
        self.cells.append(f'<mxCell id="{eid}" value="{esc(val)}" style="{style}" edge="1" parent="1">{geo}</mxCell>')
        return eid
    def toxml(self):
        body="".join(self.cells)
        return f'<diagram id="{esc(self.name)}" name="{esc(self.name)}"><mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{self.w}" pageHeight="{self.h}" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>{body}</root></mxGraphModel></diagram>'

def save(fname, page):
    xml = f'<mxfile host="app.diagrams.net" type="device">{page.toxml()}</mxfile>'
    path = os.path.join(OUT, fname)
    with open(path,"w",encoding="utf-8") as f: f.write(xml)
    ET.fromstring(xml)
    print(f"  {fname}")

class SeqBuilder:
    def __init__(self, title):
        self.p = Page(title, w=1600, h=1400)
        self.lifelines = {}
        self.lx = 60
        self.lw = 140
        self.y = 80
        self.step = 36
        self.lifeline_h = 1000

    def actor(self, name, label):
        x = self.lx; self.lx += self.lw
        # Actor head
        aid = self.p.vertex(nid("a"), label, S_ACTOR_S, x, 60, 40, 70)
        # Lifeline
        lid = self.p.vertex(nid("l"), "", S_LIFELINE, x+15, 140, 10, self.lifeline_h)
        self.lifelines[name] = (x+20, aid, lid)
        return name

    def participant(self, name, label):
        x = self.lx; self.lx += self.lw
        rid = self.p.vertex(nid("p"), label, S_RECT_S, x, 50, 100, 30)
        lid = self.p.vertex(nid("l"), "", S_LIFELINE, x+45, 90, 10, self.lifeline_h)
        self.lifelines[name] = (x+50, rid, lid)
        return name

    def msg(self, src, dst, label, reply=False):
        sx, _, sl = self.lifelines[src]
        dx, _, dl = self.lifelines[dst]
        st = S_REPLY if reply else S_MSG
        self.p.edge(nid("m"), label, st, sl, dl)
        self.y += self.step

    def self_msg(self, who, label):
        x, _, lid = self.lifelines[who]
        # Mini loop on self
        pts = [(x+80, self.y+8), (x+160, self.y+8), (x+160, self.y+28), (x+80, self.y+28)]
        self.p.edge(nid("m"), label, S_SELF, lid, lid, pts)
        self.y += self.step

    def note(self, label, x=50):
        self.p.vertex(nid("n"), label, S_NOTE_S, x, self.y, 300, 30)
        self.y += 40

    def note_wide(self, label):
        self.p.vertex(nid("n"), label, S_NOTE_S, 30, self.y, 1200, 26)
        self.y += 35

    def frame_alt(self, label):
        """Ve combined fragment alt."""
        self.p.vertex(nid("f"), f"alt  [{label}]", S_FRAME, 40, self.y-8, 1300, 50)
        self._frame_y = self.y
        self.y += 12

    def frame_else(self):
        """Separator trong alt."""
        self.p.vertex(nid("s"), "", "line;strokeWidth=1;fillColor=none;strokeColor=#000000;dashed=1;", 40, self.y, 1300, 1)
        self.y += 16
        # Update frame height
        pass

    def frame_opt(self, label):
        self.p.vertex(nid("f"), f"opt  [{label}]", S_FRAME, 40, self.y-8, 1300, 40)
        self._frame_y = self.y
        self.y += 12

    def frame_loop(self, label):
        self.p.vertex(nid("f"), f"loop  [{label}]", S_FRAME, 40, self.y-8, 1300, 40)
        self._frame_y = self.y
        self.y += 12

    def frame_end(self):
        h = self.y - self._frame_y + 16
        # Update last frame's height (can't easily update, note for drawio)

    def gap(self, px=20):
        self.y += px

def seq_register():
    s = SeqBuilder("17-Sequence-DangKy")
    s.actor("G","Khach vang lai"); s.participant("UI","Giao dien DK"); s.participant("API","API Route"); s.participant("DB","Database")
    s.msg("G","UI","Nhap email, mat khau, ho ten, SDT")
    s.msg("UI","API","POST /api/auth/register {email, password, name, phone}")
    s.msg("API","DB","prisma.user.findUnique({where:{email}})")
    s.frame_alt("email da ton tai")
    s.msg("DB","API","user found",True)
    s.msg("API","UI","400 {error:\"Email da ton tai\"}",True)
    s.msg("UI","G","Hien thi thong bao loi",True)
    s.frame_else()
    s.msg("DB","API","null",True)
    s.self_msg("API","bcrypt.hash(password, 10)")
    s.msg("API","DB","prisma.user.create({email, password:hashed, name, phone, role:\"CUSTOMER\"})")
    s.msg("DB","API","user {id, email, name}",True)
    s.msg("API","UI","201 Created",True)
    s.msg("UI","G","Chuyen huong trang dang nhap",True)
    return s.p

def seq_login():
    s = SeqBuilder("18-Sequence-DangNhap")
    s.actor("G","Khach vang lai"); s.participant("UI","Giao dien DN"); s.participant("API","API Route"); s.participant("DB","Database")
    s.msg("G","UI","Nhap email va mat khau")
    s.msg("UI","API","POST /api/auth/login {email, password}")
    s.msg("API","DB","prisma.user.findUnique({where:{email}})")
    s.frame_alt("user === null")
    s.msg("DB","API","null",True)
    s.msg("API","UI","401 \"Sai email hoac mat khau\"",True)
    s.msg("UI","G","Hien thi thong bao loi",True)
    s.frame_else()
    s.msg("DB","API","user {id, email, password_hash, role}",True)
    s.self_msg("API","bcrypt.compare(password, user.password)")
    s.frame_alt("!valid (sai mat khau)")
    s.msg("API","UI","401 \"Sai email hoac mat khau\"",True)
    s.msg("UI","G","Hien thi thong bao loi",True)
    s.frame_else()
    s.self_msg("API","jwt.sign({id,email,role}, SECRET, {expiresIn:\"7d\"})")
    s.msg("API","UI","200 + Set-Cookie: ev_token=JWT",True)
    s.msg("UI","G","Chuyen huong ve trang chu",True)
    return s.p

def seq_search():
    s = SeqBuilder("19-Sequence-TimTramGanDay")
    s.actor("C","Khach hang"); s.participant("UI","Giao dien ban do"); s.participant("API","API Route"); s.participant("DB","Database")
    s.msg("C","UI","Mo ban do, getCurrentPosition()")
    s.msg("UI","API","GET /api/stations/near?lat=10.77&lng=106.70&radius=10")
    s.msg("API","DB","prisma.station.findMany({where:{status:\"ACTIVE\"}, include:{slots:true}})")
    s.msg("DB","API","stations[] (16 tram)",True)
    s.self_msg("API","haversine(lat,lng,s.lat,s.lng): R=6371, atan2")
    s.self_msg("API",".filter(d<=radius).sort(d).slice(0,limit)")
    s.msg("API","UI","200 [{id,name,distance,slots}]",True)
    s.msg("UI","C","L.marker() Leaflet: xanh=trong, do=het, vang=dang sac",True)
    return s.p

def seq_reservation():
    s = SeqBuilder("20-Sequence-DatCho")
    s.actor("C","Khach hang"); s.participant("UI","Giao dien dat cho"); s.participant("API","API Route"); s.participant("DB","Database")
    s.msg("C","UI","Chon tru + datetime (startTime, endTime)")
    s.msg("UI","API","POST /api/reservations {slotId, startTime, endTime}")
    s.note_wide("Kiem tra trung: 3 dieu kien overlap (chong start, chong end, bao phu)")
    s.msg("API","DB","prisma.reservation.findFirst({where:{slotId, status:{in:[\"PENDING\",\"CONFIRMED\"]}, OR:[...]}})")
    s.frame_alt("conflict !== null (co trung)")
    s.msg("DB","API","reservation found",True)
    s.msg("API","UI","409 \"Slot da duoc dat trong khung gio nay\"",True)
    s.msg("UI","C","Toast warning + de xuat gio khac",True)
    s.frame_else()
    s.msg("DB","API","null",True)
    s.msg("API","DB","prisma.reservation.create({userId, slotId, startTime, endTime, status:\"PENDING\"})")
    s.msg("DB","API","reservation {id, status:\"PENDING\"}",True)
    s.msg("API","UI","200 OK",True)
    s.msg("UI","C","Toast success + redirect /reservations",True)
    return s.p

def seq_checkin():
    s = SeqBuilder("21-Sequence-CheckIn")
    s.actor("C","Khach hang"); s.participant("UI","Giao dien"); s.participant("API","API Route"); s.participant("DB","Database"); s.participant("Push","Web Push")
    s.msg("C","UI","Nhan Check-in hoac quet QR")
    s.msg("UI","API","POST /api/reservations/{id}/checkin")
    s.msg("API","DB","prisma.reservation.findUnique({where:{id}})")
    s.frame_alt("now > startTime + 15phut (qua han)")
    s.msg("DB","API","reservation {PENDING, startTime}",True)
    s.self_msg("API","deadline = startTime + 15*60*1000; now > deadline")
    s.msg("API","DB","prisma.reservation.update({status:\"CANCELLED\"})")
    s.msg("DB","API","updated",True)
    s.msg("API","UI","400 \"Qua 15 phut, dat cho da bi huy\"",True)
    s.msg("UI","C","Toast error",True)
    s.frame_else()
    s.msg("DB","API","reservation {PENDING, startTime}",True)
    s.self_msg("API","now <= deadline")
    s.msg("API","DB","update reservation -> CONFIRMED")
    s.msg("API","DB","create ChargingSession (ACTIVE)")
    s.msg("API","DB","update Slot -> OCCUPIED")
    s.msg("DB","API","hoan tat",True)
    s.msg("API","Push","notify + sendPush (web-push)")
    s.msg("Push","C","Browser notification",True)
    s.msg("API","UI","200 {reservation:CONFIRMED, session:ACTIVE}",True)
    s.msg("UI","C","Redirect /sessions/{id}",True)
    return s.p

def seq_cron():
    s = SeqBuilder("22-Sequence-Cron-HuyDatCho")
    s.participant("Cron","Bo dinh thoi"); s.participant("API","API Route"); s.participant("DB","Database"); s.participant("Notify","Web Push")
    s.note_wide("Kich hoat tu dong moi 60 giay")
    s.msg("Cron","API","GET /api/cron/expire-reservations")
    s.self_msg("API","cutoff = new Date(now - 15*60*1000)")
    s.msg("API","DB","prisma.reservation.findMany({where:{status:\"PENDING\", startTime:{lte:cutoff}}})")
    s.frame_alt("expired.length === 0")
    s.msg("DB","API","[]",True)
    s.msg("API","Cron","200 {cancelled:0, checkedAt}",True)
    s.frame_else()
    s.msg("DB","API","reservations[] (N dat cho qua han)",True)
    s.frame_loop("for each reservation in expired")
    s.msg("API","DB","prisma.$transaction(async tx => {")
    s.msg("API","DB","  tx.reservation.update({status:\"CANCELLED\"})")
    s.msg("API","DB","  tx.notification.create({WARNING})")
    s.msg("API","DB","})")
    s.msg("DB","API","committed",True)
    s.msg("API","Notify","sendPush(sub, {title,body})")
    s.self_msg("Notify","webpush.sendNotification(...)")
    s.msg("API","Cron","200 {cancelled:N, checkedAt}",True)
    return s.p

def seq_stop():
    s = SeqBuilder("23-Sequence-KetThucSac")
    s.actor("C","Khach hang"); s.participant("UI","Giao dien"); s.participant("API","API Route"); s.participant("DB","Database"); s.participant("Notify","Thong bao")
    s.msg("C","UI","Nhan \"Ket thuc sac\"")
    s.msg("UI","API","POST /api/sessions/{id}/stop")
    s.msg("API","DB","findUnique session + slot.station + user.fleet")
    s.msg("DB","API","session {ACTIVE, startTime, slot.powerKw, user.fleet}",True)
    s.note_wide("=== TINH TOAN ===")
    s.self_msg("API","endTime=now; durationHours=(end-start)/3600000")
    s.self_msg("API","energyKwh = hours * powerKw * 0.9")
    s.msg("API","DB","tariff.findFirst({startHour<=h<endHour, orderBy:{isPeak:\"desc\"}})")
    s.msg("DB","API","{ratePerKwh:3210}",True)
    s.self_msg("API","subtotal = energyKwh * ratePerKwh")
    s.frame_opt("user.fleet (Tai xe doi xe)")
    s.self_msg("API","fleetDiscount = subtotal * fleet.discountRate/100")
    s.self_msg("API","amount = subtotal - fleetDiscount")
    s.frame_end()
    s.self_msg("API","pointsEarned = floor(amount/10000)")
    s.note_wide("=== TRANSACTION (atomic) ===")
    s.msg("API","DB","prisma.$transaction(async tx => {")
    s.msg("API","DB","  update session COMPLETED + energyKwh")
    s.msg("API","DB","  update slot AVAILABLE")
    s.msg("API","DB","  create Invoice (UNPAID)")
    s.msg("API","DB","  update User loyaltyPoints + tier")
    s.msg("API","DB","  create LoyaltyTransaction (EARN)")
    s.msg("API","DB","})")
    s.msg("DB","API","committed + invoice",True)
    s.msg("API","Notify","notify + sendPush")
    s.msg("Notify","C","Browser notification",True)
    s.msg("API","UI","200 {session, invoice, pointsEarned}",True)
    s.msg("UI","C","Hien thi hoa don + kWh + tien",True)
    return s.p

def seq_pay():
    s = SeqBuilder("24-Sequence-ThanhToanHoaDon")
    s.actor("C","Khach hang"); s.participant("UI","Giao dien"); s.participant("API","API Route"); s.participant("VLib","Voucher Service"); s.participant("DB","Database")
    s.msg("C","UI","Mo hoa don UNPAID")
    s.msg("UI","API","GET /api/invoices/{id}")
    s.msg("API","DB","invoice.findUnique({where:{id}})")
    s.msg("DB","API","invoice {UNPAID, amount:85000}",True)
    s.msg("API","UI","200 invoice",True); s.msg("UI","C","Hien thi chi tiet",True)
    s.frame_opt("nhap ma giam gia \"WELCOME50\"")
    s.msg("C","UI","Nhap ma \"WELCOME50\"")
    s.msg("UI","API","POST pay {method:\"wallet\", voucherCode:\"WELCOME50\"}")
    s.msg("API","VLib","validateAndCalculate(\"WELCOME50\", userId, 85000)")
    s.msg("VLib","DB","voucher.findUnique({code:\"WELCOME50\"})")
    s.msg("DB","VLib","{type:PERCENT, value:50, maxDiscount:50000}",True)
    s.self_msg("VLib","Kiem tra: active? han? usageLimit? perUserLimit? minAmount?")
    s.frame_alt("khong hop le")
    s.msg("VLib","API","{valid:false, error}",True)
    s.msg("API","UI","400 error",True); s.msg("UI","C","Toast error",True)
    s.frame_else()
    s.self_msg("VLib","discount = min(85000*50%, 50000) = 42500")
    s.msg("VLib","API","{valid:true, discount:42500}",True)
    s.self_msg("API","finalAmount = 85000 - 42500 = 42500")
    s.frame_end()
    s.msg("C","UI","Chon thanh toan bang vi")
    s.msg("UI","API","POST pay {method:\"wallet\"}")
    s.msg("API","DB","wallet.findUnique({where:{userId}})")
    s.msg("DB","API","{balance:100000}",True)
    s.frame_alt("balance < finalAmount")
    s.msg("API","UI","400 \"So du vi khong du\"",True)
    s.msg("UI","C","Toast + de xuat nap tien",True)
    s.frame_else()
    s.note_wide("TRANSACTION")
    s.msg("API","DB","prisma.$transaction(async tx => {")
    s.msg("API","DB","  wallet.update({balance:57500})")
    s.msg("API","DB","  walletTransaction.create({PAYMENT, -42500})")
    s.msg("API","DB","  invoice.update({PAID, discount:42500})")
    s.msg("API","DB","  voucher.update({usedCount++})")
    s.msg("API","DB","  voucherUsage.create(...)")
    s.msg("API","DB","})")
    s.msg("DB","API","committed",True)
    s.msg("API","UI","200 {success, finalAmount:42500}",True)
    s.msg("UI","C","Toast \"Thanh toan thanh cong\"",True)
    return s.p

def seq_vnpay():
    s = SeqBuilder("25-Sequence-NapTien-VNPay")
    s.actor("C","Khach hang"); s.participant("UI","Giao dien"); s.participant("API","API Route"); s.participant("VNPay","VNPay Sandbox"); s.participant("DB","Database")
    s.msg("C","UI","Chon Nap tien, nhap 100.000d")
    s.msg("UI","API","POST create {amount:100000}")
    s.self_msg("API","txnRef = EV+timestamp+random; ipAddr")
    s.msg("API","DB","payment.create({PENDING, VNPAY})")
    s.msg("DB","API","created",True)
    s.self_msg("API","buildVNPayUrl: sort params + HMAC-SHA512")
    s.msg("API","UI","200 {paymentUrl}",True)
    s.msg("UI","VNPay","window.location.href = paymentUrl")
    s.note_wide("NGUOI DUNG THANH TOAN TAI VNPAY SANDBOX")
    s.msg("C","VNPay","Chon ngan hang, nhap the, OTP")
    s.self_msg("VNPay","Xu ly thanh toan")
    s.msg("VNPay","API","302 Redirect: ?vnp_ResponseCode=00&vnp_SecureHash=...",True)
    s.self_msg("API","verifyVNPayReturn: tach hash -> sort -> HMAC-SHA512 -> compare")
    s.frame_alt("expected !== vnp_SecureHash")
    s.msg("API","UI","302 /wallet?status=invalid",True); s.msg("UI","C","Giao dich khong hop le",True)
    s.frame_else()
    s.msg("API","DB","payment.findUnique({txnRef})")
    s.msg("DB","API","{PENDING}",True)
    s.frame_alt("responseCode === \"00\"")
    s.msg("API","DB","$transaction:")
    s.msg("API","DB","  payment.update({SUCCESS})")
    s.msg("API","DB","  wallet.upsert({balance+=100000})")
    s.msg("API","DB","  walletTransaction.create({TOPUP})")
    s.msg("API","DB","  notification.create")
    s.msg("DB","API","committed",True)
    s.msg("API","UI","302 /wallet?status=success",True); s.msg("UI","C","Nap tien thanh cong",True)
    s.frame_else()
    s.msg("API","DB","payment.update({FAILED})")
    s.msg("DB","API","updated",True)
    s.msg("API","UI","302 /wallet?status=failed",True); s.msg("UI","C","Thanh toan that bai",True)
    return s.p

def seq_maintenance():
    s = SeqBuilder("26-Sequence-BaoTri")
    s.actor("Ad","Quan tri vien"); s.actor("Te","Ky thuat vien"); s.participant("UI","Giao dien"); s.participant("API","API Route"); s.participant("DB","Database"); s.participant("Noti","Thong bao")
    s.note_wide("=== QUAN TRI VIEN TAO PHIEU ===")
    s.msg("Ad","UI","Nhap: tram, tru, tieu de, mo ta, uu tien, ky thuat vien")
    s.msg("UI","API","POST /api/maintenance {stationId, title, priority, assignedToId?}")
    s.msg("API","DB","maintenanceTicket.create({OPEN})")
    s.msg("DB","API","ticket {id}",True)
    s.frame_opt("co phan cong ky thuat vien")
    s.msg("API","Noti","notify(assignedToId, \"Phieu bao tri moi\")")
    s.msg("Noti","Te","Web Push notification",True)
    s.frame_end()
    s.msg("API","UI","201 Created",True); s.msg("UI","Ad","Hien thi phieu",True)
    s.note_wide("=== KY THUAT VIEN XU LY ===")
    s.msg("Te","UI","Mo danh sach phieu")
    s.msg("UI","API","GET /api/maintenance")
    s.msg("API","DB","findMany({where:{assignedToId}})")
    s.msg("DB","API","tickets[]",True)
    s.frame_loop("moi phieu")
    s.msg("UI","Te","Hien thi danh sach",True)
    s.msg("Te","UI","Chon phieu -> Bat dau sua")
    s.msg("UI","API","PATCH {status:\"IN_PROGRESS\"}")
    s.msg("API","DB","update + update slot MAINTENANCE")
    s.msg("DB","API","updated",True)
    s.msg("Te","UI","Nhap ghi chu -> Hoan thanh")
    s.msg("UI","API","PATCH {status:\"RESOLVED\", note:\"...\"}")
    s.msg("API","DB","update ticket RESOLVED")
    s.msg("DB","API","updated",True)
    s.msg("API","Noti","notify(createdById)")
    s.msg("Noti","Ad","Web Push",True)
    s.frame_end()
    s.note_wide("=== QUAN TRI VIEN DONG PHIEU ===")
    s.msg("Ad","UI","Kiem tra -> Dong phieu")
    s.msg("UI","API","PATCH {status:\"CLOSED\"}")
    s.msg("API","DB","update ticket CLOSED + slot AVAILABLE")
    s.msg("DB","API","updated",True)
    s.msg("API","Noti","notify(assignedToId)")
    s.msg("Noti","Te","Web Push",True)
    s.msg("API","UI","200 OK",True); s.msg("UI","Ad","Hien thi phieu CLOSED",True)
    return s.p

def build_all_seq():
    save("17-Sequence-DangKy.drawio", seq_register())
    save("18-Sequence-DangNhap.drawio", seq_login())
    save("19-Sequence-TimTramGanDay.drawio", seq_search())
    save("20-Sequence-DatCho.drawio", seq_reservation())
    save("21-Sequence-CheckIn.drawio", seq_checkin())
    save("22-Sequence-Cron-HuyDatCho.drawio", seq_cron())
    save("23-Sequence-KetThucSac.drawio", seq_stop())
    save("24-Sequence-ThanhToanHoaDon.drawio", seq_pay())
    save("25-Sequence-NapTien-VNPay.drawio", seq_vnpay())
    save("26-Sequence-BaoTri.drawio", seq_maintenance())

if __name__ == "__main__":
    build_all_seq()
    print("=== DONE SEQUENCE ===")
