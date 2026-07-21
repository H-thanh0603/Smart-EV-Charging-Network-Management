# -*- coding: utf-8 -*-
"""Generator UML Drawio - TUAN THU DAY DU QUY TAC UML."""
import os, html, xml.etree.ElementTree as ET
from math import sin, cos, atan2, sqrt, pi

OUT = os.path.join(os.path.dirname(__file__), "..", "Diagrams")
os.makedirs(OUT, exist_ok=True)

def esc(s): return html.escape(str(s), quote=True)
_uid = [0]
def nid(p="n"): _uid[0]+=1; return f"{p}{_uid[0]}"

# ─── STYLES (UML Standard, no colors) ───
# Use Case
S_ACTOR = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=none;strokeColor=#000000;fontSize=12;"
S_USECASE = "ellipse;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;fontSize=11;"
S_USECASE_I = "ellipse;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;fontSize=10;dashed=1;"
S_BOUNDARY = "rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;fillColor=none;strokeColor=#000000;fontStyle=1;fontSize=13;align=center;dashed=0;"
S_ASSOC = "endArrow=none;html=1;strokeColor=#000000;"
S_INCLUDE = "endArrow=open;dashed=1;html=1;strokeColor=#000000;fontSize=10;fontStyle=2;"
S_EXTEND = "endArrow=open;dashed=1;html=1;strokeColor=#000000;fontSize=10;fontStyle=2;"
S_GEN_UC = "endArrow=block;endFill=0;html=1;strokeColor=#000000;"

# Activity
S_INITIAL = "ellipse;html=1;fillColor=#000000;strokeColor=#000000;"
S_FINAL_O = "ellipse;html=1;fillColor=none;strokeColor=#000000;strokeWidth=2;"
S_FINAL_I = "ellipse;html=1;fillColor=#000000;strokeColor=none;"
S_ACTION = "rounded=1;whiteSpace=wrap;html=1;arcSize=30;fillColor=none;strokeColor=#000000;fontSize=10;"
S_DECISION = "rhombus;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;fontSize=10;"
S_MERGE = "rhombus;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;fontSize=10;"
S_BAR = "rounded=0;html=1;fillColor=#000000;strokeColor=#000000;"
S_FLOW = "endArrow=open;html=1;strokeColor=#000000;"
S_FLOW_GUARD = "endArrow=open;html=1;strokeColor=#000000;fontSize=9;fontStyle=2;"
S_SWIMLANE = "swimlane;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;fontSize=11;startSize=25;"

# Sequence
S_ACTOR_S = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=none;strokeColor=#000000;fontSize=11;"
S_LIFELINE = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=0;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=none;strokeColor=#000000;fontSize=10;size=10;"
S_RECT_S = "rounded=1;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;fontSize=10;"
S_MSG = "html=1;verticalAlign=bottom;endArrow=block;strokeColor=#000000;fontSize=9;"
S_MSG_ASYNC = "html=1;verticalAlign=bottom;endArrow=open;strokeColor=#000000;fontSize=9;"
S_REPLY = "html=1;verticalAlign=bottom;endArrow=open;dashed=1;strokeColor=#000000;fontSize=9;"
S_FRAME = "shape=umlFrame;whiteSpace=wrap;html=1;width=80;height=24;fillColor=none;strokeColor=#000000;fontSize=9;fontStyle=1;"
S_ACTBAR = "rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;"
S_NOTE_S = "shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;darkOpacity=0.05;fillColor=none;strokeColor=#000000;fontSize=8;align=left;"

class Page:
    def __init__(self, name, w=1654, h=1169):
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
        """Edge without source/target refs, using absolute coords."""
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

# ═══════════════════════════════════════════
# 1. USE CASE DIAGRAMS (12 files)
# ═══════════════════════════════════════════

def make_uc_overview():
    p = Page("01-UseCase-TongQuat")
    # ── ACTORS ──
    actors = [
        ("G","Khach vang lai",        40, 80, S_ACTOR),
        ("Cu","Khach hang",           40, 250, S_ACTOR),
        ("Dr","Tai xe doi xe",        40, 420, S_ACTOR),
        ("Te","Ky thuat vien",      1180, 120, S_ACTOR),
        ("Ad","Quan tri vien",      1180, 300, S_ACTOR),
        ("VN","Cong TT VNPay",      1180, 600, S_ACTOR),
        ("Cr","Bo dinh thoi (Cron)",1180, 780, S_ACTOR),
    ]
    aid = {}
    for k,lb,x,y,st in actors:
        aid[k] = p.vertex(nid("a"), lb, st, x, y, 50, 90)

    # ── GENERALIZATION (mũi tên tam giác rỗng về phần tổng quát) ──
    # Driver -> Customer -> Guest
    p.edge(nid("g"), "", S_GEN_UC, aid["Cu"], aid["G"])
    p.edge(nid("g"), "", S_GEN_UC, aid["Dr"], aid["Cu"])

    # ── SYSTEM BOUNDARY ──
    p.vertex(nid("b"), "HE THONG QUAN LY TRAM SAC XE DIEN V-GREEN", S_BOUNDARY, 200, 40, 900, 800)

    # ── USE CASES (packages) ──
    pkgs = [
        "A. Tai khoan & Xac thuc","B. Tim kiem & Xem tram","C. Dat cho",
        "D. Phien sac","E. Hoa don & Thanh toan","F. Vi dien tu & VNPay",
        "G. Khach hang than thiet","H. Danh gia tram","I. Phuong tien",
        "J. Thong bao","K. Bao tri","L. Quan tri"
    ]
    pid = {}
    for i,lb in enumerate(pkgs):
        r,c = i//2, i%2
        pid[lb[0]] = p.vertex(nid("p"), lb, S_ACTION, 250+c*380, 100+r*120, 340, 100)

    # ── ASSOCIATIONS ──
    def ass(a,b): p.edge(nid("e"), "", S_ASSOC, aid[a], pid[b])
    for b in "AB": ass("G",b)
    for b in "ABCDEFGHIJ": ass("Cu",b)
    for b in "CDE": ass("Dr",b)
    ass("Te","K"); ass("Te","J")
    for b in "LBK": ass("Ad",b)

    # ── EXTERNAL DEPENDENCIES ──
    p.edge(nid("d"), "redirect", S_EXTEND, pid["F"], aid["VN"])
    p.edge(nid("d"), "trigger", S_EXTEND, pid["C"], aid["Cr"])
    p.edge(nid("d"), "trigger", S_EXTEND, pid["J"], aid["Cr"])
    return p

def make_uc_package(title, actors, ucs, assocs, rels):
    """actors: [(key,label,is_secondary)], ucs: [(key,label,kind:uc|inc)], 
       assocs: [(akey,ukey)], rels: [(src,dst,type:include|extend)]"""
    p = Page(title)
    aid = {}
    left_actors = [a for a in actors if not a[2]]
    right_actors = [a for a in actors if a[2]]
    ay = 80
    for k,l,_ in left_actors:
        aid[k] = p.vertex(nid("a"), l, S_ACTOR, 40, ay, 50, 90); ay += 170
    ay = 80
    for k,l,_ in right_actors:
        aid[k] = p.vertex(nid("a"), l, S_ACTOR, 980, ay, 50, 90); ay += 170

    n = len(ucs)
    rows = max((n+1)//2, 1)
    bh = max(rows*110 + 60, 200)
    # Title from filename
    t = title.split(" ",1)[1] if " " in title else title
    p.vertex(nid("b"), t, S_BOUNDARY, 200, 40, 720, bh)

    uid = {}
    uw, uh = 260, 60
    cx = [240, 240+uw+120]
    sy = 100
    for i,(k,lb,kd) in enumerate(ucs):
        r,c = i//2, i%2
        st = S_USECASE if kd=="uc" else S_USECASE_I
        uid[k] = p.vertex(nid("u"), lb, st, cx[c], sy+r*100, uw, uh)

    # Associations
    for ak,uk in assocs:
        if ak in aid and uk in uid:
            p.edge(nid("e"), "", S_ASSOC, aid[ak], uid[uk])

    # Relations (include/extend) — arrow points TO the referenced use case
    for s,d,t in rels:
        if s not in uid or d not in uid: continue
        if t == "include":
            # include: mũi tên hướng về UC được dùng chung
            p.edge(nid("r"), "<<include>>", S_INCLUDE, uid[s], uid[d])
        elif t == "extend":
            # extend: mũi tên hướng về UC bị mở rộng
            p.edge(nid("r"), "<<extend>>", S_EXTEND, uid[s], uid[d])
    return p

# ─── ALL USE CASE PACKAGES ───
UC_PACKAGES = [
    ("02-GoiA-TaiKhoan-XacThuc", "Goi A - Tai khoan & Xac thuc",
     [("G","Khach vang lai",0),("U","Nguoi dung da DN",0)],
     [("A1","Dang ky tai khoan","uc"),("A2","Dang nhap","uc"),("A3","Dang xuat","uc"),
      ("A4","Quen mat khau","uc"),("A5","Dat lai mat khau","uc"),("A6","Doi mat khau","uc"),
      ("A7","Xem ho so","uc"),("A8","Cap nhat ho so","uc"),
      ("A41","Tao ma dat lai mat khau","inc"),("A51","Kiem tra han ma dat lai","inc")],
     [("G","A1"),("G","A2"),("G","A4"),("G","A5"),("U","A3"),("U","A6"),("U","A7"),("U","A8")],
     [("A4","A41","include"),("A5","A51","include")]),
    ("03-GoiB-TimKiem-XemTram", "Goi B - Tim kiem & Xem tram sac",
     [("G","Khach vang lai",0),("Cu","Khach hang",0)],
     [("B1","Xem danh sach tram","uc"),("B2","Xem ban do tram","uc"),("B3","Tim tram gan day","uc"),
      ("B4","Xem goi y tram","uc"),("B5","Xem chi tiet tram","uc"),("B6","Xem danh sach tru","uc"),
      ("B7","Xem trang thai tru live","uc"),("B8","Loc tram theo loai dau cam","uc"),("B9","Quet ma QR tru sac","uc")],
     [("G","B1"),("G","B2"),("G","B5"),("Cu","B3"),("Cu","B4"),("Cu","B6"),("Cu","B7"),("Cu","B8"),("Cu","B9")],
     [("B1","B8","extend"),("B5","B6","include")]),
    ("04-GoiC-DatCho", "Goi C - Dat cho",
     [("Cu","Khach hang / Tai xe",0),("Ad","Quan tri vien",0),("Cr","Bo dinh thoi (Cron)",1)],
     [("C1","Dat cho mot lan","uc"),("C2","Dat cho lap lai","uc"),("C3","Xem danh sach dat cho","uc"),
      ("C4","Xem chi tiet dat cho","uc"),("C5","Huy dat cho","uc"),("C6","Check-in tai tram","uc"),
      ("C7","Tu dong huy qua han 15p","uc"),("C8","Nhac lich sac","uc"),("C9","Kiem tra trung khung gio","inc")],
     [("Cu","C1"),("Cu","C2"),("Cu","C3"),("Cu","C4"),("Cu","C5"),("Cu","C6"),("Ad","C3"),("Cr","C7"),("Cr","C8")],
     [("C1","C9","include")]),
    ("05-GoiD-PhienSac", "Goi D - Phien sac",
     [("Cu","Khach hang / Tai xe",0)],
     [("D1","Bat dau phien sac","uc"),("D2","Theo doi phien sac","uc"),("D3","Ket thuc phien sac","uc"),
      ("D4","Xem lich su phien","uc"),("D5","Xem thong ke phien","uc"),
      ("D6","Tinh dien nang tieu thu","inc"),("D7","Tu dong lap hoa don","inc"),
      ("D8","Ap chiet khau doi xe","inc"),("D9","Cong diem thuong","inc")],
     [("Cu","D1"),("Cu","D2"),("Cu","D3"),("Cu","D4"),("Cu","D5")],
     [("D3","D6","include"),("D3","D7","include"),("D3","D8","include"),("D3","D9","include")]),
    ("06-GoiE-HoaDon-ThanhToan", "Goi E - Hoa don & Thanh toan",
     [("Cu","Khach hang / Tai xe",0)],
     [("E1","Xem danh sach hoa don","uc"),("E2","Xem chi tiet hoa don","uc"),("E3","Thanh toan bang vi","uc"),
      ("E4","Ap dung ma giam gia","inc"),("E5","Kiem tra hop le ma giam gia","inc"),("E6","Tai hoa don PDF","uc")],
     [("Cu","E1"),("Cu","E2"),("Cu","E3"),("Cu","E6")],
     [("E3","E4","extend"),("E4","E5","include")]),
    ("07-GoiF-ViDienTu-VNPay", "Goi F - Vi dien tu & VNPay",
     [("Cu","Khach hang / Tai xe",0),("VN","Cong TT VNPay",1)],
     [("F1","Xem so du & lich su vi","uc"),("F2","Nap tien thu cong (demo)","uc"),("F3","Tao giao dich nap VNPay","uc"),
      ("F4","Xu ly phan hoi tu VNPay","uc"),("F5","Doi soat chu ky & so tien","inc"),("F6","Cong tien vao vi","inc")],
     [("Cu","F1"),("Cu","F2"),("Cu","F3"),("VN","F4")],
     [("F4","F5","include"),("F4","F6","include")]),
    ("08-GoiG-KhachHangThanThiet", "Goi G - Khach hang than thiet",
     [("Cu","Khach hang / Tai xe",0),("Ad","Quan tri vien",0)],
     [("G1","Xem diem & hang thanh vien","uc"),("G2","Tich diem khi thanh toan","uc"),("G3","Doi diem lay tien vao vi","uc"),
      ("G4","Xem lich su diem","uc"),("G5","Tu dong nang/giu hang","inc"),("G6","Admin dieu chinh diem","uc")],
     [("Cu","G1"),("Cu","G3"),("Cu","G4"),("Ad","G6")],
     [("G2","G5","include")]),
    ("09-GoiH-DanhGiaTram", "Goi H - Danh gia tram",
     [("Cu","Khach hang",0),("Ad","Quan tri vien",0)],
     [("H1","Xem danh gia cua tram","uc"),("H2","Gui danh gia (1-5 sao)","uc"),
      ("H3","Kiem tra da tung sac","inc"),("H4","Cap nhat diem danh gia TB","inc"),("H5","Admin duyet/xoa danh gia","uc")],
     [("Cu","H1"),("Cu","H2"),("Ad","H5")],
     [("H2","H3","include"),("H2","H4","include")]),
    ("10-GoiI-PhuongTien", "Goi I - Phuong tien",
     [("Cu","Khach hang / Tai xe",0)],
     [("I1","Xem danh sach phuong tien","uc"),("I2","Them phuong tien","uc"),("I3","Cap nhat phuong tien","uc"),("I4","Xoa phuong tien","uc")],
     [("Cu","I1"),("Cu","I2"),("Cu","I3"),("Cu","I4")], []),
    ("11-GoiK-BaoTri", "Goi K - Bao tri",
     [("Ad","Quan tri vien",0),("Te","Ky thuat vien",0)],
     [("K1","Tao phieu bao tri","uc"),("K2","Phan cong ky thuat vien","uc"),("K3","Xem tat ca phieu bao tri","uc"),
      ("K4","Xem phieu duoc phan cong","uc"),("K5","Cap nhat tien do sua chua","uc"),("K6","Dong phieu bao tri","uc")],
     [("Ad","K1"),("Ad","K2"),("Ad","K3"),("Ad","K6"),("Te","K4"),("Te","K5")],
     [("K1","K2","extend")]),
    ("12-GoiL-QuanTri", "Goi L - Quan tri",
     [("Ad","Quan tri vien",0)],
     [("L1","Xem bang dieu khien thong ke","uc"),("L2","Quan ly tram va tru sac","uc"),("L3","Quan ly nguoi dung","uc"),
      ("L4","Quan ly bieu gia dien","uc"),("L5","Quan ly doi xe (fleet)","uc"),("L6","Quan ly ma giam gia","uc"),
      ("L7","Xem bao cao doanh thu","uc"),("L8","Quan ly webhook","uc")],
     [("Ad","L1"),("Ad","L2"),("Ad","L3"),("Ad","L4"),("Ad","L5"),("Ad","L6"),("Ad","L7"),("Ad","L8")], []),
]

def build_all_uc():
    save("01-UseCase-TongQuat.drawio", make_uc_overview())
    for fn,title,actors,ucs,assocs,rels in UC_PACKAGES:
        save(f"{fn}.drawio", make_uc_package(title, actors, ucs, assocs, rels))

# ═══════════════════════════════════════════
# 2. ACTIVITY DIAGRAMS (4 files)
# ═══════════════════════════════════════════

class ActBuilder:
    """Builder for Activity Diagram with swimlane support."""
    def __init__(self, title, swimlanes=None):
        self.p = Page(title, w=1800, h=2000)
        self.nodes = {}  # key -> (kind, label, x, y, w, h, parent)
        self.edges = []  # (src, dst, guard_label, points)
        self.sl_ids = {}
        self.sl_heights = {}
        self.cx = 600  # center x
        self.cy = 80   # current y

        if swimlanes:
            # Create swimlane containers
            sl_x, sl_w = 40, 1700
            sl_y = 60
            for sl_name in swimlanes:
                sid = nid("sl")
                # Each swimlane is a tall box
                h = 800  # initial height, will adjust
                self.p.vertex(sid, sl_name, S_SWIMLANE, sl_x, sl_y, sl_w, h)
                self.sl_ids[sl_name] = sid
                self.sl_heights[sl_name] = h
                sl_y += h + 10
            self.swimlanes = swimlanes
        else:
            self.swimlanes = None

    def _lane_x(self, lane_name):
        """Return center x for a given swimlane."""
        if not self.swimlanes or lane_name not in self.sl_ids:
            return self.cx
        # All lanes share the same x range currently
        return self.cx

    def add(self, key, kind, label, x=None, y=None, w=None, h=None, lane=None):
        if x is None: x = (self._lane_x(lane) if lane else self.cx) - (w or 220)//2
        if y is None: y = self.cy; self.cy += 80
        if kind=="initial": w,h=30,30
        elif kind=="final": w,h=34,34
        elif kind=="decision": w,h=w or 160,h or 70
        elif kind=="merge": w,h=w or 160,h or 70
        elif kind in ("fork","join"): w,h=w or 200,h or 12
        else: w,h=w or 240,h or 50

        parent = self.sl_ids[lane] if lane and lane in self.sl_ids else "1"
        self.nodes[key] = (kind,label,x,y,w,h,parent)
        self.cy = y + h + 60
    def link(self, s, d, guard="", pts=None):
        self.edges.append((s, d, guard, pts))
    def render(self):
        idmap = {}
        for key,(kind,label,x,y,w,h,parent) in self.nodes.items():
            cid=nid("a"); idmap[key]=cid
            if kind=="initial": self.p.vertex(cid,"",S_INITIAL,x,y,w,h,parent)
            elif kind=="final":
                self.p.vertex(cid,"",S_FINAL_O,x,y,w,h,parent)
                self.p.vertex(cid+"i","",S_FINAL_I,x+7,y+7,w-14,h-14,parent)
            elif kind=="decision": self.p.vertex(cid,label,S_DECISION,x,y,w,h,parent)
            elif kind=="merge": self.p.vertex(cid,"",S_MERGE,x,y,w,h,parent)
            elif kind in ("fork","join"): self.p.vertex(cid,"",S_BAR,x,y,w,h,parent)
            else: self.p.vertex(cid,label,S_ACTION,x,y,w,h,parent)

        for s,d,guard,pts in self.edges:
            if s not in idmap or d not in idmap: continue
            st = S_FLOW_GUARD if guard else S_FLOW
            self.p.edge(nid("e"), guard, st, idmap[s], idmap[d], pts)
        return self.p

def act_end_to_end():
    a = ActBuilder("13-Activity-TongThe", ["Khach hang", "He thong", "Bo dinh thoi"])
    # Customer lane
    a.add("s","initial","",lane="Khach hang")
    a.add("a1","action","Tim kiem tram sac",lane="Khach hang")
    a.add("a2","action","Chon tram va xem chi tiet",lane="Khach hang")
    a.add("a3","action","Chon tru sac con trong",lane="Khach hang")
    # System
    a.add("d1","decision","Co trung khung gio?",lane="He thong")
    a.add("e1","action","Thong bao loi",lane="He thong"); a.add("f1","final","",lane="Khach hang")
    a.add("a4","action","Chon ngay va khung gio",lane="Khach hang")
    a.add("a5","action","Xac nhan dat cho",lane="Khach hang")
    a.add("a6","action","Tao dat cho PENDING",lane="He thong")
    a.add("a7","action","Gui thong bao xac nhan",lane="He thong")
    a.add("a8","action","Den tram trong 15 phut",lane="Khach hang")
    a.add("d2","decision","Check-in dung han?",lane="He thong")
    # Cron
    a.add("a9","action","Tu dong huy dat cho",lane="Bo dinh thoi")
    a.add("e2","action","Gui thong bao huy",lane="He thong"); a.add("f2","final","",lane="Khach hang")
    a.add("a10","action","Quet QR / nhan Check-in",lane="Khach hang")
    a.add("a11","action","Cap nhat -> CONFIRMED",lane="He thong")
    a.add("a12","action","Tao phien sac ACTIVE",lane="He thong")
    a.add("a13","action","Cap nhat tru -> OCCUPIED",lane="He thong")
    a.add("a14","action","Theo doi phien sac",lane="Khach hang")
    a.add("a15","action","Mo phong sac (kW x gio x 0.9)",lane="He thong")
    a.add("a16","action","Ket thuc phien sac",lane="Khach hang")
    a.add("a17","action","Tinh kWh tieu thu",lane="He thong")
    a.add("a18","action","Tra bieu gia theo khung gio",lane="He thong")
    a.add("a19","action","Tinh tien (kWh x don gia)",lane="He thong")
    a.add("d3","decision","Tai xe doi xe?",lane="He thong")
    a.add("a20","action","Ap chiet khau fleet",lane="He thong"); a.add("j1","merge","",lane="He thong")
    a.add("a21","action","Tinh diem thuong",lane="He thong")
    a.add("a22","action","Lap hoa don UNPAID",lane="He thong")
    a.add("a23","action","Cap nhat tru -> AVAILABLE",lane="He thong")
    a.add("a24","action","Gui thong bao ket qua",lane="He thong")
    a.add("a25","action","Xem hoa don",lane="Khach hang")
    a.add("d4","decision","Co ma giam gia?",lane="Khach hang")
    a.add("a26","action","Nhap ma giam gia",lane="Khach hang")
    a.add("a27","action","Kiem tra hop le",lane="He thong")
    a.add("a28","action","Tinh so tien giam",lane="He thong")
    a.add("a29","action","Chon thanh toan bang vi",lane="Khach hang")
    a.add("a30","action","Kiem tra so du vi",lane="He thong")
    a.add("d5","decision","So du du?",lane="He thong")
    a.add("a31","action","Tru so du vi",lane="He thong")
    a.add("a32","action","Ghi nhan giao dich",lane="He thong")
    a.add("a33","action","Hoa don -> PAID",lane="He thong")
    a.add("a34","action","Gui thong bao thanh cong",lane="He thong")
    a.add("e3","action","Thong bao \"Khong du\"",lane="He thong"); a.add("f3","final","",lane="Khach hang")
    a.add("a35","action","Tai hoa don PDF",lane="Khach hang"); a.add("f4","final","",lane="Khach hang")

    links = [
        ("s","a1"),("a1","a2"),("a2","a3"),("a3","d1"),
        ("d1","e1","Co"),("e1","f1"),("d1","a4","Khong"),("a4","a5"),("a5","a6"),("a6","a7"),("a7","a8"),("a8","d2"),
        ("d2","a9","Khong"),("a9","e2"),("e2","f2"),
        ("d2","a10","Co"),("a10","a11"),("a11","a12"),("a12","a13"),("a13","a14"),("a14","a15"),("a15","a16"),
        ("a16","a17"),("a17","a18"),("a18","a19"),("a19","d3"),
        ("d3","a20","Co"),("a20","j1"),("d3","j1","Khong"),
        ("j1","a21"),("a21","a22"),("a22","a23"),("a23","a24"),("a24","a25"),("a25","d4"),
        ("d4","a26","Co"),("a26","a27"),("a27","a28"),("a28","a29"),("d4","a29","Khong"),
        ("a29","a30"),("a30","d5"),
        ("d5","a31","Co"),("a31","a32"),("a32","a33"),("a33","a34"),("a34","a35"),("a35","f4"),
        ("d5","e3","Khong"),("e3","f3"),
    ]
    for s,d, *rest in links:
        g = rest[0] if rest else ""
        a.link(s,d,g)
    return a.render()

def act_vnpay():
    a = ActBuilder("14-Activity-NapTien-VNPay", ["Khach hang", "He thong", "Cong TT VNPay"])
    a.add("s","initial","",lane="Khach hang")
    a.add("a1","action","Vao trang vi",lane="Khach hang"); a.add("a2","action","Chon Nap tien",lane="Khach hang")
    a.add("a3","action","Nhap so tien (10K-100M)",lane="Khach hang")
    a.add("a4","action","Tao giao dich PENDING",lane="He thong")
    a.add("a5","action","Ky HMAC-SHA512 + build URL",lane="He thong")
    a.add("a6","action","Chuyen huong sang VNPay",lane="He thong")
    a.add("a7","action","Hien thi form thanh toan",lane="Cong TT VNPay")
    a.add("a8","action","Chon ngan hang, nhap the",lane="Khach hang")
    a.add("a9","action","Xac nhan thanh toan",lane="Khach hang")
    a.add("a10","action","Xu ly giao dich",lane="Cong TT VNPay")
    a.add("f1","fork","",lane="He thong")
    a.add("a11","action","Return URL",lane="He thong"); a.add("a12","action","IPN (server)",lane="He thong")
    a.add("j1","join","",lane="He thong")
    a.add("a13","action","Doi soat chu ky HMAC-SHA512",lane="He thong")
    a.add("d1","decision","Chu ky hop le?",lane="He thong")
    a.add("e1","action","Redirect invalid",lane="He thong"); a.add("f2","final","",lane="Khach hang")
    a.add("d2","decision","Ma = 00?",lane="He thong")
    a.add("a14","action","Payment->SUCCESS + cong vi",lane="He thong")
    a.add("a15","action","Redirect success",lane="He thong"); a.add("f3","final","",lane="Khach hang")
    a.add("a16","action","Payment->FAILED",lane="He thong")
    a.add("a17","action","Redirect failed",lane="He thong"); a.add("f4","final","",lane="Khach hang")
    links = [
        ("s","a1"),("a1","a2"),("a2","a3"),("a3","a4"),("a4","a5"),("a5","a6"),("a6","a7"),("a7","a8"),
        ("a8","a9"),("a9","a10"),("a10","f1"),("f1","a11"),("f1","a12"),("a11","j1"),("a12","j1"),
        ("j1","a13"),("a13","d1"),
        ("d1","e1","Khong"),("e1","f2"),
        ("d1","d2","Co"),("d2","a14","Co"),("a14","a15"),("a15","f3"),
        ("d2","a16","Khong"),("a16","a17"),("a17","f4"),
    ]
    for s,d, *rest in links:
        g = rest[0] if rest else ""
        a.link(s,d,g)
    return a.render()

def act_maintenance():
    a = ActBuilder("15-Activity-BaoTri", ["Quan tri vien", "Ky thuat vien", "He thong"])
    a.add("s","initial","",lane="Quan tri vien")
    a.add("a1","action","Vao trang bao tri",lane="Quan tri vien"); a.add("a2","action","Tao phieu bao tri",lane="Quan tri vien")
    a.add("a3","action","Chon tram, tru, mo ta, uu tien",lane="Quan tri vien")
    a.add("d1","decision","Phan cong ngay?",lane="Quan tri vien")
    a.add("a4","action","Chon ky thuat vien",lane="Quan tri vien")
    a.add("a5","action","Tao phieu OPEN + gui thong bao",lane="He thong")
    a.add("a6","action","Nhan thong bao",lane="Ky thuat vien")
    a.add("a7","action","Xem phieu duoc gan",lane="Ky thuat vien")
    a.add("a8","action","Den tram kiem tra",lane="Ky thuat vien")
    a.add("a9","action","Cap nhat -> IN_PROGRESS",lane="Ky thuat vien")
    a.add("a10","action","Cap nhat tru -> MAINTENANCE",lane="He thong")
    a.add("a11","action","Tien hanh sua chua",lane="Ky thuat vien")
    a.add("d2","decision","Da sua xong?",lane="Ky thuat vien")
    a.add("a12","action","Cap nhat -> RESOLVED",lane="Ky thuat vien")
    a.add("a13","action","Nhap ghi chu ket qua",lane="Ky thuat vien")
    a.add("a14","action","Gui thong bao cho Admin",lane="He thong")
    a.add("a15","action","Kiem tra ket qua",lane="Quan tri vien")
    a.add("d3","decision","Dat yeu cau?",lane="Quan tri vien")
    a.add("a16","action","Dong phieu -> CLOSED",lane="Quan tri vien")
    a.add("a17","action","Cap nhat tru -> AVAILABLE",lane="He thong")
    a.add("a18","action","Gui thong bao hoan thanh",lane="He thong"); a.add("f1","final","",lane="Quan tri vien")
    a.add("a19","action","Mo lai phieu / tao moi",lane="Quan tri vien")
    links = [
        ("s","a1"),("a1","a2"),("a2","a3"),("a3","d1"),
        ("d1","a4","Co"),("a4","a5"),("d1","a5","Khong"),
        ("a5","a6"),("a6","a7"),("a7","a8"),("a8","a9"),("a9","a10"),("a10","a11"),("a11","d2"),
        ("d2","a11","Chua xong"),
        ("d2","a12","Co"),("a12","a13"),("a13","a14"),("a14","a15"),("a15","d3"),
        ("d3","a16","Co"),("a16","a17"),("a17","a18"),("a18","f1"),
        ("d3","a19","Khong"),
    ]
    for s,d, *rest in links:
        g = rest[0] if rest else ""
        a.link(s,d,g)
    return a.render()

def act_cron():
    a = ActBuilder("16-Activity-Cron-HuyDatCho")
    a.add("s","initial",""); a.add("a1","action","Kich hoat moi 1 phut")
    a.add("a2","action","GET /api/cron/expire-reservations")
    a.add("a3","action","Tinh cutoff = now - 15 phut")
    a.add("a4","action","SELECT dat cho PENDING co startTime <= cutoff")
    a.add("d1","decision","Co dat cho qua han?")
    a.add("e1","action","Tra ve {cancelled:0}"); a.add("f1","final","")
    a.add("f2","fork","")
    a.add("a5","action","UPDATE Reservation -> CANCELLED")
    a.add("a6","action","INSERT Notification WARNING")
    a.add("j1","join","")
    a.add("d2","decision","Con dat cho chua xu ly?")
    a.add("a7","action","Tra ve {cancelled:N}"); a.add("f3","final","")
    links = [
        ("s","a1"),("a1","a2"),("a2","a3"),("a3","a4"),("a4","d1"),
        ("d1","e1","Khong"),("e1","f1"),
        ("d1","f2","Co"),("f2","a5"),("f2","a6"),("a5","j1"),("a6","j1"),
        ("j1","d2"),("d2","f2","Co"),("d2","a7","Khong"),("a7","f3"),
    ]
    for s,d, *rest in links:
        g = rest[0] if rest else ""
        a.link(s,d,g)
    return a.render()

def build_all_activity():
    save("13-Activity-TongThe.drawio", act_end_to_end())
    save("14-Activity-NapTien-VNPay.drawio", act_vnpay())
    save("15-Activity-BaoTri.drawio", act_maintenance())
    save("16-Activity-Cron-HuyDatCho.drawio", act_cron())

# ═══════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════
if __name__ == "__main__":
    print("=== USE CASE ===")
    build_all_uc()
    print("=== ACTIVITY ===")
    build_all_activity()
    print("=== DONE PART 1 ===")
