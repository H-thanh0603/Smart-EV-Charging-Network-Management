# -*- coding: utf-8 -*-
"""Class Diagram - UML standard."""
import os, html, xml.etree.ElementTree as ET

OUT = os.path.join(os.path.dirname(__file__), "..", "Diagrams")
os.makedirs(OUT, exist_ok=True)
def esc(s): return html.escape(str(s), quote=True)
_uid = [0]
def nid(p="n"): _uid[0]+=1; return f"{p}{_uid[0]}"

S_CLASS = "swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;fillColor=none;strokeColor=#000000;fontSize=11;"
S_ATTR = "text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;fontSize=9;"
S_SEP = "line;strokeWidth=1;fillColor=none;strokeColor=#000000;"
S_ASSO = "endArrow=none;html=1;strokeColor=#000000;fontSize=8;"
S_COMP = "endArrow=block;endFill=1;html=1;strokeColor=#000000;fontSize=8;"

class Page:
    def __init__(self, name, w=2000, h=1800):
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
    def toxml(self):
        body="".join(self.cells)
        return f'<diagram id="{esc(self.name)}" name="{esc(self.name)}"><mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{self.w}" pageHeight="{self.h}" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>{body}</root></mxGraphModel></diagram>'

def save(fname, page):
    xml = f'<mxfile host="app.diagrams.net" type="device">{page.toxml()}</mxfile>'
    path = os.path.join(OUT, fname)
    with open(path,"w",encoding="utf-8") as f: f.write(xml)
    ET.fromstring(xml)
    print(f"  {fname}")

def class_box(p, name, attrs, x, y, w=200):
    """Tao 1 class UML box: [ClassName | attributes]."""
    rows_h = len(attrs) * 15 + 8
    total_h = 26 + rows_h
    cid = p.vertex(nid("c"), name, S_CLASS, x, y, w, total_h)
    # Attribute rows
    for i, attr in enumerate(attrs):
        row_id = nid("r")
        p.cells.append(f'<mxCell id="{row_id}" value="{esc(attr)}" style="{S_ATTR}" vertex="1" parent="{cid}"><mxGeometry y="{26+i*15}" width="{w}" height="15" as="geometry"/></mxCell>')
    return cid

def build_class():
    p = Page("27-ClassDiagram-ChiTiet", w=2400, h=1600)

    # Core domain
    classes = {
        "User": (40, 40, 200, [
            "id: String (PK)","email: String (UK)","password: String","name: String",
            "role: String","loyaltyPoints: Int","loyaltyTier: String","fleetId: String? (FK)"]),
        "Station": (320, 40, 200, [
            "id: String (PK)","name: String","address: String","city: String",
            "lat: Float","lng: Float","status: String","rating: Float"]),
        "Slot": (600, 40, 200, [
            "id: String (PK)","slotNumber: String","connectorType: String",
            "powerKw: Float","status: String","qrCode: String? (UK)","stationId: String (FK)"]),
        "Reservation": (40, 280, 200, [
            "id: String (PK)","userId: String (FK)","slotId: String (FK)","startTime: DateTime",
            "endTime: DateTime","status: String","recurringId: String? (FK)"]),
        "RecurringReservation": (320, 280, 200, [
            "id: String (PK)","userId: String (FK)","slotId: String (FK)","daysOfWeek: String",
            "startHour: Int","endHour: Int","startDate: DateTime","endDate: DateTime?"]),
        "ChargingSession": (600, 280, 200, [
            "id: String (PK)","userId: String (FK)","slotId: String (FK)","reservationId: String? (UK FK)",
            "startTime: DateTime","endTime: DateTime?","energyKwh: Float?","status: String"]),
        "Invoice": (40, 540, 200, [
            "id: String (PK)","invoiceNo: String? (UK)","sessionId: String (UK FK)","userId: String (FK)",
            "energyKwh: Float","subtotal: Float?","discount: Float","amount: Float","status: String"]),
        "Tariff": (880, 40, 180, [
            "id: String (PK)","name: String","startHour: Int","endHour: Int",
            "ratePerKwh: Float","isPeak: Boolean","active: Boolean"]),
        # Wallet
        "Wallet": (40, 780, 180, ["id: String (PK)","userId: String (UK FK)","balance: Float"]),
        "WalletTransaction": (320, 780, 200, [
            "id: String (PK)","userId: String (FK)","type: String",
            "amount: Float","balance: Float","note: String?"]),
        "Payment": (600, 780, 200, [
            "id: String (PK)","userId: String (FK)","txnRef: String (UK)",
            "amount: Float","status: String","provider: String"]),
        # Loyalty
        "LoyaltyTransaction": (40, 1000, 200, [
            "id: String (PK)","userId: String (FK)","type: String","points: Int",
            "balance: Int","reason: String"]),
        "Voucher": (320, 1000, 200, [
            "id: String (PK)","code: String (UK)","type: String","value: Float",
            "maxDiscount: Float?","usageLimit: Int?","usedCount: Int"]),
        "VoucherUsage": (600, 1000, 180, [
            "id: String (PK)","voucherId: String (FK)","userId: String (FK)","discount: Float"]),
        # Maintenance
        "MaintenanceTicket": (40, 1200, 220, [
            "id: String (PK)","stationId: String (FK)","slotId: String? (FK)",
            "title: String","priority: String","status: String",
            "createdById: String (FK)","assignedToId: String? (FK)"]),
        # Fleet
        "Fleet": (320, 1200, 180, [
            "id: String (PK)","name: String","code: String (UK)",
            "discountRate: Float","active: Boolean"]),
        "Vehicle": (600, 1200, 200, [
            "id: String (PK)","userId: String (FK)","fleetId: String? (FK)",
            "brand: String","model: String","licensePlate: String (UK)","connectorType: String"]),
        # Notification
        "Review": (880, 280, 180, [
            "id: String (PK)","userId: String (FK)","stationId: String (FK)",
            "rating: Int","verified: Boolean"]),
        "Notification": (880, 500, 180, [
            "id: String (PK)","userId: String (FK)","title: String",
            "message: String","type: String","read: Boolean"]),
    }
    ids = {}
    for name, (x, y, w, attrs) in classes.items():
        ids[name] = class_box(p, name, attrs, x, y, w)

    # Relations with multiplicities
    rels = [
        ("User","Reservation","1","0..*"),
        ("User","ChargingSession","1","0..*"),
        ("User","Invoice","1","0..*"),
        ("User","Wallet","1","0..1"),
        ("User","WalletTransaction","1","0..*"),
        ("User","Payment","1","0..*"),
        ("User","Notification","1","0..*"),
        ("User","Review","1","0..*"),
        ("User","LoyaltyTransaction","1","0..*"),
        ("User","VoucherUsage","1","0..*"),
        ("User","Vehicle","1","0..*"),
        ("User","MaintenanceTicket","1","0..*"),
        ("Station","Slot","1","0..*"),
        ("Station","MaintenanceTicket","1","0..*"),
        ("Station","Review","1","0..*"),
        ("Slot","Reservation","1","0..*"),
        ("Slot","ChargingSession","1","0..*"),
        ("Reservation","ChargingSession","1","0..1"),
        ("Reservation","RecurringReservation","0..*","0..1"),
        ("ChargingSession","Invoice","1","0..1"),
        ("Voucher","VoucherUsage","1","0..*"),
        ("Fleet","User","1","0..*"),
        ("Fleet","Vehicle","1","0..*"),
        ("Vehicle","User","0..*","1"),
    ]
    for src, dst, m1, m2 in rels:
        if src in ids and dst in ids:
            p.edge(nid("e"), f"{m1}          {m2}", S_ASSO, ids[src], ids[dst])
    return p

if __name__ == "__main__":
    save("27-ClassDiagram-ChiTiet.drawio", build_class())
    print("=== DONE CLASS ===")
