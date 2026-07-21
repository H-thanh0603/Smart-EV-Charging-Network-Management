# -*- coding: utf-8 -*-
"""Generator UML Drawio - Chuan den-trang, khong mau sac."""
import os, html, xml.etree.ElementTree as ET

OUT = os.path.join(os.path.dirname(__file__), "..", "Diagrams")
os.makedirs(OUT, exist_ok=True)

def esc(s): return html.escape(str(s), quote=True)

# ─── STYLES (den-trang chuan UML) ───
S_ACTOR   = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=none;strokeColor=#000000;"
S_USECASE = "ellipse;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;"
S_BOUNDARY= "rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;fillColor=none;strokeColor=#000000;fontStyle=1;fontSize=14;align=center;"
S_PKG     = "rounded=1;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;fontStyle=1;fontSize=12;"
S_ASSOC   = "endArrow=none;html=1;strokeColor=#000000;"
S_INCLUDE = "endArrow=open;dashed=1;html=1;strokeColor=#000000;fontStyle=2;"
S_EXTEND  = "endArrow=open;dashed=1;html=1;strokeColor=#000000;fontStyle=2;"
S_GEN     = "endArrow=block;endFill=0;html=1;strokeColor=#000000;"
S_DEP     = "endArrow=open;dashed=1;html=1;strokeColor=#000000;fontStyle=2;"

# Activity
S_INITIAL = "ellipse;html=1;fillColor=#000000;strokeColor=#000000;"
S_FINAL_O = "ellipse;html=1;fillColor=none;strokeColor=#000000;strokeWidth=2;"
S_FINAL_I = "ellipse;html=1;fillColor=#000000;strokeColor=none;"
S_ACTION  = "rounded=1;whiteSpace=wrap;html=1;arcSize=40;fillColor=none;strokeColor=#000000;"
S_DECISION= "rhombus;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;"
S_BAR     = "rounded=0;html=1;fillColor=#000000;strokeColor=#000000;"
S_FLOW    = "endArrow=open;html=1;strokeColor=#000000;"
S_FLOW_L  = "endArrow=open;html=1;strokeColor=#000000;fontStyle=2;"

# Sequence
S_LIFELINE= "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=0;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=none;strokeColor=#000000;"
S_MSG     = "html=1;verticalAlign=bottom;endArrow=block;strokeColor=#000000;"
S_MSG_A   = "html=1;verticalAlign=bottom;endArrow=open;strokeColor=#000000;"
S_REPLY   = "html=1;verticalAlign=bottom;endArrow=open;dashed=1;strokeColor=#000000;"
S_SELF    = "html=1;verticalAlign=bottom;endArrow=block;strokeColor=#000000;"
S_FRAME   = "shape=umlFrame;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;"
S_ACTBAR  = "html=1;points=[];perimeter=orthogonalPerimeter;fillColor=none;strokeColor=#000000;"

# Class
S_CLASS   = "swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;fillColor=none;strokeColor=#000000;"
S_CLASS_C = "text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;"
S_CLASS_H = "text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;fontStyle=1;"
S_ASSO_C  = "endArrow=none;html=1;strokeColor=#000000;"
S_COMP_C  = "endArrow=block;endFill=1;html=1;strokeColor=#000000;"
S_AGGR_C  = "endArrow=diamond;endFill=1;html=1;strokeColor=#000000;"

_uid = 0
def nid(p="n"): global _uid; _uid+=1; return f"{p}{_uid}"

class Page:
    def __init__(self, name): self.name=name; self.cells=[]
    def vertex(self, vid, val, style, x, y, w, h, parent="1"):
        self.cells.append(f'<mxCell id="{vid}" value="{esc(val)}" style="{style}" vertex="1" parent="{parent}"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')
        return vid
    def edge(self, eid, val, style, src, tgt, pts=None):
        geo = '<mxGeometry relative="1" as="geometry">'
        if pts:
            geo += '<Array as="points">'
            for px,py in pts: geo += f'<mxPoint x="{px}" y="{py}"/>'
            geo += '</Array>'
        geo += '</mxGeometry>'
        self.cells.append(f'<mxCell id="{eid}" value="{esc(val)}" style="{style}" edge="1" parent="1" source="{src}" target="{tgt}">{geo}</mxCell>')
        return eid
    def toxml(self):
        body="".join(self.cells)
        return f'<diagram id="{esc(self.name)}" name="{esc(self.name)}"><mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1654" pageHeight="1169" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>{body}</root></mxGraphModel></diagram>'

def save(fname, page):
    xml = f'<mxfile host="app.diagrams.net" type="device">{page.toxml()}</mxfile>'
    path = os.path.join(OUT, fname)
    with open(path,"w",encoding="utf-8") as f: f.write(xml)
    ET.fromstring(xml)
    print(f"  {fname}")

# ═══════════════════════════════════════════
# USE CASE DIAGRAMS
# ═══════════════════════════════════════════

def uc_overview():
    p = Page("01-UseCase-TongQuat")
    actors = {
        "Guest": ("Khach vang lai", 40, 80), "Customer": ("Khach hang", 40, 250),
        "Driver": ("Tai xe doi xe", 40, 420), "Technician": ("Ky thuat vien", 1180, 120),
        "Admin": ("Quan tri vien", 1180, 310), "VNPay": ("Cong TT VNPay", 1180, 620),
        "Cron": ("Bo dinh thoi (Cron)", 1180, 790),
    }
    aid = {}
    for k,(l,x,y) in actors.items():
        aid[k] = p.vertex(nid("a"), l, S_ACTOR, x, y, 50, 90)
    # generalization
    p.edge(nid("g"), None, S_GEN, aid["Customer"], aid["Guest"])
    p.edge(nid("g"), None, S_GEN, aid["Driver"], aid["Customer"])

    p.vertex(nid("b"), "HE THONG QUAN LY TRAM SAC XE DIEN V-GREEN", S_BOUNDARY, 200, 40, 900, 800)

    pkgs = ["A. Tai khoan & Xac thuc","B. Tim kiem & Xem tram","C. Dat cho","D. Phien sac",
            "E. Hoa don & Thanh toan","F. Vi dien tu & VNPay","G. Khach hang than thiet",
            "H. Danh gia tram","I. Phuong tien","J. Thong bao","K. Bao tri","L. Quan tri"]
    pid = {}
    for i,lb in enumerate(pkgs):
        r,c = i//2, i%2
        pid[lb[0]] = p.vertex(nid("p"), lb, S_PKG, 250+c*380, 100+r*120, 340, 100)

    def ass(a,b): p.edge(nid("e"), None, S_ASSOC, aid[a], pid[b])
    for b in "AB": ass("Guest",b)
    for b in "ABCDEFGHIJ": ass("Customer",b)
    for b in "CDE": ass("Driver",b)
    ass("Technician","K"); ass("Technician","J")
    for b in "LBK": ass("Admin",b)
    p.edge(nid("d"), "redirect", S_DEP, pid["F"], aid["VNPay"])
    p.edge(nid("d"), "trigger", S_DEP, pid["C"], aid["Cron"])
    p.edge(nid("d"), "trigger", S_DEP, pid["J"], aid["Cron"])
    p.edge(nid("d"), "trigger", S_DEP, pid["K"], aid["Cron"])
    return p

def uc_package(title, actor_list, ucs, assocs, rels):
    """actor_list: [(key,label,is_secondary)], ucs: [(key,label,kind:uc|inc)], assocs: [(akey,ukey)], rels: [(src,dst,type)]"""
    p = Page(title)
    aid = {}
    left, right = [a for a in actor_list if not a[2]], [a for a in actor_list if a[2]]
    ay = 80
    for k,l,_ in left:
        aid[k] = p.vertex(nid("a"), l, S_ACTOR, 40, ay, 50, 90); ay += 170
    ay = 80
    for k,l,_ in right:
        aid[k] = p.vertex(nid("a"), l, S_ACTOR, 980, ay, 50, 90); ay += 170

    n = len(ucs); rows = (n+1)//2
    p.vertex(nid("b"), title.split(" ",1)[-1] if " " in title else title, S_BOUNDARY, 200, 40, 720, max(rows*110+60, 200))
    uid = {}
    uw, uh = 280, 60
    cx = [260, 260+uw+100]
    sy = 100
    for i,(k,lb,kd) in enumerate(ucs):
        r,c = i//2, i%2
        uid[k] = p.vertex(nid("u"), lb, S_USECASE, cx[c], sy+r*100, uw, uh)
    for ak,uk in assocs:
        if ak in aid and uk in uid: p.edge(nid("e"), None, S_ASSOC, aid[ak], uid[uk])
    for s,d,t in rels:
        if s in uid and d in uid:
            sty = S_INCLUDE if t=="include" else S_EXTEND if t=="extend" else S_GEN
            p.edge(nid("r"), f"<<{t}>>", sty, uid[s], uid[d])
    return p

def build_all_uc():
    save("01-UseCase-TongQuat.drawio", uc_overview())
    pkgs = [
        ("02-GoiA-TaiKhoan-XacThuc", "Goi A - Tai khoan & Xac thuc",
         [("Guest","Khach vang lai",0),("User","Nguoi dung da DN",0)],
         [("A1","Dang ky tai khoan","uc"),("A2","Dang nhap","uc"),("A3","Dang xuat","uc"),
          ("A4","Quen mat khau","uc"),("A5","Dat lai mat khau","uc"),("A6","Doi mat khau","uc"),
          ("A7","Xem ho so","uc"),("A8","Cap nhat ho so","uc"),("A41","Tao resetToken","inc"),("A51","Kiem tra han token","inc")],
         [("Guest","A1"),("Guest","A2"),("Guest","A4"),("Guest","A5"),("User","A3"),("User","A6"),("User","A7"),("User","A8")],
         [("A4","A41","include"),("A5","A51","include")]),
        ("03-GoiB-TimKiem-XemTram", "Goi B - Tim kiem & Xem tram sac",
         [("Guest","Khach vang lai",0),("Customer","Khach hang",0)],
         [("B1","Xem danh sach tram","uc"),("B2","Xem ban do tram","uc"),("B3","Tim tram gan day","uc"),
          ("B4","Goi y tram","uc"),("B5","Xem chi tiet tram","uc"),("B6","Xem danh sach tru","uc"),
          ("B7","Trang thai tru live","uc"),("B8","Loc connector/cong suat","uc"),("B9","Quet QR tru sac","uc")],
         [("Guest","B1"),("Guest","B2"),("Guest","B5"),("Customer","B3"),("Customer","B4"),("Customer","B6"),("Customer","B7"),("Customer","B8"),("Customer","B9")],
         [("B1","B8","extend"),("B5","B6","include")]),
        ("04-GoiC-DatCho", "Goi C - Dat cho",
         [("Customer","Khach hang / Tai xe",0),("Admin","Quan tri vien",0),("Cron","Bo dinh thoi",1)],
         [("C1","Dat cho 1 lan","uc"),("C2","Dat cho lap lai","uc"),("C3","Xem danh sach dat cho","uc"),
          ("C4","Xem chi tiet dat cho","uc"),("C5","Huy dat cho","uc"),("C6","Check-in tai tram","uc"),
          ("C7","Tu dong huy qua han 15p","uc"),("C8","Nhac lich sac","uc"),("C9","Kiem tra trung khung gio","inc")],
         [("Customer","C1"),("Customer","C2"),("Customer","C3"),("Customer","C4"),("Customer","C5"),("Customer","C6"),("Admin","C3"),("Cron","C7"),("Cron","C8")],
         [("C1","C9","include")]),
        ("05-GoiD-PhienSac", "Goi D - Phien sac",
         [("Customer","Khach hang / Tai xe",0)],
         [("D1","Bat dau phien sac","uc"),("D2","Xem phien dang sac","uc"),("D3","Ket thuc phien (stop)","uc"),
          ("D4","Ket thuc phien (end)","uc"),("D5","Xem lich su phien","uc"),("D6","Xem thong ke phien","uc"),
          ("D7","Tinh dien nang & cuoc","inc"),("D8","Lap hoa don tu dong","inc"),("D9","Ap chiet khau fleet","inc"),("D10","Cong diem thuong","inc")],
         [("Customer","D1"),("Customer","D2"),("Customer","D3"),("Customer","D4"),("Customer","D5"),("Customer","D6")],
         [("D3","D7","include"),("D3","D8","include"),("D3","D9","include"),("D3","D10","include"),("D4","D7","include"),("D4","D8","include")]),
        ("06-GoiE-HoaDon-ThanhToan", "Goi E - Hoa don & Thanh toan",
         [("Customer","Khach hang / Tai xe",0)],
         [("E1","Xem danh sach hoa don","uc"),("E2","Xem chi tiet hoa don","uc"),("E3","Thanh toan bang vi","uc"),
          ("E4","Ap dung voucher","inc"),("E5","Kiem tra hop le voucher","inc"),("E6","Tai hoa don PDF","uc")],
         [("Customer","E1"),("Customer","E2"),("Customer","E3"),("Customer","E6")],
         [("E3","E4","extend"),("E4","E5","include")]),
        ("07-GoiF-ViDienTu-VNPay", "Goi F - Vi dien tu & VNPay",
         [("Customer","Khach hang / Tai xe",0),("VNPay","Cong VNPay",1)],
         [("F1","Xem so du & lich su vi","uc"),("F2","Nap tien thu cong (demo)","uc"),("F3","Tao giao dich nap VNPay","uc"),
          ("F4","Xu ly Return URL","uc"),("F5","Xu ly IPN (server-server)","uc"),("F6","Cong tien vao vi","inc"),("F7","Doi soat chu ky & so tien","inc")],
         [("Customer","F1"),("Customer","F2"),("Customer","F3"),("VNPay","F4"),("VNPay","F5")],
         [("F4","F7","include"),("F5","F7","include"),("F4","F6","include"),("F5","F6","include")]),
        ("08-GoiG-KhachHangThanThiet", "Goi G - Khach hang than thiet",
         [("Customer","Khach hang / Tai xe",0),("Admin","Quan tri vien",0)],
         [("G1","Xem diem & hang thanh vien","uc"),("G2","Tich diem khi thanh toan","uc"),("G3","Doi diem lay tien vao vi","uc"),
          ("G4","Xem lich su diem","uc"),("G5","Tu dong nang/giu hang","inc"),("G6","Admin xem/dieu chinh diem","uc")],
         [("Customer","G1"),("Customer","G3"),("Customer","G4"),("Admin","G6")],
         [("G2","G5","include")]),
        ("09-GoiH-DanhGiaTram", "Goi H - Danh gia tram",
         [("Customer","Khach hang",0),("Admin","Quan tri vien",0)],
         [("H1","Xem danh gia cua tram","uc"),("H2","Gui/sua danh gia (1-5 sao)","uc"),
          ("H3","Kiem tra da tung sac","inc"),("H4","Cap nhat rating trung binh","inc"),("H5","Admin duyet/xoa danh gia","uc")],
         [("Customer","H1"),("Customer","H2"),("Admin","H5")],
         [("H2","H3","include"),("H2","H4","include")]),
        ("10-GoiI-PhuongTien", "Goi I - Phuong tien",
         [("Customer","Khach hang / Tai xe",0)],
         [("I1","Xem danh sach xe","uc"),("I2","Them xe","uc"),("I3","Sua thong tin xe","uc"),("I4","Xoa/ngung xe","uc")],
         [("Customer","I1"),("Customer","I2"),("Customer","I3"),("Customer","I4")], []),
        ("11-GoiK-BaoTri", "Goi K - Bao tri",
         [("Admin","Quan tri vien",0),("Tech","Ky thuat vien",0),("Cron","Bo dinh thoi",1)],
         [("K1","Tao phieu bao tri","uc"),("K2","Phan cong ky thuat vien","uc"),("K3","Xem tat ca phieu","uc"),
          ("K4","Xem phieu duoc phan cong","uc"),("K5","Cap nhat tien do","uc"),("K6","Dong phieu","uc")],
         [("Admin","K1"),("Admin","K2"),("Admin","K3"),("Admin","K6"),("Tech","K4"),("Tech","K5")],
         [("K1","K2","extend")]),
        ("12-GoiL-QuanTri", "Goi L - Quan tri",
         [("Admin","Quan tri vien",0)],
         [("L1","Dashboard thong ke","uc"),("L2","Quan ly tram & tru","uc"),("L3","Quan ly nguoi dung","uc"),
          ("L4","Quan ly bieu gia dien","uc"),("L5","Quan ly doi xe (fleet)","uc"),("L6","Quan ly voucher","uc"),
          ("L7","Bao cao doanh thu","uc"),("L8","Quan ly webhooks","uc")],
         [("Admin","L1"),("Admin","L2"),("Admin","L3"),("Admin","L4"),("Admin","L5"),("Admin","L6"),("Admin","L7"),("Admin","L8")], []),
    ]
    for fn,title,actors,ucs,assocs,rels in pkgs:
        save(f"{fn}.drawio", uc_package(title, actors, ucs, assocs, rels))

# ═══════════════════════════════════════════
# ACTIVITY DIAGRAMS
# ═══════════════════════════════════════════

class ActBuilder:
    def __init__(self, title):
        self.p = Page(title)
        self.nodes = {}
        self.edges = []
        self._x = 400; self._y = 60
    def add(self, key, kind, label, x=None, y=None, w=None, h=None):
        if x is None: x = self._x; self._y += 80
        if y is None: y = self._y
        if kind=="initial": w,h=30,30
        elif kind=="final": w,h=34,34
        elif kind=="decision": w,h=w or 160,h or 70
        elif kind in ("fork","join"): w,h=w or 200,h or 12
        else: w,h=w or 240,h or 50
        self.nodes[key] = (kind,label,x,y,w,h)
        self._y = y + h + 60
    def link(self, s,d,label="",pts=None): self.edges.append((s,d,label,pts))
    def x(self): return self._x
    def render(self):
        idm={}
        for key,(kind,label,x,y,w,h) in self.nodes.items():
            cid=nid("a"); idm[key]=cid
            if kind=="initial": self.p.vertex(cid,"",S_INITIAL,x,y,w,h)
            elif kind=="final": self.p.vertex(cid,"",S_FINAL_O,x,y,w,h); self.p.vertex(cid+"i","",S_FINAL_I,x+7,y+7,w-14,h-14)
            elif kind=="decision": self.p.vertex(cid,label,S_DECISION,x,y,w,h)
            elif kind in ("fork","join"): self.p.vertex(cid,"",S_BAR,x,y,w,h)
            else: self.p.vertex(cid,label,S_ACTION,x,y,w,h)
        for s,d,lb,pts in self.edges:
            self.p.edge(nid("e"),lb,S_FLOW_L if lb else S_FLOW,idm[s],idm[d],pts)
        return self.p

def act_end_to_end():
    a = ActBuilder("13-Activity-DatCho-CheckIn-Sac-ThanhToan")
    a.add("s","initial",""); a.add("a1","action","Tim kiem tram sac"); a.add("a2","action","Chon tram va xem chi tiet")
    a.add("a3","action","Chon tru sac con trong"); a.add("d1","decision","Co trung khung gio?")
    a.add("e1","action","Nhan thong bao loi"); a.add("f1","final","")
    a.add("a4","action","Chon ngay va khung gio"); a.add("a5","action","Xac nhan dat cho")
    a.add("a6","action","Tao dat cho trang thai PENDING"); a.add("a7","action","Gui thong bao xac nhan")
    a.add("a8","action","Den tram trong vong 15 phut"); a.add("d2","decision","Check-in dung han?")
    a.add("a9","action","Bo dinh thoi tu dong huy dat cho"); a.add("e2","action","Gui thong bao huy"); a.add("f2","final","")
    a.add("a10","action","Quet ma QR hoac nhan nut Check-in"); a.add("a11","action","Cap nhat dat cho -> CONFIRMED")
    a.add("a12","action","Tao phien sac ACTIVE"); a.add("a13","action","Cap nhat tru -> OCCUPIED")
    a.add("a14","action","Theo doi phien sac"); a.add("a15","action","Mo phong sac (kW x thoi gian x 0.9)")
    a.add("a16","action","Ket thuc phien sac"); a.add("a17","action","Tinh dien nang tieu thu (kWh)")
    a.add("a18","action","Tra bieu gia theo khung gio"); a.add("a19","action","Tinh tien dien (kWh x don gia)")
    a.add("d3","decision","La Tai xe doi xe?")
    a.add("a20","action","Ap chiet khau doi xe"); a.add("j1","join","")
    a.add("a21","action","Tinh diem thuong"); a.add("a22","action","Tu dong lap hoa don (UNPAID)")
    a.add("a23","action","Cap nhat tru -> AVAILABLE"); a.add("a24","action","Gui thong bao ket qua")
    a.add("a25","action","Xem hoa don"); a.add("d4","decision","Co ma giam gia?")
    a.add("a26","action","Nhap ma giam gia"); a.add("a27","action","Kiem tra hop le ma giam gia")
    a.add("a28","action","Tinh so tien giam"); a.add("a29","action","Chon thanh toan bang vi")
    a.add("a30","action","Kiem tra so du vi"); a.add("d5","decision","So du du?")
    a.add("a31","action","Tru so du vi"); a.add("a32","action","Ghi nhan giao dich")
    a.add("a33","action","Cap nhat hoa don -> PAID"); a.add("a34","action","Gui thong bao thanh cong")
    a.add("e3","action","Thong bao \"So du khong du\""); a.add("f3","final","")
    a.add("a35","action","Tai hoa don PDF (neu can)"); a.add("f4","final","")
    # edges
    a.link("s","a1"); a.link("a1","a2"); a.link("a2","a3"); a.link("a3","d1")
    a.link("d1","e1","Co"); a.link("e1","f1"); a.link("d1","a4","Khong"); a.link("a4","a5"); a.link("a5","a6")
    a.link("a6","a7"); a.link("a7","a8"); a.link("a8","d2")
    a.link("d2","a9","Khong"); a.link("a9","e2"); a.link("e2","f2")
    a.link("d2","a10","Co"); a.link("a10","a11"); a.link("a11","a12"); a.link("a12","a13"); a.link("a13","a14")
    a.link("a14","a15"); a.link("a15","a16"); a.link("a16","a17"); a.link("a17","a18"); a.link("a18","a19")
    a.link("a19","d3"); a.link("d3","a20","Co"); a.link("a20","j1"); a.link("d3","j1","Khong")
    a.link("j1","a21"); a.link("a21","a22"); a.link("a22","a23"); a.link("a23","a24"); a.link("a24","a25")
    a.link("a25","d4"); a.link("d4","a26","Co"); a.link("a26","a27"); a.link("a27","a28"); a.link("a28","a29")
    a.link("d4","a29","Khong"); a.link("a29","a30"); a.link("a30","d5")
    a.link("d5","a31","Co"); a.link("a31","a32"); a.link("a32","a33"); a.link("a33","a34"); a.link("a34","a35")
    a.link("a35","f4"); a.link("d5","e3","Khong"); a.link("e3","f3")
    return a.render()

def act_vnpay():
    a = ActBuilder("14-Activity-NapTien-VNPay")
    a.add("s","initial",""); a.add("a1","action","Vao trang quan ly vi"); a.add("a2","action","Chon \"Nap tien\"")
    a.add("a3","action","Nhap so tien can nap (10K-100M VND)"); a.add("a4","action","Tao ma giao dich (txnRef)")
    a.add("a5","action","Tao ban ghi Payment (PENDING)"); a.add("a6","action","Khoi tao URL thanh toan VNPay (ky HMAC-SHA512)")
    a.add("a7","action","Chuyen huong sang VNPay"); a.add("a8","action","Hien thi form thanh toan")
    a.add("a9","action","Chon ngan hang, nhap thong tin the"); a.add("a10","action","Xac nhan thanh toan")
    a.add("a11","action","Xu ly giao dich"); a.add("f1","fork","")
    a.add("a12","action","Gui phan hoi qua Return URL"); a.add("a13","action","Gui phan hoi qua IPN (server-to-server)")
    a.add("j1","join",""); a.add("a14","action","Nhan phan hoi tu VNPay")
    a.add("a15","action","Doi soat chu ky HMAC-SHA512"); a.add("d1","decision","Chu ky hop le?")
    a.add("d2","decision","Ma phan hoi = \"00\"?")
    a.add("e1","action","Chuyen huong /wallet?status=invalid"); a.add("f2","final","")
    a.add("a16","action","Cap nhat Payment -> SUCCESS"); a.add("a17","action","Cong tien vao vi (Wallet.balance += amount)")
    a.add("a18","action","Ghi nhan giao dich vi (TOPUP)"); a.add("a19","action","Tao thong bao \"Nap tien thanh cong\"")
    a.add("a20","action","Chuyen huong /wallet?status=success"); a.add("f3","final","")
    a.add("a21","action","Cap nhat Payment -> FAILED"); a.add("a22","action","Chuyen huong /wallet?status=failed")
    a.add("f4","final","")
    a.add("a23","action","Xem ket qua nap tien"); a.add("f5","final","")
    a.link("s","a1"); a.link("a1","a2"); a.link("a2","a3"); a.link("a3","a4"); a.link("a4","a5"); a.link("a5","a6")
    a.link("a6","a7"); a.link("a7","a8"); a.link("a8","a9"); a.link("a9","a10"); a.link("a10","a11")
    a.link("a11","f1"); a.link("f1","a12"); a.link("f1","a13"); a.link("a12","j1"); a.link("a13","j1")
    a.link("j1","a14"); a.link("a14","a15"); a.link("a15","d1")
    a.link("d1","e1","Khong"); a.link("e1","f2")
    a.link("d1","d2","Co"); a.link("d2","a16","Co"); a.link("a16","a17"); a.link("a17","a18"); a.link("a18","a19")
    a.link("a19","a20"); a.link("a20","a23"); a.link("a23","f5")
    a.link("d2","a21","Khong"); a.link("a21","a22"); a.link("a22","a23")
    return a.render()

def act_maintenance():
    a = ActBuilder("15-Activity-QuanLy-BaoTri")
    a.add("s","initial",""); a.add("a1","action","Vao trang quan ly bao tri"); a.add("a2","action","Chon \"Tao phieu bao tri\"")
    a.add("a3","action","Chon tram sac bi su co"); a.add("a4","action","Chon tru sac (neu co)")
    a.add("a5","action","Nhap tieu de va mo ta su co"); a.add("a6","action","Chon muc uu tien")
    a.add("d1","decision","Phan cong ngay?"); a.add("a7","action","Chon Ky thuat vien")
    a.add("a8","action","Tao phieu bao tri (OPEN)"); a.add("a9","action","Gui thong bao cho Ky thuat vien")
    a.add("a10","action","Nhan thong bao"); a.add("a11","action","Xem danh sach phieu duoc phan cong")
    a.add("a12","action","Xem chi tiet phieu"); a.add("a13","action","Den tram kiem tra")
    a.add("a14","action","Cap nhat trang thai -> IN_PROGRESS"); a.add("a15","action","Cap nhat tru -> MAINTENANCE (neu co)")
    a.add("a16","action","Tien hanh sua chua"); a.add("d2","decision","Da sua xong?")
    a.add("a17","action","Cap nhat trang thai -> RESOLVED"); a.add("a18","action","Nhap ghi chu ket qua")
    a.add("a19","action","Gui thong bao cho Quan tri vien"); a.add("a20","action","Nhan thong bao phieu da xu ly")
    a.add("a21","action","Xem chi tiet phieu bao tri"); a.add("a22","action","Kiem tra ket qua sua chua")
    a.add("d3","decision","Dat yeu cau?"); a.add("a23","action","Dong phieu -> CLOSED")
    a.add("a24","action","Cap nhat tru -> AVAILABLE (neu co)"); a.add("a25","action","Gui thong bao hoan thanh")
    a.add("f1","final",""); a.add("a26","action","Mo lai phieu hoac tao phieu moi")
    a.link("s","a1"); a.link("a1","a2"); a.link("a2","a3"); a.link("a3","a4"); a.link("a4","a5"); a.link("a5","a6")
    a.link("a6","d1"); a.link("d1","a7","Co"); a.link("a7","a8"); a.link("d1","a8","Khong")
    a.link("a8","a9"); a.link("a9","a10"); a.link("a10","a11"); a.link("a11","a12"); a.link("a12","a13")
    a.link("a13","a14"); a.link("a14","a15"); a.link("a15","a16"); a.link("a16","d2")
    a.link("d2","a16","Chua xong")
    a.link("d2","a17","Co"); a.link("a17","a18"); a.link("a18","a19"); a.link("a19","a20") 
    a.link("a20","a21"); a.link("a21","a22"); a.link("a22","d3")
    a.link("d3","a23","Co"); a.link("a23","a24"); a.link("a24","a25"); a.link("a25","f1")
    a.link("d3","a26","Khong")
    return a.render()

def act_cron():
    a = ActBuilder("16-Activity-Cron-HuyDatCho")
    a.add("s","initial",""); a.add("a1","action","Kich hoat moi 1 phut")
    a.add("a2","action","Goi API /api/cron/expire-reservations")
    a.add("a3","action","Tinh thoi diem cat (cutoff = hien tai - 15 phut)")
    a.add("a4","action","Truy van tat ca dat cho PENDING co startTime <= cutoff")
    a.add("d1","decision","Co dat cho qua han?")
    a.add("a5","action","Bat dau giao dich (transaction)")
    a.add("a6","action","Cap nhat dat cho -> CANCELLED")
    a.add("a7","action","Tao thong bao WARNING gui cho nguoi dung")
    a.add("a8","action","Ket thuc giao dich (commit)")
    a.add("d2","decision","Con dat cho chua xu ly?")
    a.add("a9","action","Tra ve ket qua {cancelled: N}")
    a.add("f1","final","")
    a.add("a10","action","Tra ve ket qua {cancelled: 0}")
    a.add("f2","final","")
    a.link("s","a1"); a.link("a1","a2"); a.link("a2","a3"); a.link("a3","a4"); a.link("a4","d1")
    a.link("d1","a10","Khong"); a.link("a10","f2")
    a.link("d1","a5","Co"); a.link("a5","a6"); a.link("a6","a7"); a.link("a7","a8"); a.link("a8","d2")
    a.link("d2","a5","Co"); a.link("d2","a9","Khong"); a.link("a9","f1")
    return a.render()

def build_all_activity():
    save("13-Activity-DatCho-CheckIn-Sac-ThanhToan.drawio", act_end_to_end())
    save("14-Activity-NapTien-VNPay.drawio", act_vnpay())
    save("15-Activity-QuanLy-BaoTri.drawio", act_maintenance())
    save("16-Activity-Cron-HuyDatCho.drawio", act_cron())

# ═══════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════
if __name__ == "__main__":
    print("=== USE CASE DIAGRAMS ===")
    build_all_uc()
    print("=== ACTIVITY DIAGRAMS ===")
    build_all_activity()
    print("=== DONE ===")
