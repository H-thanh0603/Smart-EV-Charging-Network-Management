# -*- coding: utf-8 -*-
"""Part 3: Class Diagram + Runner chinh."""
import os, html, xml.etree.ElementTree as ET

OUT = os.path.join(os.path.dirname(__file__), "..", "Diagrams")
os.makedirs(OUT, exist_ok=True)
def esc(s): return html.escape(str(s), quote=True)
_uid = 0
def nid(p="n"): global _uid; _uid+=1; return f"{p}{_uid}"

S_CLASS_BOX = "swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;fillColor=none;strokeColor=#000000;"
S_CLASS_ROW = "text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;"
S_ASSO = "endArrow=none;html=1;strokeColor=#000000;fontSize=9;"
S_COMP = "endArrow=block;endFill=1;html=1;strokeColor=#000000;fontSize=9;"
S_INH = "endArrow=block;endFill=0;html=1;strokeColor=#000000;fontSize=9;"

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
        return f'<diagram id="{esc(self.name)}" name="{esc(self.name)}"><mxGraphModel dx="1600" dy="1200" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="2400" pageHeight="1800" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>{body}</root></mxGraphModel></diagram>'

def save(fname, page):
    xml = f'<mxfile host="app.diagrams.net" type="device">{page.toxml()}</mxfile>'
    path = os.path.join(OUT, fname)
    with open(path,"w",encoding="utf-8") as f: f.write(xml)
    ET.fromstring(xml)
    print(f"  {fname}")

def class_box(p, name, attrs, x, y):
    """Tao 1 class box: name + danh sach attrs."""
    rows_h = len(attrs) * 16 + 10
    total_h = 26 + rows_h
    cid = p.vertex(nid("c"), name, S_CLASS_BOX, x, y, 200, total_h)
    # add attribute rows as child cells
    for i, attr in enumerate(attrs):
        row_id = nid("r")
        p.cells.append(f'<mxCell id="{row_id}" value="{esc(attr)}" style="{S_CLASS_ROW}" vertex="1" parent="{cid}"><mxGeometry y="{26+i*16}" width="200" height="16" as="geometry"/></mxCell>')
    return cid

def build_class_diagram():
    p = Page("27-ClassDiagram-ChiTiet")
    # Classes with positions (x, y)
    classes = {
        "User": (40, 40, ["id: String PK","email: String UK","password: String","name: String","role: String","loyaltyPoints: Int","loyaltyTier: String","fleetId: String? FK"]),
        "Station": (320, 40, ["id: String PK","name: String","address: String","city: String","lat: Float","lng: Float","status: String","rating: Float","reviewCount: Int"]),
        "Slot": (600, 40, ["id: String PK","slotNumber: String","connectorType: String","powerKw: Float","status: String","qrCode: String? UK","stationId: String FK"]),
        "Reservation": (40, 280, ["id: String PK","userId: String FK","slotId: String FK","startTime: DateTime","endTime: DateTime","status: String","recurringId: String? FK"]),
        "ChargingSession": (320, 280, ["id: String PK","userId: String FK","slotId: String FK","reservationId: String? UK FK","startTime: DateTime","endTime: DateTime?","energyKwh: Float?","status: String"]),
        "Invoice": (600, 280, ["id: String PK","invoiceNo: String? UK","sessionId: String UK FK","userId: String FK","energyKwh: Float","subtotal: Float?","discount: Float","amount: Float","status: String","paidAt: DateTime?"]),
        "Tariff": (880, 40, ["id: String PK","name: String","startHour: Int","endHour: Int","ratePerKwh: Float","isPeak: Boolean","active: Boolean"]),
        "Wallet": (40, 540, ["id: String PK","userId: String UK FK","balance: Float"]),
        "WalletTransaction": (320, 540, ["id: String PK","userId: String FK","type: String","amount: Float","balance: Float","note: String?","paymentId: String?"]),
        "Payment": (600, 540, ["id: String PK","userId: String FK","txnRef: String UK","amount: Float","status: String","provider: String","responseCode: String?","bankCode: String?"]),
        "LoyaltyTransaction": (40, 760, ["id: String PK","userId: String FK","type: String","points: Int","balance: Int","reason: String"]),
        "Voucher": (320, 760, ["id: String PK","code: String UK","name: String","type: String","value: Float","minAmount: Float","maxDiscount: Float?","usageLimit: Int?","usedCount: Int"]),
        "VoucherUsage": (600, 760, ["id: String PK","voucherId: String FK","userId: String FK","invoiceId: String?","discount: Float"]),
        "MaintenanceTicket": (40, 960, ["id: String PK","stationId: String FK","slotId: String? FK","title: String","description: String","priority: String","status: String","createdById: String FK","assignedToId: String? FK"]),
        "Review": (450, 960, ["id: String PK","userId: String FK","stationId: String FK","rating: Int","comment: String?","verified: Boolean"]),
        "Notification": (40, 1180, ["id: String PK","userId: String FK","title: String","message: String","type: String","read: Boolean","link: String?"]),
        "Fleet": (320, 1180, ["id: String PK","name: String","code: String UK","discountRate: Float","active: Boolean"]),
        "Vehicle": (600, 1180, ["id: String PK","userId: String FK","fleetId: String? FK","brand: String","model: String","licensePlate: String UK","connectorType: String","batteryKwh: Float?"]),
    }
    ids = {}
    for name, (x, y, attrs) in classes.items():
        ids[name] = class_box(p, name, attrs, x, y)

    # Relations
    rels = [
        ("User","Reservation","1","0..*","userId FK"),
        ("User","ChargingSession","1","0..*","userId FK"),
        ("User","Invoice","1","0..*","userId FK"),
        ("User","Wallet","1","0..1","userId UK FK"),
        ("User","WalletTransaction","1","0..*","userId FK"),
        ("User","Payment","1","0..*","userId FK"),
        ("User","Notification","1","0..*","userId FK"),
        ("User","Review","1","0..*","userId FK"),
        ("User","LoyaltyTransaction","1","0..*","userId FK"),
        ("User","VoucherUsage","1","0..*","userId FK"),
        ("User","Vehicle","1","0..*","userId FK"),
        ("User","MaintenanceTicket","1","0..*","createdById FK"),
        ("Station","Slot","1","0..*","stationId FK"),
        ("Station","MaintenanceTicket","1","0..*","stationId FK"),
        ("Station","Review","1","0..*","stationId FK"),
        ("Slot","Reservation","1","0..*","slotId FK"),
        ("Slot","ChargingSession","1","0..*","slotId FK"),
        ("Reservation","ChargingSession","1","0..1","reservationId UK FK"),
        ("ChargingSession","Invoice","1","0..1","sessionId UK FK"),
        ("Voucher","VoucherUsage","1","0..*","voucherId FK"),
        ("Fleet","User","1","0..*","fleetId FK (drivers)"),
        ("Fleet","Vehicle","1","0..*","fleetId FK"),
        ("Vehicle","User","0..*","1","userId FK (owner)"),
    ]
    for src, dst, m1, m2, label in rels:
        if src in ids and dst in ids:
            p.edge(nid("e"), f"{m1}  {label}  {m2}", S_ASSO, ids[src], ids[dst])
    return p

def build_all_class():
    save("27-ClassDiagram-ChiTiet.drawio", build_class_diagram())

if __name__ == "__main__":
    build_all_class()
    print("=== DONE CLASS ===")
