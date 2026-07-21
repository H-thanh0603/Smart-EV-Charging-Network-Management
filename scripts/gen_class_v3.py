# -*- coding: utf-8 -*-
"""
Sinh Class Diagram (UML) day du 23 lop tu section 3.1 cua
PHAN_TICH_THIET_KE_HE_THONG.md, cung 30 quan he tu section 3.3,
ra file ../Diagrams/05-ClassDiagram.drawio

Tuan thu style cua cac generator hien co (gen_uml_clean.py / gen_drawio.py):
  - Class box: swimlane (header = ten class) + cac dong text (attribute) ben duoi.
  - PK/FK/UK duoc ghi la hau to text ngay sau kieu du lieu, giong nhu trong markdown.
  - Association: duong thang khong mui ten, nhan la ban so (cardinality) o giua.
"""
import os
import html
import xml.etree.ElementTree as ET

OUT = os.path.join(os.path.dirname(__file__), "..", "Diagrams")
os.makedirs(OUT, exist_ok=True)


def esc(s):
    return html.escape(str(s), quote=True)


_uid = [0]


def nid(p="n"):
    _uid[0] += 1
    return f"{p}{_uid[0]}"


# ---- styles (dong bo voi gen_uml_clean.py: den-trang chuan UML) ----
S_CLASS = ("swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;"
           "horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;"
           "resizeLast=0;collapsible=1;marginBottom=0;fillColor=none;strokeColor=#000000;fontSize=12;")
S_ATTR = ("text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;"
          "spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];"
          "portConstraint=eastwest;fontSize=10;")
S_ASSO = "endArrow=none;html=1;strokeColor=#000000;fontSize=9;rounded=0;"


class Page:
    def __init__(self, name, w=3200, h=2200):
        self.name = name
        self.cells = []
        self.w = w
        self.h = h

    def vertex(self, vid, val, style, x, y, w, h, parent="1"):
        self.cells.append(
            f'<mxCell id="{vid}" value="{esc(val)}" style="{style}" vertex="1" parent="{parent}">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )
        return vid

    def edge(self, eid, val, style, src, tgt, pts=None):
        geo = '<mxGeometry relative="1" as="geometry">'
        if pts:
            geo += '<Array as="points">' + ''.join(f'<mxPoint x="{px}" y="{py}"/>' for px, py in pts) + '</Array>'
        geo += '</mxGeometry>'
        self.cells.append(
            f'<mxCell id="{eid}" value="{esc(val)}" style="{style}" edge="1" parent="1" '
            f'source="{src}" target="{tgt}">{geo}</mxCell>'
        )
        return eid

    def to_xml(self):
        body = "".join(self.cells)
        return (
            f'<diagram id="{esc(self.name)}" name="{esc(self.name)}">'
            f'<mxGraphModel dx="1600" dy="1200" grid="1" gridSize="10" guides="1" tooltips="1" '
            f'connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{self.w}" '
            f'pageHeight="{self.h}" math="0" shadow="0"><root>'
            f'<mxCell id="0"/><mxCell id="1" parent="0"/>{body}</root></mxGraphModel></diagram>'
        )


def write_file(path, pages):
    xml = '<mxfile host="app.diagrams.net" type="device">' + "".join(p.to_xml() for p in pages) + "</mxfile>"
    with open(path, "w", encoding="utf-8") as f:
        f.write(xml)
    ET.fromstring(xml)
    print("Wrote", os.path.abspath(path), "pages:", len(pages))


def class_box(p, name, attrs, x, y, w=220):
    """Tao 1 class box UML: header = ten class, cac dong duoi = attribute."""
    row_h = 16
    total_h = 26 + len(attrs) * row_h + 6
    cid = p.vertex(nid("c"), name, S_CLASS, x, y, w, total_h)
    for i, attr in enumerate(attrs):
        p.cells.append(
            f'<mxCell id="{nid("r")}" value="{esc(attr)}" style="{S_ATTR}" vertex="1" parent="{cid}">'
            f'<mxGeometry y="{26 + i * row_h}" width="{w}" height="{row_h}" as="geometry"/></mxCell>'
        )
    return cid


def build_class_diagram():
    p = Page("05-ClassDiagram")

    # (x, y, width, [attributes]) — attributes formatted "+Type name SUFFIX" as in markdown section 3.1
    classes = {
        # ── CORE DOMAIN ──
        "User": (40, 40, 240, [
            "+String id PK", "+String email UK", "+String password", "+String name",
            "+String phone", "+String avatar",
            "+String role «CUSTOMER/DRIVER/TECHNICIAN/ADMIN»",
            "+Int loyaltyPoints", "+String loyaltyTier «BRONZE/SILVER/GOLD/PLATINUM»",
            "+String theme «light/dark»", "+DateTime createdAt", "+DateTime updatedAt",
        ]),
        "Station": (340, 40, 240, [
            "+String id PK", "+String name", "+String address", "+String city",
            "+String district", "+Float lat", "+Float lng",
            "+String status «ACTIVE/INACTIVE»", "+Float rating", "+Int reviewCount",
            "+String brand", "+Boolean isPremium", "+String imageUrl",
            "+String amenities", "+String description", "+DateTime createdAt",
        ]),
        "Slot": (640, 40, 240, [
            "+String id PK", "+String slotNumber",
            "+String connectorType «CCS2/Type2/CHAdeMO/GB/T»", "+Float powerKw",
            "+String status «AVAILABLE/OCCUPIED/CHARGING/MAINTENANCE»",
            "+String qrCode UK", "+String stationId FK", "+String lastError",
            "+DateTime lastHeartbeat",
        ]),
        "Reservation": (40, 320, 240, [
            "+String id PK", "+String userId FK", "+String slotId FK",
            "+DateTime startTime", "+DateTime endTime",
            "+String status «PENDING/CONFIRMED/CANCELLED/COMPLETED»", "+String recurringId FK",
        ]),
        "RecurringReservation": (340, 320, 240, [
            "+String id PK", "+String userId FK", "+String slotId FK", "+String daysOfWeek",
            "+Int startHour", "+Int endHour", "+DateTime startDate", "+DateTime endDate",
            "+Boolean active",
        ]),
        "ChargingSession": (640, 320, 240, [
            "+String id PK", "+String userId FK", "+String slotId FK",
            "+String reservationId UK FK", "+DateTime startTime", "+DateTime endTime",
            "+Float energyKwh", "+String status «ACTIVE/COMPLETED/CANCELLED»",
        ]),
        # ── BILLING ──
        "Invoice": (940, 320, 240, [
            "+String id PK", "+String invoiceNo UK", "+String sessionId UK FK",
            "+String userId FK", "+Float energyKwh", "+Float subtotal", "+Float discount",
            "+String voucherCode", "+Float amount", "+Int pointsEarned", "+Int pointsRedeemed",
            "+String status «UNPAID/PAID»", "+DateTime paidAt", "+String paymentMethod",
        ]),
        "Tariff": (940, 40, 220, [
            "+String id PK", "+String name", "+Int startHour", "+Int endHour",
            "+Float ratePerKwh", "+Boolean isPeak", "+Boolean active",
        ]),
        # ── WALLET & PAYMENT ──
        "Wallet": (40, 620, 220, [
            "+String id PK", "+String userId UK FK", "+Float balance", "+DateTime createdAt",
        ]),
        "WalletTransaction": (300, 620, 240, [
            "+String id PK", "+String userId FK",
            "+String type «TOPUP/PAYMENT/REDEEM/ADJUST»", "+Float amount", "+Float balance",
            "+String note", "+String paymentId",
        ]),
        "Payment": (600, 620, 240, [
            "+String id PK", "+String userId FK", "+String txnRef UK", "+Float amount",
            "+String status «PENDING/SUCCESS/FAILED»", "+String provider",
            "+String responseCode", "+String bankCode", "+String bankTranNo",
            "+String ipAddress", "+DateTime paidAt",
        ]),
        # ── LOYALTY & VOUCHER ──
        "LoyaltyTransaction": (40, 900, 240, [
            "+String id PK", "+String userId FK", "+String type «EARN/REDEEM/ADJUST»",
            "+Int points", "+Int balance", "+String reason",
        ]),
        "Voucher": (340, 900, 240, [
            "+String id PK", "+String code UK", "+String name", "+String type «PERCENT/FIXED»",
            "+Float value", "+Float minAmount", "+Float maxDiscount", "+Int usageLimit",
            "+Int perUserLimit", "+DateTime validFrom", "+DateTime validUntil",
            "+Boolean active", "+Int usedCount",
        ]),
        "VoucherUsage": (640, 900, 220, [
            "+String id PK", "+String voucherId FK", "+String userId FK",
            "+String invoiceId", "+Float discount",
        ]),
        # ── MAINTENANCE ──
        "MaintenanceTicket": (940, 900, 260, [
            "+String id PK", "+String stationId FK", "+String slotId FK", "+String title",
            "+String description", "+String priority «LOW/MEDIUM/HIGH/CRITICAL»",
            "+String status «OPEN/IN_PROGRESS/RESOLVED/CLOSED»", "+String createdById FK",
            "+String assignedToId FK", "+DateTime resolvedAt",
        ]),
        # ── REVIEW ──
        "Review": (1240, 320, 220, [
            "+String id PK", "+String userId FK", "+String stationId FK", "+Int rating",
            "+String comment", "+Boolean verified", "+DateTime createdAt",
        ]),
        # ── NOTIFICATION & PUSH ──
        "Notification": (1240, 40, 220, [
            "+String id PK", "+String userId FK", "+String title", "+String message",
            "+String type «INFO/SUCCESS/WARNING/ERROR»", "+Boolean read", "+String link",
        ]),
        "PushSubscription": (1500, 40, 240, [
            "+String id PK", "+String userId FK", "+String endpoint UK", "+String p256dh",
            "+String auth", "+String userAgent",
        ]),
        # ── FLEET & VEHICLE ──
        "Fleet": (1240, 620, 220, [
            "+String id PK", "+String name", "+String code UK", "+String contact",
            "+String phone", "+String email", "+Int vehicleCount", "+Boolean walletShared",
            "+Float discountRate", "+Boolean active",
        ]),
        "Vehicle": (1500, 620, 240, [
            "+String id PK", "+String userId FK", "+String fleetId FK", "+String brand",
            "+String model", "+String licensePlate UK", "+String connectorType",
            "+Float batteryKwh", "+String vinNumber", "+Boolean active",
        ]),
        # ── WEBHOOK & API KEY ──
        "Webhook": (1500, 900, 220, [
            "+String id PK", "+String name", "+String url", "+String events",
            "+String secret", "+Boolean active", "+DateTime lastTriggered", "+Int failureCount",
        ]),
        "WebhookLog": (1780, 900, 240, [
            "+String id PK", "+String webhookId FK", "+String event", "+String payload",
            "+Int responseStatus", "+String responseBody", "+Boolean success",
        ]),
        "ApiKey": (1780, 620, 220, [
            "+String id PK", "+String name", "+String key UK", "+String partnerId",
            "+Boolean active", "+DateTime lastUsed", "+Int rateLimit",
        ]),
    }

    ids = {}
    for name, (x, y, w, attrs) in classes.items():
        ids[name] = class_box(p, name, attrs, x, y, w)

    # 30 quan he tu section 3.3 (STT | Tu lop | Den lop | Ban so | FK)
    rels = [
        ("User", "Reservation", "1", "0..*", "userId"),
        ("User", "ChargingSession", "1", "0..*", "userId"),
        ("User", "Invoice", "1", "0..*", "userId"),
        ("User", "Wallet", "1", "0..1", "userId (UK)"),
        ("User", "WalletTransaction", "1", "0..*", "userId"),
        ("User", "Payment", "1", "0..*", "userId"),
        ("User", "Notification", "1", "0..*", "userId"),
        ("User", "Review", "1", "0..*", "userId"),
        ("User", "LoyaltyTransaction", "1", "0..*", "userId"),
        ("User", "VoucherUsage", "1", "0..*", "userId"),
        ("User", "PushSubscription", "1", "0..*", "userId"),
        ("User", "Vehicle", "1", "0..*", "userId"),
        ("User", "MaintenanceTicket", "1", "0..*", "createdById"),
        ("User", "MaintenanceTicket", "1", "0..*", "assignedToId"),
        ("Station", "Slot", "1", "0..*", "stationId"),
        ("Station", "MaintenanceTicket", "1", "0..*", "stationId"),
        ("Station", "Review", "1", "0..*", "stationId"),
        ("Slot", "Reservation", "1", "0..*", "slotId"),
        ("Slot", "ChargingSession", "1", "0..*", "slotId"),
        ("Slot", "MaintenanceTicket", "1", "0..*", "slotId"),
        ("Reservation", "ChargingSession", "1", "0..1", "reservationId (UK)"),
        ("Reservation", "RecurringReservation", "0..*", "0..1", "recurringId"),
        ("ChargingSession", "Invoice", "1", "0..1", "sessionId (UK)"),
        ("Voucher", "VoucherUsage", "1", "0..*", "voucherId"),
        ("Fleet", "User", "1", "0..*", "fleetId"),
        ("Fleet", "Vehicle", "1", "0..*", "fleetId"),
        ("Vehicle", "User", "0..*", "1", "userId"),
        ("Vehicle", "Fleet", "0..*", "0..1", "fleetId"),
        ("Webhook", "WebhookLog", "1", "0..*", "webhookId"),
        ("Review", "Station", "unique", "(userId, stationId)", "1 review / user / station"),
    ]

    for src, dst, m1, m2, label in rels:
        if src in ids and dst in ids:
            p.edge(nid("e"), f"{m1}          {m2}          {label}", S_ASSO, ids[src], ids[dst])
        else:
            print(f"  [!] missing class for relation: {src} -> {dst}")

    print(f"Total classes: {len(classes)}, total relations drawn: {len(rels)}")
    return p


def build_all_class():
    write_file(os.path.join(OUT, "05-ClassDiagram.drawio"), [build_class_diagram()])


if __name__ == "__main__":
    build_all_class()
    print("=== DONE CLASS ===")
