# -*- coding: utf-8 -*-
"""
Generator: chuyển Use Case Model / Activity Diagrams / Sequence Diagrams
sang định dạng .drawio (mxGraph XML) cho hệ thống V-GREEN EV Charging.

Xuất 3 file (mỗi file nhiều trang) vào thư mục ../diagrams-drawio :
  1. 01-UseCaseModel.drawio
  2. 02-ActivityDiagrams.drawio
  3. 03-SequenceDiagrams.drawio

Tuân thủ ký hiệu UML chuẩn:
  - Use Case: actor (umlActor), use case (ellipse), system boundary, association,
    <<include>>/<<extend>> (mũi tên đứt nét), generalization (mũi tên tam giác rỗng).
  - Activity: Initial node (chấm đen), Activity Final (vòng tròn lồng), Action (chữ nhật bo góc),
    Decision/Merge (hình thoi), Fork/Join (thanh đồng bộ), guard [..] trên cạnh.
  - Sequence: lifeline (umlLifeline/umlActor), message (mũi tên), reply (đứt nét),
    combined fragment alt/opt/loop/par (umlFrame).
"""
import os
import html
import xml.etree.ElementTree as ET

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "diagrams-drawio")


# ----------------------------------------------------------------------------
# XML helpers
# ----------------------------------------------------------------------------
def esc(s):
    return html.escape(str(s), quote=True)


class Page:
    """Một trang (diagram) trong file drawio."""
    def __init__(self, name):
        self.name = name
        self.cells = []
        self._uid = 0

    def nid(self, prefix="n"):
        self._uid += 1
        return f"{prefix}{self._uid}"

    def vertex(self, cid, value, style, x, y, w, h, parent="1"):
        self.cells.append(
            f'<mxCell id="{cid}" value="{esc(value)}" style="{style}" vertex="1" parent="{parent}">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )
        return cid

    def edge(self, cid, value, style, source, target, points=None):
        geo = '<mxGeometry relative="1" as="geometry">'
        if points:
            geo += '<Array as="points">'
            for (px, py) in points:
                geo += f'<mxPoint x="{px}" y="{py}"/>'
            geo += '</Array>'
        geo += '</mxGeometry>'
        self.cells.append(
            f'<mxCell id="{cid}" value="{esc(value)}" style="{style}" edge="1" parent="1" '
            f'source="{source}" target="{target}">{geo}</mxCell>'
        )
        return cid

    def free_edge(self, cid, value, style, sx, sy, tx, ty, points=None):
        """Cạnh không gắn source/target (dùng tọa độ tuyệt đối)."""
        geo = '<mxGeometry relative="1" as="geometry">'
        geo += f'<mxPoint x="{sx}" y="{sy}" as="sourcePoint"/>'
        geo += f'<mxPoint x="{tx}" y="{ty}" as="targetPoint"/>'
        if points:
            geo += '<Array as="points">'
            for (px, py) in points:
                geo += f'<mxPoint x="{px}" y="{py}"/>'
            geo += '</Array>'
        geo += '</mxGeometry>'
        self.cells.append(
            f'<mxCell id="{cid}" value="{esc(value)}" style="{style}" edge="1" parent="1">{geo}</mxCell>'
        )
        return cid

    def to_xml(self):
        body = "".join(self.cells)
        return (
            f'<diagram id="{esc(self.name)}" name="{esc(self.name)}">'
            f'<mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" '
            f'connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1654" pageHeight="1169" '
            f'math="0" shadow="0"><root>'
            f'<mxCell id="0"/><mxCell id="1" parent="0"/>'
            f'{body}</root></mxGraphModel></diagram>'
        )


def write_file(path, pages):
    xml = '<mxfile host="app.diagrams.net" type="device">'
    xml += "".join(p.to_xml() for p in pages)
    xml += "</mxfile>"
    with open(path, "w", encoding="utf-8") as f:
        f.write(xml)
    # validate well-formed
    ET.fromstring(xml)
    print("Wrote", os.path.abspath(path), "pages:", len(pages))


# ----------------------------------------------------------------------------
# STYLES
# ----------------------------------------------------------------------------
S_ACTOR = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#dae8fc;strokeColor=#6c8ebf;"
S_ACTOR2 = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#ffe6cc;strokeColor=#d79b00;"
S_USECASE = "ellipse;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;"
S_USECASE_INC = "ellipse;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#999999;dashed=1;"
S_BOUNDARY = "rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;fillColor=none;strokeColor=#5a5a5a;fontStyle=1;fontSize=14;align=center;"
S_PKG = "rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;fontSize=13;"
S_ASSOC = "endArrow=none;html=1;strokeColor=#333333;"
S_INCLUDE = "endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#2d6a4f;fontStyle=2;fontColor=#2d6a4f;"
S_EXTEND = "endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#9c5700;fontStyle=2;fontColor=#9c5700;"
S_GEN = "endArrow=block;endFill=0;html=1;strokeColor=#333333;"
S_DEP = "endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#666666;fontStyle=2;"

# Activity
S_INITIAL = "ellipse;html=1;fillColor=#000000;strokeColor=#000000;"
S_FINAL_OUT = "ellipse;html=1;fillColor=none;strokeColor=#000000;strokeWidth=2;"
S_FINAL_IN = "ellipse;html=1;fillColor=#000000;strokeColor=none;"
S_ACTION = "rounded=1;whiteSpace=wrap;html=1;arcSize=40;fillColor=#dae8fc;strokeColor=#6c8ebf;"
S_DECISION = "rhombus;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;"
S_BAR = "rounded=0;whiteSpace=wrap;html=1;fillColor=#000000;strokeColor=#000000;"
S_FLOW = "endArrow=open;html=1;strokeColor=#333333;rounded=0;"
S_FLOW_LBL = "endArrow=open;html=1;strokeColor=#333333;rounded=0;fontStyle=2;fontColor=#9c5700;"

# Sequence
def S_LIFELINE(participant=False):
    base = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=0;collapsible=0;recursiveResize=0;outlineConnect=0;"
    return base + ("fillColor=#dae8fc;strokeColor=#6c8ebf;" if participant else "fillColor=#f5f5f5;strokeColor=#666666;")
S_MSG = "html=1;verticalAlign=bottom;endArrow=block;rounded=0;strokeColor=#333333;"
S_MSG_ASYNC = "html=1;verticalAlign=bottom;endArrow=open;rounded=0;strokeColor=#333333;"
S_REPLY = "html=1;verticalAlign=bottom;endArrow=open;dashed=1;rounded=0;strokeColor=#333333;"
S_SELF = "html=1;verticalAlign=bottom;endArrow=block;rounded=0;strokeColor=#333333;"
S_FRAME = "shape=umlFrame;whiteSpace=wrap;html=1;width=80;height=24;fillColor=none;strokeColor=#9673a6;"
S_ACTBAR = "html=1;points=[];perimeter=orthogonalPerimeter;fillColor=#dae8fc;strokeColor=#6c8ebf;"


# ============================================================================
# 1) USE CASE MODEL
# ============================================================================

def page_usecase_overview():
    p = Page("2.1 Use Case Tổng Quát")
    # Actors (left)
    actors_left = [
        ("Guest", "Guest"), ("Customer", "Customer"), ("Driver", "Driver"),
    ]
    actors_right = [
        ("Technician", "Technician"), ("Admin", "Admin"),
    ]
    ext = [("VNPay", "Cổng VNPay"), ("Cron", "Bộ định thời (Cron)")]

    ay = 80
    aid = {}
    for key, label in actors_left:
        cid = p.vertex("ovA_" + key, label, S_ACTOR, 40, ay, 50, 90)
        aid[key] = cid
        ay += 150
    ay = 120
    for key, label in actors_right:
        cid = p.vertex("ovA_" + key, label, S_ACTOR, 1180, ay, 50, 90)
        aid[key] = cid
        ay += 220
    # external actors bottom-right
    ey = 620
    for key, label in ext:
        cid = p.vertex("ovA_" + key, label, S_ACTOR2, 1180, ey, 50, 90)
        aid[key] = cid
        ey += 170

    # System boundary
    p.vertex("ovBound", "HỆ THỐNG V-GREEN EV CHARGING", S_BOUNDARY, 200, 40, 900, 800)

    pkgs = [
        ("A", "A. Tài khoản & Xác thực"),
        ("B", "B. Tìm kiếm & Xem trạm"),
        ("C", "C. Đặt chỗ"),
        ("D", "D. Phiên sạc"),
        ("E", "E. Hóa đơn & Thanh toán"),
        ("F", "F. Ví điện tử & VNPay"),
        ("G", "G. Khách hàng thân thiết"),
        ("H", "H. Đánh giá trạm"),
        ("I", "I. Phương tiện"),
        ("J", "J. Thông báo"),
        ("K", "K. Bảo trì"),
        ("L", "L. Quản trị"),
    ]
    pid = {}
    cols = 2
    cw, ch = 360, 70
    gx, gy = 250, 90
    sx, sy = 60, 40
    for i, (key, label) in enumerate(pkgs):
        r = i // cols
        c = i % cols
        x = gx + c * (cw + sx)
        y = gy + r * (ch + sy)
        pid[key] = p.vertex("ovP_" + key, label, S_PKG, x, y, cw, ch)

    # associations
    def assoc(a, b):
        p.edge(p.nid("ovE"), "", S_ASSOC, aid[a], pid[b])

    for b in ["A", "B"]:
        assoc("Guest", b)
    for b in ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]:
        assoc("Customer", b)
    for b in ["C", "D", "E"]:
        assoc("Driver", b)
    assoc("Technician", "K"); assoc("Technician", "J")
    for b in ["L", "K", "B"]:
        assoc("Admin", b)
    # external dependencies
    p.edge(p.nid("ovE"), "«include»", S_DEP, pid["F"], aid["VNPay"])
    p.edge(p.nid("ovE"), "trigger", S_DEP, pid["C"], aid["Cron"])
    p.edge(p.nid("ovE"), "trigger", S_DEP, pid["J"], aid["Cron"])
    # generalization between actors
    p.edge(p.nid("ovG"), "«generalize»", S_GEN, aid["Customer"], aid["Guest"])
    p.edge(p.nid("ovG"), "«generalize»", S_GEN, aid["Driver"], aid["Customer"])
    return p


def page_usecase_package(title, actors, ucs, assocs, rels):
    """
    actors: list of (key, label, style)  -> style: 'p' primary / 's' secondary
    ucs:    list of (key, label, kind)    -> kind: 'uc' / 'inc'
    assocs: list of (actor_key, uc_key)
    rels:   list of (src_uc, dst_uc, type, label) type: include/extend/gen
    """
    p = Page(title)
    aid = {}
    # actors: split left/right by style
    left = [a for a in actors if a[2] != "s"]
    right = [a for a in actors if a[2] == "s"]
    ay = 80
    for key, label, st in left:
        style = S_ACTOR
        cid = p.vertex("a_" + key, label, style, 40, ay, 50, 90)
        aid[key] = cid
        ay += 170
    ay = 80
    for key, label, st in right:
        cid = p.vertex("a_" + key, label, S_ACTOR2, 980, ay, 50, 90)
        aid[key] = cid
        ay += 170

    # boundary
    n = len(ucs)
    rows = (n + 1) // 2
    bx, by = 200, 40
    bw, bh = 720, max(rows * 110 + 60, 220)
    p.vertex("bnd", title.split(" ", 1)[-1], S_BOUNDARY, bx, by, bw, bh)

    uid = {}
    uw, uh = 280, 64
    colx = [bx + 60, bx + 60 + uw + 100]
    starty = by + 60
    for i, (key, label, kind) in enumerate(ucs):
        r = i // 2
        c = i % 2
        x = colx[c]
        y = starty + r * 100
        style = S_USECASE if kind == "uc" else S_USECASE_INC
        uid[key] = p.vertex("u_" + key, label, style, x, y, uw, uh)

    for (akey, ukey) in assocs:
        if akey in aid and ukey in uid:
            p.edge(p.nid("e"), "", S_ASSOC, aid[akey], uid[ukey])

    for (s, d, t, lbl) in rels:
        if s not in uid or d not in uid:
            continue
        if t == "include":
            p.edge(p.nid("r"), lbl or "«include»", S_INCLUDE, uid[s], uid[d])
        elif t == "extend":
            p.edge(p.nid("r"), lbl or "«extend»", S_EXTEND, uid[s], uid[d])
        else:
            p.edge(p.nid("r"), lbl or "«generalize»", S_GEN, uid[s], uid[d])
    return p


def build_usecase_file():
    pages = [page_usecase_overview()]

    # A
    pages.append(page_usecase_package(
        "2.2 Gói A — Tài khoản & Xác thực",
        [("Guest", "Guest", "p"), ("User", "Người dùng đã ĐN", "p")],
        [("A1", "A1. Đăng ký tài khoản", "uc"), ("A2", "A2. Đăng nhập", "uc"),
         ("A3", "A3. Đăng xuất", "uc"), ("A4", "A4. Quên mật khẩu", "uc"),
         ("A5", "A5. Đặt lại mật khẩu", "uc"), ("A6", "A6. Đổi mật khẩu", "uc"),
         ("A7", "A7. Xem hồ sơ (me)", "uc"), ("A8", "A8. Cập nhật hồ sơ / giao diện", "uc"),
         ("A41", "Tạo resetToken", "inc"), ("A51", "Kiểm tra hạn token", "inc")],
        [("Guest", "A1"), ("Guest", "A2"), ("Guest", "A4"), ("Guest", "A5"),
         ("User", "A3"), ("User", "A6"), ("User", "A7"), ("User", "A8")],
        [("A4", "A41", "include", "«include»"), ("A5", "A51", "include", "«include»")],
    ))

    # B
    pages.append(page_usecase_package(
        "2.3 Gói B — Tìm kiếm & Xem trạm sạc",
        [("Guest", "Guest", "p"), ("Customer", "Customer", "p")],
        [("B1", "B1. Xem danh sách trạm", "uc"), ("B2", "B2. Xem bản đồ trạm (Leaflet)", "uc"),
         ("B3", "B3. Tìm trạm gần đây", "uc"), ("B4", "B4. Gợi ý trạm", "uc"),
         ("B5", "B5. Xem chi tiết trạm", "uc"), ("B6", "B6. Xem danh sách trụ", "uc"),
         ("B7", "B7. Trạng thái trụ thời gian thực", "uc"),
         ("B8", "B8. Lọc connector/công suất/khoảng cách", "uc"),
         ("B9", "B9. Quét QR trụ sạc", "uc")],
        [("Guest", "B1"), ("Guest", "B2"), ("Guest", "B5"),
         ("Customer", "B3"), ("Customer", "B4"), ("Customer", "B6"),
         ("Customer", "B7"), ("Customer", "B8"), ("Customer", "B9")],
        [("B1", "B8", "extend", "«extend»"), ("B5", "B6", "include", "«include»")],
    ))

    # C
    pages.append(page_usecase_package(
        "2.4 Gói C — Đặt chỗ",
        [("Customer", "Customer / Driver", "p"), ("Admin", "Admin", "p"),
         ("Cron", "Cron", "s")],
        [("C1", "C1. Tạo đặt chỗ (1 lần)", "uc"), ("C2", "C2. Đặt chỗ lặp lại", "uc"),
         ("C3", "C3. Xem danh sách đặt chỗ", "uc"), ("C4", "C4. Xem chi tiết đặt chỗ", "uc"),
         ("C5", "C5. Hủy đặt chỗ", "uc"), ("C6", "C6. Check-in tại trạm", "uc"),
         ("C7", "C7. Tự động hủy quá hạn 15'", "uc"), ("C8", "C8. Nhắc lịch sạc", "uc"),
         ("C9", "C9. Kiểm tra trùng khung giờ", "inc")],
        [("Customer", "C1"), ("Customer", "C2"), ("Customer", "C3"), ("Customer", "C4"),
         ("Customer", "C5"), ("Customer", "C6"), ("Admin", "C3"),
         ("Cron", "C7"), ("Cron", "C8")],
        [("C1", "C9", "include", "«include»")],
    ))

    # D
    pages.append(page_usecase_package(
        "2.5 Gói D — Phiên sạc",
        [("Customer", "Customer / Driver", "p")],
        [("D1", "D1. Bắt đầu phiên sạc", "uc"), ("D2", "D2. Xem phiên đang sạc", "uc"),
         ("D3", "D3. Kết thúc phiên (stop)", "uc"), ("D4", "D4. Kết thúc phiên (end)", "uc"),
         ("D5", "D5. Xem lịch sử phiên sạc", "uc"), ("D6", "D6. Xem thống kê phiên", "uc"),
         ("D7", "D7. Tính điện năng & cước", "inc"), ("D8", "D8. Lập hóa đơn tự động", "inc"),
         ("D9", "D9. Áp chiết khấu fleet", "inc"), ("D10", "D10. Cộng điểm thưởng", "inc")],
        [("Customer", "D1"), ("Customer", "D2"), ("Customer", "D3"),
         ("Customer", "D4"), ("Customer", "D5"), ("Customer", "D6")],
        [("D3", "D7", "include", "«include»"), ("D3", "D8", "include", "«include»"),
         ("D3", "D9", "include", "«include»"), ("D3", "D10", "include", "«include»"),
         ("D4", "D7", "include", "«include»"), ("D4", "D8", "include", "«include»")],
    ))

    # E
    pages.append(page_usecase_package(
        "2.6 Gói E — Hóa đơn & Thanh toán",
        [("Customer", "Customer / Driver", "p")],
        [("E1", "E1. Xem danh sách hóa đơn", "uc"), ("E2", "E2. Xem chi tiết hóa đơn", "uc"),
         ("E3", "E3. Thanh toán bằng ví", "uc"), ("E4", "E4. Áp dụng voucher", "inc"),
         ("E5", "E5. Kiểm tra hợp lệ voucher", "inc"), ("E6", "E6. Tải hóa đơn PDF", "uc")],
        [("Customer", "E1"), ("Customer", "E2"), ("Customer", "E3"), ("Customer", "E6")],
        [("E3", "E4", "extend", "«extend»"), ("E4", "E5", "include", "«include»")],
    ))

    # F
    pages.append(page_usecase_package(
        "2.7 Gói F — Ví điện tử & VNPay",
        [("Customer", "Customer / Driver", "p"), ("VNPay", "Cổng VNPay", "s")],
        [("F1", "F1. Xem số dư & lịch sử ví", "uc"), ("F2", "F2. Nạp tiền thủ công (demo)", "uc"),
         ("F3", "F3. Tạo giao dịch nạp VNPay", "uc"), ("F4", "F4. Xử lý Return URL", "uc"),
         ("F5", "F5. Xử lý IPN (server-server)", "uc"), ("F6", "F6. Cộng tiền vào ví", "inc"),
         ("F7", "F7. Đối soát chữ ký & số tiền", "inc")],
        [("Customer", "F1"), ("Customer", "F2"), ("Customer", "F3"),
         ("VNPay", "F4"), ("VNPay", "F5")],
        [("F4", "F7", "include", "«include»"), ("F5", "F7", "include", "«include»"),
         ("F4", "F6", "include", "«include»"), ("F5", "F6", "include", "«include»")],
    ))

    # G
    pages.append(page_usecase_package(
        "2.8 Gói G — Khách hàng thân thiết",
        [("Customer", "Customer / Driver", "p"), ("Admin", "Admin", "p")],
        [("G1", "G1. Xem điểm & hạng thành viên", "uc"), ("G2", "G2. Tích điểm khi thanh toán", "uc"),
         ("G3", "G3. Đổi điểm lấy tiền vào ví", "uc"), ("G4", "G4. Xem lịch sử điểm", "uc"),
         ("G5", "G5. Tự động nâng/giữ hạng", "inc"), ("G6", "G6. Admin xem/điều chỉnh điểm", "uc")],
        [("Customer", "G1"), ("Customer", "G3"), ("Customer", "G4"), ("Admin", "G6")],
        [("G2", "G5", "include", "«include»")],
    ))

    # H
    pages.append(page_usecase_package(
        "2.9 Gói H — Đánh giá trạm",
        [("Customer", "Customer", "p"), ("Admin", "Admin", "p")],
        [("H1", "H1. Xem đánh giá của trạm", "uc"), ("H2", "H2. Gửi/sửa đánh giá (1-5 sao)", "uc"),
         ("H3", "H3. Kiểm tra đã từng sạc", "inc"), ("H4", "H4. Cập nhật rating trung bình", "inc"),
         ("H5", "H5. Admin duyệt/xóa đánh giá", "uc")],
        [("Customer", "H1"), ("Customer", "H2"), ("Admin", "H5")],
        [("H2", "H3", "include", "«include»"), ("H2", "H4", "include", "«include»")],
    ))

    # I
    pages.append(page_usecase_package(
        "2.10 Gói I — Phương tiện",
        [("Customer", "Customer / Driver", "p")],
        [("I1", "I1. Xem danh sách xe", "uc"), ("I2", "I2. Thêm xe", "uc"),
         ("I3", "I3. Sửa thông tin xe", "uc"), ("I4", "I4. Xóa/ngừng xe", "uc"),
         ("I5", "I5. Liên kết xe với fleet", "uc")],
        [("Customer", "I1"), ("Customer", "I2"), ("Customer", "I3"),
         ("Customer", "I4"), ("Customer", "I5")],
        [],
    ))

    # J
    pages.append(page_usecase_package(
        "2.11 Gói J — Thông báo",
        [("Customer", "Customer", "p"), ("Tech", "Technician", "p"),
         ("Cron", "Cron", "s"), ("Push", "Web Push", "s")],
        [("J1", "J1. Xem danh sách thông báo", "uc"), ("J2", "J2. Đánh dấu đã đọc", "uc"),
         ("J3", "J3. Đăng ký Push (subscribe)", "uc"), ("J4", "J4. Gửi thông báo hệ thống", "uc"),
         ("J5", "J5. Gửi Push test", "uc")],
        [("Customer", "J1"), ("Customer", "J2"), ("Customer", "J3"),
         ("Tech", "J1"), ("Cron", "J4"), ("Push", "J4"), ("Push", "J5")],
        [],
    ))

    # K
    pages.append(page_usecase_package(
        "2.12 Gói K — Bảo trì",
        [("Admin", "Admin", "p"), ("Tech", "Technician", "p")],
        [("K1", "K1. Tạo phiếu bảo trì", "uc"), ("K2", "K2. Phân công kỹ thuật viên", "uc"),
         ("K3", "K3. Xem danh sách phiếu", "uc"), ("K4", "K4. Cập nhật trạng thái phiếu", "uc"),
         ("K5", "K5. Đóng phiếu (RESOLVED)", "uc"), ("K6", "K6. Khóa trụ (MAINTENANCE)", "inc"),
         ("K7", "K7. Mở lại trụ (AVAILABLE)", "inc")],
        [("Admin", "K1"), ("Admin", "K2"), ("Admin", "K3"),
         ("Tech", "K3"), ("Tech", "K4"), ("Tech", "K5")],
        [("K1", "K6", "include", "«include»"), ("K1", "K2", "extend", "«extend»"),
         ("K5", "K7", "include", "«include»")],
    ))

    # L
    pages.append(page_usecase_package(
        "2.13 Gói L — Quản trị",
        [("Admin", "Admin", "p")],
        [("L1", "L1. Bảng điều khiển & thống kê", "uc"), ("L2", "L2. Quản lý trạm & trụ", "uc"),
         ("L3", "L3. Quản lý người dùng & vai trò", "uc"), ("L4", "L4. Quản lý biểu giá (tariff)", "uc"),
         ("L5", "L5. Quản lý voucher", "uc"), ("L6", "L6. Quản lý đội xe (fleet)", "uc"),
         ("L7", "L7. Báo cáo doanh thu", "uc"), ("L8", "L8. Theo dõi thanh toán", "uc"),
         ("L9", "L9. Quản lý loyalty", "uc"), ("L10", "L10. Duyệt đánh giá", "uc")],
        [("Admin", "L1"), ("Admin", "L2"), ("Admin", "L3"), ("Admin", "L4"), ("Admin", "L5"),
         ("Admin", "L6"), ("Admin", "L7"), ("Admin", "L8"), ("Admin", "L9"), ("Admin", "L10")],
        [],
    ))

    write_file(os.path.join(OUT_DIR, "01-UseCaseModel.drawio"), pages)


# ============================================================================
# 2) ACTIVITY DIAGRAMS
#    Mô hình node-list + edge-list, tự xếp theo lưới dọc.
#    node kinds: initial, final, action, decision, fork, join
# ============================================================================

class Activity:
    def __init__(self, title):
        self.title = title
        self.nodes = {}   # key -> (kind, label, x, y, w, h)
        self.edges = []   # (src, dst, label, points)

    def add(self, key, kind, label, x, y, w=None, h=None):
        if kind == "initial":
            w, h = (30, 30)
        elif kind == "final":
            w, h = (34, 34)
        elif kind == "decision":
            w, h = (w or 120, h or 70)
        elif kind in ("fork", "join"):
            w, h = (w or 180, h or 12)
        else:  # action
            w, h = (w or 200, h or 50)
        self.nodes[key] = (kind, label, x, y, w, h)

    def link(self, src, dst, label="", points=None):
        self.edges.append((src, dst, label, points))

    def render(self):
        p = Page(self.title)
        # title banner
        p.vertex("title", self.title, "text;html=1;fontSize=15;fontStyle=1;align=left;verticalAlign=middle;",
                 40, 10, 1000, 30)
        idmap = {}
        for key, (kind, label, x, y, w, h) in self.nodes.items():
            cid = "ac_" + key
            idmap[key] = cid
            if kind == "initial":
                p.vertex(cid, "", S_INITIAL, x, y, w, h)
            elif kind == "final":
                p.vertex(cid, "", S_FINAL_OUT, x, y, w, h)
                p.vertex(cid + "_in", "", S_FINAL_IN, x + 7, y + 7, w - 14, h - 14)
            elif kind == "decision":
                p.vertex(cid, label, S_DECISION, x, y, w, h)
            elif kind in ("fork", "join"):
                p.vertex(cid, "", S_BAR, x, y, w, h)
            else:
                p.vertex(cid, label, S_ACTION, x, y, w, h)
        for (src, dst, label, points) in self.edges:
            style = S_FLOW_LBL if label else S_FLOW
            p.edge(p.nid("f"), label, style, idmap[src], idmap[dst], points)
        return p


def act_login():
    a = Activity("3.1 Activity — Đăng ký & Đăng nhập")
    a.add("init", "initial", "", 300, 60)
    a.add("d0", "decision", "Đã có tài khoản?", 250, 130)
    a.add("reg", "action", "Nhập email, mật khẩu, tên, SĐT", 40, 250)
    a.add("dmail", "decision", "Email đã tồn tại?", 70, 350)
    a.add("hash", "action", "Băm mật khẩu (bcrypt)", 50, 470)
    a.add("create", "action", "Tạo tài khoản role=CUSTOMER", 50, 560)
    a.add("login", "action", "Nhập email + mật khẩu", 430, 470)
    a.add("dlogin", "decision", "Đúng thông tin?", 450, 570)
    a.add("jwt", "action", "Phát hành JWT + set cookie ev_token", 420, 690)
    a.add("home", "action", "Điều hướng theo vai trò", 440, 780)
    a.add("fin", "final", "", 510, 880)
    a.link("init", "d0")
    a.link("d0", "reg", "[chưa có TK]")
    a.link("d0", "login", "[đã có TK]")
    a.link("reg", "dmail")
    a.link("dmail", "reg", "[email đã tồn tại]")
    a.link("dmail", "hash", "[hợp lệ]")
    a.link("hash", "create")
    a.link("create", "login")
    a.link("login", "dlogin")
    a.link("dlogin", "login", "[sai email/MK]")
    a.link("dlogin", "jwt", "[hợp lệ]")
    a.link("jwt", "home")
    a.link("home", "fin")
    return a


def act_core():
    a = Activity("3.2 Activity — Đặt chỗ → Check-in → Phiên sạc → Hóa đơn")
    a.add("init", "initial", "", 360, 50)
    a.add("find", "action", "Tìm & chọn trạm/trụ + khung giờ", 270, 110)
    a.add("dconf", "decision", "Trùng khung giờ?", 300, 200)
    a.add("create", "action", "Tạo đặt chỗ (PENDING)", 290, 320)
    a.add("wait", "action", "Chờ đến giờ sạc", 290, 400)
    a.add("dlate", "decision", "Quá 15 phút?", 300, 480)
    a.add("cancel", "action", "Tự động hủy (CANCELLED) + thông báo", 40, 500)
    a.add("finc", "final", "", 110, 600)
    a.add("checkin", "action", "Check-in tại trạm → CONFIRMED", 280, 600)
    a.add("session", "action", "Tạo phiên sạc (ACTIVE) + trụ OCCUPIED", 280, 680)
    a.add("charge", "action", "Đang sạc", 300, 760)
    a.add("stop", "action", "Kết thúc phiên", 300, 835)
    a.add("kwh", "action", "Tính kWh = công suất × thời gian × hiệu suất", 270, 910)
    a.add("rate", "action", "Lấy biểu giá theo giờ", 290, 985)
    a.add("dfleet", "decision", "Thuộc fleet?", 300, 1060)
    a.add("disc", "action", "Giảm theo chiết khấu fleet", 60, 1075)
    a.add("amount", "action", "amount = subtotal − giảm giá", 280, 1175)
    a.add("fork", "fork", "", 250, 1260, 320, 12)
    a.add("inv", "action", "Lập hóa đơn + trụ AVAILABLE", 60, 1310)
    a.add("pts", "action", "Cộng điểm + cập nhật hạng", 300, 1310)
    a.add("noti", "action", "Gửi thông báo", 560, 1310)
    a.add("join", "join", "", 250, 1400, 320, 12)
    a.add("pay", "action", "Chuyển sang thanh toán hóa đơn", 280, 1450)
    a.add("fin", "final", "", 350, 1540)
    a.link("init", "find")
    a.link("find", "dconf")
    a.link("dconf", "find", "[trùng giờ]")
    a.link("dconf", "create", "[còn trống]")
    a.link("create", "wait")
    a.link("wait", "dlate")
    a.link("dlate", "cancel", "[quá 15']")
    a.link("cancel", "finc")
    a.link("dlate", "checkin", "[đúng giờ]")
    a.link("checkin", "session")
    a.link("session", "charge")
    a.link("charge", "stop")
    a.link("stop", "kwh")
    a.link("kwh", "rate")
    a.link("rate", "dfleet")
    a.link("dfleet", "disc", "[thuộc fleet]")
    a.link("disc", "amount")
    a.link("dfleet", "amount", "[không]")
    a.link("amount", "fork")
    a.link("fork", "inv")
    a.link("fork", "pts")
    a.link("fork", "noti")
    a.link("inv", "join")
    a.link("pts", "join")
    a.link("noti", "join")
    a.link("join", "pay")
    a.link("pay", "fin")
    return a


def act_payment():
    a = Activity("3.3 Activity — Thanh toán hóa đơn bằng ví + Voucher")
    a.add("init", "initial", "", 320, 50)
    a.add("open", "action", "Mở hóa đơn (UNPAID)", 250, 110)
    a.add("dvc", "decision", "Có nhập voucher?", 270, 195)
    a.add("ktvc", "action", "Kiểm tra voucher (hạn, hạn mức, số lần)", 30, 215)
    a.add("dvok", "decision", "Voucher hợp lệ?", 60, 320)
    a.add("errv", "action", "Báo lỗi voucher", 30, 440)
    a.add("giam", "action", "Tính giảm giá → finalAmount", 250, 440)
    a.add("chon", "action", "Chọn phương thức = Ví", 270, 540)
    a.add("dbal", "decision", "Đủ số dư?", 290, 620)
    a.add("thieu", "action", "Báo số dư không đủ → gợi ý nạp tiền", 540, 630)
    a.add("fin2", "final", "", 620, 740)
    a.add("tru", "action", "Trừ ví + ghi WalletTransaction", 250, 740)
    a.add("paid", "action", "Hóa đơn = PAID (lưu phương thức/voucher)", 240, 820)
    a.add("dvc2", "decision", "Có voucher?", 290, 900)
    a.add("ghivc", "action", "Tăng usedCount + ghi VoucherUsage", 40, 920)
    a.add("done", "action", "Thanh toán thành công", 270, 1020)
    a.add("fin", "final", "", 340, 1110)
    a.link("init", "open")
    a.link("open", "dvc")
    a.link("dvc", "ktvc", "[có voucher]")
    a.link("dvc", "chon", "[không]")
    a.link("ktvc", "dvok")
    a.link("dvok", "errv", "[không hợp lệ]")
    a.link("dvok", "giam", "[hợp lệ]")
    a.link("errv", "chon")
    a.link("giam", "chon")
    a.link("chon", "dbal")
    a.link("dbal", "thieu", "[số dư < finalAmount]")
    a.link("thieu", "fin2")
    a.link("dbal", "tru", "[đủ số dư]")
    a.link("tru", "paid")
    a.link("paid", "dvc2")
    a.link("dvc2", "ghivc", "[có voucher]")
    a.link("dvc2", "done", "[không]")
    a.link("ghivc", "done")
    a.link("done", "fin")
    return a


def act_vnpay():
    a = Activity("3.4 Activity — Nạp tiền qua VNPay (2 kênh song song)")
    a.add("init", "initial", "", 360, 50)
    a.add("nhap", "action", "Nhập số tiền nạp", 300, 110)
    a.add("damt", "decision", "Số tiền hợp lệ?", 300, 190)
    a.add("pay", "action", "Tạo Payment (PENDING) + txnRef", 290, 310)
    a.add("url", "action", "Dựng URL VNPay (có chữ ký)", 290, 390)
    a.add("ttvn", "action", "Người dùng thanh toán tại VNPay", 290, 470)
    a.add("fork", "fork", "", 230, 560, 420, 12)
    a.add("ret", "action", "Return: xác thực chữ ký", 60, 610)
    a.add("dret", "decision", "Return hợp lệ & OK?", 60, 700)
    a.add("retc", "action", "Cộng ví + giao dịch + thông báo (success)", 40, 820)
    a.add("retl", "action", "Điều hướng /wallet?status=lỗi", 300, 820)
    a.add("ipn", "action", "IPN: xác thực chữ ký + đối soát số tiền", 540, 610)
    a.add("dipn", "decision", "IPN hợp lệ & OK?", 560, 700)
    a.add("ipnc", "action", "Cộng ví + giao dịch (RspCode 00)", 540, 820)
    a.add("ipnl", "action", "Trả RspCode lỗi", 800, 820)
    a.add("join", "join", "", 230, 930, 420, 12)
    a.add("fin", "final", "", 420, 980)
    a.link("init", "nhap")
    a.link("nhap", "damt")
    a.link("damt", "nhap", "[ngoài hạn mức]")
    a.link("damt", "pay", "[hợp lệ]")
    a.link("pay", "url")
    a.link("url", "ttvn")
    a.link("ttvn", "fork")
    a.link("fork", "ret")
    a.link("fork", "ipn")
    a.link("ret", "dret")
    a.link("dret", "retc", "[hợp lệ & OK]")
    a.link("dret", "retl", "[sai/đã xử lý]")
    a.link("ipn", "dipn")
    a.link("dipn", "ipnc", "[hợp lệ & OK]")
    a.link("dipn", "ipnl", "[sai/đã cập nhật]")
    a.link("retc", "join")
    a.link("retl", "join")
    a.link("ipnc", "join")
    a.link("ipnl", "join")
    a.link("join", "fin")
    return a


def act_redeem():
    a = Activity("3.5 Activity — Đổi điểm thưởng lấy tiền")
    a.add("init", "initial", "", 320, 50)
    a.add("nhap", "action", "Nhập số điểm muốn đổi", 250, 110)
    a.add("drule", "decision", "≥100 & bội số 100?", 270, 190)
    a.add("dbal", "decision", "Đủ điểm?", 280, 320)
    a.add("tru", "action", "Trừ điểm + ghi LoyaltyTransaction (REDEEM)", 240, 440)
    a.add("val", "action", "value = điểm × 100 VND", 270, 520)
    a.add("cong", "action", "Cộng ví + ghi WalletTransaction (REFUND)", 245, 600)
    a.add("show", "action", "Hiển thị số dư & điểm còn lại", 270, 680)
    a.add("fin", "final", "", 340, 770)
    a.link("init", "nhap")
    a.link("nhap", "drule")
    a.link("drule", "nhap", "[không hợp lệ]")
    a.link("drule", "dbal", "[hợp lệ]")
    a.link("dbal", "nhap", "[không đủ điểm]")
    a.link("dbal", "tru", "[đủ điểm]")
    a.link("tru", "val")
    a.link("val", "cong")
    a.link("cong", "show")
    a.link("show", "fin")
    return a


def act_review():
    a = Activity("3.6 Activity — Đánh giá trạm")
    a.add("init", "initial", "", 320, 50)
    a.add("chon", "action", "Chọn trạm để đánh giá", 250, 110)
    a.add("drate", "decision", "Rating 1–5 hợp lệ?", 270, 190)
    a.add("dused", "decision", "Đã có phiên COMPLETED?", 270, 320)
    a.add("baochua", "action", "Báo: cần ≥1 phiên sạc hoàn tất", 540, 330)
    a.add("fin2", "final", "", 620, 440)
    a.add("upsert", "action", "Tạo/cập nhật review (verified)", 250, 450)
    a.add("recalc", "action", "Tính lại rating TB + reviewCount", 250, 530)
    a.add("show", "action", "Hiển thị đánh giá", 270, 610)
    a.add("fin", "final", "", 340, 700)
    a.link("init", "chon")
    a.link("chon", "drate")
    a.link("drate", "chon", "[ngoài 1–5]")
    a.link("drate", "dused", "[hợp lệ]")
    a.link("dused", "baochua", "[chưa sạc]")
    a.link("baochua", "fin2")
    a.link("dused", "upsert", "[đã sạc]")
    a.link("upsert", "recalc")
    a.link("recalc", "show")
    a.link("show", "fin")
    return a


def act_maintenance():
    a = Activity("3.7 Activity — Quy trình bảo trì")
    a.add("init", "initial", "", 320, 50)
    a.add("tao", "action", "Admin: tạo phiếu bảo trì (OPEN)", 250, 110)
    a.add("dtru", "decision", "Gắn trụ cụ thể?", 270, 195)
    a.add("khoa", "action", "Trụ → MAINTENANCE", 40, 215)
    a.add("dpc", "decision", "Phân công kỹ thuật viên?", 260, 320)
    a.add("gui", "action", "Gửi thông báo cho kỹ thuật viên", 40, 340)
    a.add("cho", "action", "Phiếu chờ phân công", 520, 340)
    a.add("xuly", "action", "Kỹ thuật viên xử lý (IN_PROGRESS)", 250, 450)
    a.add("dsua", "decision", "Đã sửa xong?", 280, 530)
    a.add("dong", "action", "Đóng phiếu (RESOLVED) + resolvedAt", 245, 650)
    a.add("dtru2", "decision", "Phiếu gắn trụ?", 270, 730)
    a.add("motru", "action", "Trụ → AVAILABLE, xóa lastError", 40, 750)
    a.add("done", "action", "Hoàn tất", 280, 850)
    a.add("fin", "final", "", 350, 930)
    a.link("init", "tao")
    a.link("tao", "dtru")
    a.link("dtru", "khoa", "[gắn trụ]")
    a.link("khoa", "dpc")
    a.link("dtru", "dpc", "[không]")
    a.link("dpc", "gui", "[có phân công]")
    a.link("dpc", "cho", "[chưa]")
    a.link("gui", "xuly")
    a.link("cho", "xuly")
    a.link("xuly", "dsua")
    a.link("dsua", "xuly", "[chưa xong]")
    a.link("dsua", "dong", "[xong]")
    a.link("dong", "dtru2")
    a.link("dtru2", "motru", "[gắn trụ]")
    a.link("motru", "done")
    a.link("dtru2", "done", "[không]")
    a.link("done", "fin")
    return a


def act_cron():
    a = Activity("3.8 Activity — Tự động hủy đặt chỗ quá hạn (Cron)")
    a.add("init", "initial", "", 320, 50)
    a.add("run", "action", "Cron chạy mỗi 1 phút", 250, 110)
    a.add("moc", "action", "Tính mốc = now − 15 phút", 250, 190)
    a.add("lay", "action", "Lấy reservation PENDING (startTime ≤ mốc)", 230, 270)
    a.add("dloop", "decision", "Còn phiếu chưa xử lý?", 270, 360)
    a.add("huy", "action", "Cập nhật CANCELLED", 40, 380)
    a.add("tb", "action", "Tạo thông báo WARNING", 40, 470)
    a.add("kq", "action", "Trả về số lượng đã hủy", 270, 490)
    a.add("fin", "final", "", 340, 580)
    a.link("init", "run")
    a.link("run", "moc")
    a.link("moc", "lay")
    a.link("lay", "dloop")
    a.link("dloop", "huy", "[còn phiếu]")
    a.link("huy", "tb")
    a.link("tb", "dloop")
    a.link("dloop", "kq", "[hết phiếu]")
    a.link("kq", "fin")
    return a


def build_activity_file():
    acts = [act_login(), act_core(), act_payment(), act_vnpay(),
            act_redeem(), act_review(), act_maintenance(), act_cron()]
    pages = [a.render() for a in acts]
    write_file(os.path.join(OUT_DIR, "02-ActivityDiagrams.drawio"), pages)


# ============================================================================
# 3) SEQUENCE DIAGRAMS
# ============================================================================

class Sequence:
    def __init__(self, title):
        self.title = title
        self.parts = []      # (key, label, is_actor)
        self.items = []      # ordered list of events
        self.frames = []     # (kind, label, from_part, to_part, y_top, y_bot)
        self.notes = []      # (label, from_part, to_part, y)
        self.y = 120
        self.top = 60
        self.x0 = 60
        self.gap = 230

    def actor(self, key, label):
        self.parts.append((key, label, True))

    def part(self, key, label):
        self.parts.append((key, label, False))

    def step(self, dy=55):
        self.y += dy

    def msg(self, src, dst, label, kind="sync"):
        self.items.append(("msg", src, dst, label, kind, self.y))
        self.step()

    def reply(self, src, dst, label):
        self.items.append(("msg", src, dst, label, "reply", self.y))
        self.step()

    def selfmsg(self, src, label):
        self.items.append(("self", src, src, label, "self", self.y))
        self.step(60)

    def frame(self, kind, label, parts_span, y_top, y_bot):
        self.frames.append((kind, label, parts_span, y_top, y_bot))

    def note(self, label, span, y):
        self.notes.append((label, span, y))

    def xof(self, key):
        for i, (k, _, _) in enumerate(self.parts):
            if k == key:
                return self.x0 + i * self.gap
        raise KeyError(key)

    def render(self):
        p = Page(self.title)
        p.vertex("title", self.title, "text;html=1;fontSize=15;fontStyle=1;align=left;verticalAlign=middle;",
                 40, 10, 1100, 30)
        bottom = self.y + 40
        # frames first (background)
        for (kind, label, span, y_top, y_bot) in self.frames:
            xs = [self.xof(k) for k in span]
            x_left = min(xs) - 90
            x_right = max(xs) + 90
            p.vertex(p.nid("fr"), kind.upper() + (("  " + label) if label else ""),
                     S_FRAME, x_left, y_top, x_right - x_left, y_bot - y_top)
        # notes
        for (label, span, y) in self.notes:
            xs = [self.xof(k) for k in span]
            x_left = min(xs) - 80
            x_right = max(xs) + 80
            p.vertex(p.nid("nt"), label,
                     "shape=note;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;align=left;",
                     x_left, y, x_right - x_left, 40)
        # lifelines
        for (k, label, is_actor) in self.parts:
            x = self.xof(k)
            style = S_LIFELINE(participant=not is_actor)
            if is_actor:
                # actor head + lifeline
                p.vertex("ll_" + k, label, S_ACTOR, x - 15, self.top, 30, 60)
                p.cells.append(
                    f'<mxCell id="lldash_{k}" value="" '
                    f'style="endArrow=none;dashed=1;html=1;strokeColor=#666666;" edge="1" parent="1">'
                    f'<mxGeometry relative="1" as="geometry">'
                    f'<mxPoint x="{x}" y="{self.top+60}" as="sourcePoint"/>'
                    f'<mxPoint x="{x}" y="{bottom}" as="targetPoint"/>'
                    f'</mxGeometry></mxCell>'
                )
            else:
                p.cells.append(
                    f'<mxCell id="ll_{k}" value="{esc(label)}" style="{style}" vertex="1" parent="1">'
                    f'<mxGeometry x="{x-70}" y="{self.top}" width="140" height="{bottom-self.top}" as="geometry"/></mxCell>'
                )
        # messages
        for ev in self.items:
            typ = ev[0]
            if typ == "self":
                _, src, dst, label, kind, y = ev
                x = self.xof(src)
                p.free_edge(p.nid("m"), label, S_SELF, x, y, x, y + 40,
                            points=[(x + 60, y), (x + 60, y + 40)])
            else:
                _, src, dst, label, kind, y = ev
                xs = self.xof(src)
                xd = self.xof(dst)
                style = {"sync": S_MSG, "async": S_MSG_ASYNC, "reply": S_REPLY}[kind]
                p.free_edge(p.nid("m"), label, style, xs, y, xd, y)
        return p


def seq_login():
    s = Sequence("4.1 Sequence — Đăng nhập")
    s.actor("U", "Người dùng")
    s.part("App", "Ứng dụng")
    s.part("Sys", "Hệ thống")
    s.part("DB", "Cơ sở dữ liệu")
    s.y = 140
    s.msg("U", "App", "Nhập email và mật khẩu")
    s.msg("App", "Sys", "Gửi yêu cầu đăng nhập")
    s.msg("Sys", "DB", "Tìm tài khoản theo email")
    s.reply("DB", "Sys", "Trả về tài khoản (nếu có)")
    f_top = s.y - 10
    s.step(40)
    s.reply("Sys", "App", "[sai] Báo đăng nhập thất bại")
    s.reply("App", "U", "Hiển thị thông báo lỗi")
    s.selfmsg("Sys", "[đúng] Kiểm tra mật khẩu, tạo phiên đăng nhập")
    s.reply("Sys", "App", "Đăng nhập thành công")
    s.msg("App", "U", "Mở trang chính theo vai trò")
    s.frame("alt", "sai / đúng thông tin", ["App", "DB"], f_top, s.y + 10)
    return s.render()


def seq_reserve():
    s = Sequence("4.2 Sequence — Đặt chỗ trạm sạc")
    s.actor("U", "Người dùng")
    s.part("App", "Ứng dụng")
    s.part("Sys", "Hệ thống")
    s.part("DB", "Cơ sở dữ liệu")
    s.y = 140
    s.msg("U", "App", "Chọn trụ sạc và khung giờ")
    s.msg("App", "Sys", "Gửi yêu cầu đặt chỗ")
    s.msg("Sys", "DB", "Kiểm tra trụ có bị đặt trùng giờ")
    s.reply("DB", "Sys", "Trả về kết quả kiểm tra")
    f_top = s.y - 10
    s.step(40)
    s.reply("Sys", "App", "[trùng giờ] Báo trùng")
    s.msg("App", "U", "Đề nghị chọn giờ khác")
    s.msg("Sys", "DB", "[còn trống] Lưu đặt chỗ (chờ check-in)")
    s.reply("Sys", "App", "Đặt chỗ thành công")
    s.msg("App", "U", "Hiển thị thông tin đặt chỗ")
    s.frame("alt", "đã có người đặt / còn trống", ["App", "DB"], f_top, s.y + 10)
    return s.render()


def seq_checkin():
    s = Sequence("4.3 Sequence — Check-in và bắt đầu sạc")
    s.actor("U", "Người dùng")
    s.part("App", "Ứng dụng")
    s.part("Sys", "Hệ thống")
    s.part("DB", "Cơ sở dữ liệu")
    s.y = 140
    s.msg("U", "App", "Quét mã QR tại trụ để check-in")
    s.msg("App", "Sys", "Gửi yêu cầu check-in")
    s.msg("Sys", "DB", "Lấy thông tin đặt chỗ")
    s.reply("DB", "Sys", "Trả về đặt chỗ")
    f_top = s.y - 10
    s.step(40)
    s.msg("Sys", "DB", "[quá 15 phút] Hủy đặt chỗ")
    s.reply("Sys", "App", "Báo đã hủy do quá giờ")
    s.msg("Sys", "DB", "[đúng giờ] Xác nhận và mở phiên sạc")
    s.msg("Sys", "DB", "Đánh dấu trụ đang được sử dụng")
    s.reply("Sys", "App", "Bắt đầu sạc thành công")
    s.msg("App", "U", "Hiển thị màn hình đang sạc")
    s.frame("alt", "đến muộn / đúng giờ", ["App", "DB"], f_top, s.y + 10)
    return s.render()


def seq_stop():
    s = Sequence("4.4 Sequence — Kết thúc sạc và tạo hóa đơn")
    s.actor("U", "Người dùng")
    s.part("App", "Ứng dụng")
    s.part("Sys", "Hệ thống")
    s.part("DB", "Cơ sở dữ liệu")
    s.y = 140
    s.msg("U", "App", "Bấm kết thúc sạc")
    s.msg("App", "Sys", "Gửi yêu cầu dừng phiên sạc")
    s.selfmsg("Sys", "Tính lượng điện và số tiền (giá giờ, chiết khấu fleet)")
    s.msg("Sys", "DB", "Đóng phiên sạc, trả trụ về trạng thái trống")
    s.msg("Sys", "DB", "Tạo hóa đơn")
    s.msg("Sys", "DB", "Cộng điểm thưởng cho người dùng")
    s.reply("Sys", "App", "Trả về hóa đơn và số điểm nhận được")
    s.msg("App", "U", "Hiển thị hóa đơn và thông báo")
    return s.render()


def seq_pay():
    s = Sequence("4.5 Sequence — Thanh toán hóa đơn bằng ví (có thể dùng voucher)")
    s.actor("U", "Người dùng")
    s.part("App", "Ứng dụng")
    s.part("Sys", "Hệ thống")
    s.part("DB", "Cơ sở dữ liệu")
    s.y = 150
    s.msg("U", "App", "Chọn trả bằng ví (kèm mã giảm giá nếu có)")
    s.msg("App", "Sys", "Gửi yêu cầu thanh toán")
    f1 = s.y - 10
    s.msg("Sys", "DB", "Kiểm tra mã giảm giá còn hiệu lực")
    s.reply("DB", "Sys", "Trả về mức giảm")
    s.selfmsg("Sys", "Tính lại số tiền cần trả")
    s.frame("opt", "có nhập mã giảm giá", ["Sys", "DB"], f1, s.y + 5)
    s.step(15)
    s.msg("Sys", "DB", "Kiểm tra số dư ví")
    s.reply("DB", "Sys", "Trả về số dư")
    f2 = s.y - 10
    s.step(40)
    s.reply("Sys", "App", "[không đủ] Báo số dư không đủ")
    s.msg("App", "U", "Gợi ý nạp thêm tiền")
    s.msg("Sys", "DB", "[đủ dư] Trừ tiền và đánh dấu đã thanh toán")
    s.reply("Sys", "App", "Thanh toán thành công")
    s.msg("App", "U", "Hiển thị xác nhận")
    s.frame("alt", "không đủ / đủ số dư", ["App", "DB"], f2, s.y + 10)
    return s.render()


def seq_vnpay():
    s = Sequence("4.6 Sequence — Nạp tiền vào ví qua VNPay")
    s.actor("U", "Người dùng")
    s.part("App", "Ứng dụng")
    s.part("Sys", "Hệ thống")
    s.part("VN", "VNPay")
    s.part("DB", "Cơ sở dữ liệu")
    s.y = 150
    s.msg("U", "App", "Nhập số tiền muốn nạp")
    s.msg("App", "Sys", "Gửi yêu cầu nạp tiền")
    s.msg("Sys", "DB", "Tạo giao dịch chờ thanh toán")
    s.reply("Sys", "App", "Trả về liên kết thanh toán VNPay")
    s.msg("App", "VN", "Chuyển người dùng sang VNPay")
    s.msg("U", "VN", "Thanh toán tại VNPay")
    s.msg("VN", "Sys", "Báo kết quả thanh toán")
    f_top = s.y - 10
    s.step(40)
    s.msg("Sys", "DB", "[thành công] Cộng tiền vào ví, ghi giao dịch")
    s.reply("Sys", "U", "Thông báo nạp tiền thành công")
    s.msg("Sys", "DB", "[thất bại] Đánh dấu giao dịch thất bại")
    s.reply("Sys", "U", "Thông báo nạp tiền không thành công")
    s.frame("alt", "thành công / thất bại", ["Sys", "DB"], f_top, s.y + 10)
    s.note("Hệ thống kiểm tra trạng thái trước khi cộng → ví chỉ cộng đúng 1 lần", ["Sys", "DB"], s.y + 20)
    return s.render()


def seq_redeem():
    s = Sequence("4.7 Sequence — Đổi điểm thưởng lấy tiền")
    s.actor("U", "Người dùng")
    s.part("App", "Ứng dụng")
    s.part("Sys", "Hệ thống")
    s.part("DB", "Cơ sở dữ liệu")
    s.y = 150
    s.msg("U", "App", "Nhập số điểm muốn đổi")
    s.msg("App", "Sys", "Gửi yêu cầu đổi điểm")
    s.msg("Sys", "DB", "Kiểm tra số điểm hiện có")
    s.reply("DB", "Sys", "Trả về số điểm")
    f_top = s.y - 10
    s.step(40)
    s.reply("Sys", "App", "[không đủ/sai quy tắc] Báo lỗi")
    s.msg("App", "U", "Hiển thị thông báo")
    s.msg("Sys", "DB", "[hợp lệ] Trừ điểm, cộng tiền vào ví")
    s.reply("Sys", "App", "Đổi điểm thành công")
    s.msg("App", "U", "Hiển thị số dư ví và điểm còn lại")
    s.frame("alt", "không hợp lệ / hợp lệ", ["App", "DB"], f_top, s.y + 10)
    return s.render()


def seq_review():
    s = Sequence("4.8 Sequence — Đánh giá trạm sạc")
    s.actor("U", "Người dùng")
    s.part("App", "Ứng dụng")
    s.part("Sys", "Hệ thống")
    s.part("DB", "Cơ sở dữ liệu")
    s.y = 150
    s.msg("U", "App", "Chọn số sao và viết nhận xét")
    s.msg("App", "Sys", "Gửi đánh giá")
    s.msg("Sys", "DB", "Kiểm tra đã từng sạc tại trạm chưa")
    s.reply("DB", "Sys", "Trả về kết quả")
    f_top = s.y - 10
    s.step(40)
    s.reply("Sys", "App", "[chưa sạc] Từ chối đánh giá")
    s.msg("App", "U", "Báo cần hoàn thành ít nhất 1 lần sạc")
    s.msg("Sys", "DB", "[đã sạc] Lưu đánh giá, cập nhật điểm TB của trạm")
    s.reply("Sys", "App", "Đánh giá thành công")
    s.msg("App", "U", "Hiển thị đánh giá")
    s.frame("alt", "chưa sạc / đã sạc", ["App", "DB"], f_top, s.y + 10)
    return s.render()


def seq_maint_create():
    s = Sequence("4.9 Sequence — Tạo và phân công phiếu bảo trì")
    s.actor("A", "Admin")
    s.part("App", "Ứng dụng")
    s.part("Sys", "Hệ thống")
    s.part("DB", "Cơ sở dữ liệu")
    s.actor("T", "Kỹ thuật viên")
    s.y = 150
    s.msg("A", "App", "Tạo phiếu bảo trì (trạm, trụ, mức ưu tiên)")
    s.msg("App", "Sys", "Gửi yêu cầu tạo phiếu")
    s.msg("Sys", "DB", "Lưu phiếu bảo trì")
    f1 = s.y - 10
    s.msg("Sys", "DB", "Khóa trụ để bảo trì")
    s.frame("opt", "phiếu gắn với một trụ", ["Sys", "DB"], f1, s.y + 5)
    s.step(15)
    f2 = s.y - 10
    s.msg("Sys", "DB", "Lưu phân công")
    s.msg("Sys", "T", "Gửi thông báo có phiếu mới")
    s.frame("opt", "có chỉ định kỹ thuật viên", ["Sys", "T"], f2, s.y + 5)
    s.step(15)
    s.reply("Sys", "App", "Tạo phiếu thành công")
    s.msg("App", "A", "Hiển thị phiếu đã tạo")
    return s.render()


def seq_maint_resolve():
    s = Sequence("4.10 Sequence — Kỹ thuật viên xử lý và đóng phiếu")
    s.actor("T", "Kỹ thuật viên")
    s.part("App", "Ứng dụng")
    s.part("Sys", "Hệ thống")
    s.part("DB", "Cơ sở dữ liệu")
    s.y = 150
    s.msg("T", "App", 'Cập nhật phiếu sang "Đã sửa xong"')
    s.msg("App", "Sys", "Gửi cập nhật trạng thái")
    s.msg("Sys", "DB", "Lưu trạng thái và thời điểm hoàn thành")
    f1 = s.y - 10
    s.msg("Sys", "DB", "Mở lại trụ về trạng thái sẵn sàng")
    s.frame("opt", "phiếu gắn với một trụ", ["Sys", "DB"], f1, s.y + 5)
    s.step(15)
    s.reply("Sys", "App", "Cập nhật thành công")
    s.msg("App", "T", "Hiển thị phiếu đã đóng")
    return s.render()


def build_sequence_file():
    pages = [seq_login(), seq_reserve(), seq_checkin(), seq_stop(), seq_pay(),
             seq_vnpay(), seq_redeem(), seq_review(), seq_maint_create(), seq_maint_resolve()]
    write_file(os.path.join(OUT_DIR, "03-SequenceDiagrams.drawio"), pages)


# ----------------------------------------------------------------------------
if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    build_usecase_file()
    build_activity_file()
    build_sequence_file()
    print("Done.")
