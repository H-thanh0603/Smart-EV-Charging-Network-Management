# -*- coding: utf-8 -*-
"""Generate an OOD (Object-Oriented Design) UML class diagram for the EV Charging system.
Output: Diagrams/05-ClassDiagram.drawio (draw.io mxfile, single page).

NOT a database/ER diagram: attributes are private (-), methods are public verbs (+),
and relationships use proper UML notation (inheritance, composition, aggregation,
association with multiplicity, dependency).

Layout: fixed grid with generous gaps; hub edges (Customer associations, Fleet->Customer)
are routed through clean perimeter lanes via explicit waypoints so no line cuts a box.
"""
import html
import os

LH = 16      # line height for an attribute/method row
HEAD = 26    # class header height
DIV = 8      # divider (empty compartment separator) height
W = 230      # class box width

# Domain color palette (fill, stroke)
COLORS = {
    "people":  ("#dae8fc", "#6c8ebf"),
    "station": ("#d5e8d4", "#82b366"),
    "booking": ("#ffe6cc", "#d79b00"),
    "payment": ("#fff2cc", "#d6b656"),
    "support": ("#f8cecc", "#b85450"),
    "fleet":   ("#e1d5e7", "#9673a6"),
}

# name -> (domain, x, y, [attrs], [methods], abstract?, stereotype)
CLASSES = {
    "User": ("people", 400, 40, [
        "- id : String", "- email : String", "- password : String",
        "- name : String", "- phone : String",
    ], [
        "+ login(email, password) : boolean", "+ logout() : void",
        "+ updateProfile() : void", "+ changePassword() : boolean",
    ], True, "«abstract»"),

    "Customer": ("people", 40, 340, [
        "- loyaltyPoints : int", "- loyaltyTier : String",
    ], [
        "+ bookSlot() : Reservation", "+ cancelReservation() : boolean",
        "+ startSession() : ChargingSession", "+ rechargeWallet() : boolean",
    ], False, None),

    "Admin": ("people", 400, 340, [], [
        "+ manageStation() : void", "+ manageUser() : void", "+ viewRevenue() : double",
    ], False, None),

    "Technician": ("people", 760, 340, [], [
        "+ acceptTicket() : boolean", "+ resolveTicket() : boolean",
    ], False, None),

    "Wallet": ("payment", 40, 640, [
        "- id : String", "- balance : double",
    ], [
        "+ deposit() : boolean", "+ deduct() : boolean", "+ getBalance() : double",
    ], False, None),

    "Station": ("station", 1120, 40, [
        "- id : String", "- name : String", "- address : String",
        "- lat : double", "- lng : double", "- status : String", "- rating : double",
    ], [
        "+ addSlot() : Slot", "+ updateInfo() : void", "+ calcRating() : double",
    ], False, None),

    "Slot": ("station", 1120, 340, [
        "- id : String", "- slotNumber : String", "- connectorType : String",
        "- powerKw : double", "- status : String",
    ], [
        "+ reserve() : boolean", "+ release() : void", "+ reportError() : boolean",
    ], False, None),

    "MaintenanceTicket": ("support", 1120, 640, [
        "- id : String", "- title : String", "- priority : String",
        "- status : String", "- resolvedAt : DateTime",
    ], [
        "+ assign() : void", "+ resolve() : boolean", "+ close() : void",
    ], False, None),

    "Review": ("support", 760, 640, [
        "- id : String", "- rating : int", "- comment : String", "- verified : boolean",
    ], [
        "+ create() : boolean", "+ edit() : boolean",
    ], False, None),

    "RecurringReservation": ("booking", 1480, 40, [
        "- id : String", "- daysOfWeek : String", "- startHour : int",
        "- endHour : int", "- active : boolean",
    ], [
        "+ generateReservations() : List<Reservation>", "+ deactivate() : void",
    ], False, None),

    "Reservation": ("booking", 1480, 340, [
        "- id : String", "- startTime : DateTime", "- endTime : DateTime", "- status : String",
    ], [
        "+ confirm() : boolean", "+ cancel() : boolean", "+ checkIn() : boolean",
    ], False, None),

    "ChargingSession": ("booking", 1480, 640, [
        "- id : String", "- startTime : DateTime", "- endTime : DateTime",
        "- energyKwh : double", "- status : String",
    ], [
        "+ start() : boolean", "+ stop() : void", "+ calcEnergy() : double",
    ], False, None),

    "Voucher": ("payment", 1840, 40, [
        "- id : String", "- code : String", "- type : String",
        "- value : double", "- validUntil : DateTime",
    ], [
        "+ validate() : boolean", "+ applyDiscount() : double",
    ], False, None),

    "Invoice": ("payment", 1840, 340, [
        "- id : String", "- invoiceNo : String", "- energyKwh : double",
        "- amount : double", "- discount : double", "- status : String",
    ], [
        "+ calculateTotal() : double", "+ applyVoucher() : double",
        "+ pay() : boolean", "+ generatePdf() : void",
    ], False, None),

    "Payment": ("payment", 1840, 640, [
        "- id : String", "- txnRef : String", "- amount : double",
        "- provider : String", "- status : String",
    ], [
        "+ process() : boolean", "+ verify() : boolean", "+ refund() : boolean",
    ], False, None),

    "Fleet": ("fleet", 2200, 40, [
        "- id : String", "- name : String", "- code : String", "- discountRate : double",
    ], [
        "+ addVehicle() : void", "+ addDriver() : void",
    ], False, None),

    "Vehicle": ("fleet", 2200, 340, [
        "- id : String", "- brand : String", "- model : String",
        "- licensePlate : String", "- connectorType : String",
    ], [
        "+ register() : boolean", "+ deactivate() : void",
    ], False, None),
}

# Relationships: (source, target, kind, srcMult, tgtMult, label)
# kind: inherit | composition | aggregation | association | dependency
REL = [
    ("Customer", "User", "inherit", "", "", ""),
    ("Admin", "User", "inherit", "", "", ""),
    ("Technician", "User", "inherit", "", "", ""),

    ("Station", "Slot", "composition", "1", "1..*", "has"),
    ("Customer", "Wallet", "composition", "1", "1", "owns"),
    ("ChargingSession", "Invoice", "composition", "1", "1", "generates"),
    ("RecurringReservation", "Reservation", "composition", "1", "0..*", "spawns"),

    ("Fleet", "Vehicle", "aggregation", "1", "0..*", "manages"),
    ("Fleet", "Customer", "aggregation", "1", "0..*", "drivers"),

    ("Customer", "Reservation", "association", "1", "0..*", "makes"),
    ("Customer", "ChargingSession", "association", "1", "0..*", "runs"),
    ("Customer", "Review", "association", "1", "0..*", "writes"),
    ("Customer", "Payment", "association", "1", "0..*", "pays"),
    ("Customer", "Vehicle", "association", "1", "0..*", "owns"),
    ("Slot", "Reservation", "association", "1", "0..*", "booked as"),
    ("Slot", "ChargingSession", "association", "1", "0..*", "used by"),
    ("Reservation", "ChargingSession", "association", "1", "0..1", "leads to"),
    ("Station", "Review", "association", "1", "0..*", "rated by"),
    ("Station", "MaintenanceTicket", "association", "1", "0..*", "reported for"),
    ("Slot", "MaintenanceTicket", "association", "0..1", "0..*", ""),
    ("Technician", "MaintenanceTicket", "association", "1", "0..*", "assigned"),
    ("Invoice", "Payment", "association", "1", "0..*", "settled by"),

    ("Invoice", "Voucher", "dependency", "", "", "uses"),
]

# Explicit routing for edges that would otherwise cut through a box.
# key (source, target) -> dict(exit=(x,y frac), entry=(x,y frac), pts=[(px,py)...])
ROUTES = {
    ("Customer", "User"): dict(exit=(0.5, 0), entry=(0.5, 1), pts=[(155, 300), (515, 300)]),
    ("Technician", "User"): dict(exit=(0.5, 0), entry=(1, 0.55), pts=[(875, 160), (630, 160)]),

    ("Fleet", "Customer"): dict(exit=(0.5, 0), entry=(0.5, 0), pts=[(2315, 15), (155, 15)]),

    ("Customer", "Reservation"): dict(exit=(1, 0.45), entry=(0.5, 1), pts=[(335, 405), (335, 585), (1595, 585)]),
    ("Customer", "ChargingSession"): dict(exit=(1, 0.6), entry=(0.5, 1), pts=[(350, 445), (350, 880), (1595, 880)]),
    ("Customer", "Payment"): dict(exit=(1, 0.8), entry=(0.5, 1), pts=[(365, 460), (365, 905), (1955, 905)]),
    ("Customer", "Vehicle"): dict(exit=(1, 0.3), entry=(0.5, 1), pts=[(320, 385), (320, 930), (2315, 930)]),
    ("Customer", "Review"): dict(exit=(0.75, 1), entry=(0.5, 0), pts=[(212, 600), (875, 600)]),

    ("Station", "Review"): dict(exit=(0, 0.5), entry=(0.5, 0), pts=[(1090, 137), (1090, 605), (875, 605)]),
    ("Station", "MaintenanceTicket"): dict(exit=(1, 0.5), entry=(0.5, 0), pts=[(1400, 137), (1400, 605), (1235, 605)]),
    ("Technician", "MaintenanceTicket"): dict(exit=(0.5, 1), entry=(0.5, 0), pts=[(875, 590), (1235, 590)]),
    ("Slot", "ChargingSession"): dict(exit=(1, 0.5), entry=(0, 0.5), pts=[(1400, 421), (1400, 721)]),

    ("ChargingSession", "Invoice"): dict(exit=(1, 0.5), entry=(0, 0.5), pts=[(1775, 721), (1775, 437)]),
}


def esc(s):
    return html.escape(s, quote=True)


def box_height(attrs, methods):
    na = max(len(attrs), 1)  # keep at least a thin empty compartment
    nm = max(len(methods), 1)
    return HEAD + na * LH + DIV + nm * LH


def emit_class(cid, name, meta):
    domain, x, y, attrs, methods, abstract, stereo = meta
    fill, stroke = COLORS[domain]
    h = box_height(attrs, methods)
    cells = []

    title = name
    if stereo:
        title = f"{stereo}\n{name}"
    font_style = "3" if abstract else "1"  # bold+italic for abstract, bold otherwise
    header_style = (
        f"swimlane;fontStyle={font_style};align=center;verticalAlign=top;"
        "childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;"
        "resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;"
        f"whiteSpace=wrap;html=1;fillColor={fill};strokeColor={stroke};fontSize=13;"
    )
    cells.append(
        f'<mxCell id="{cid}" value="{esc(title)}" style="{header_style}" vertex="1" parent="1">'
        f'<mxGeometry x="{x}" y="{y}" width="{W}" height="{h}" as="geometry"/></mxCell>'
    )

    row_style = (
        "text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;"
        "spacingLeft=6;spacingRight=6;overflow=hidden;rotatable=0;html=1;fontSize=11;"
    )
    div_style = (
        "line;strokeWidth=1;fillColor=none;align=left;verticalAlign=middle;"
        f"spacingTop=-1;spacingLeft=3;spacingRight=3;rotatable=0;html=1;strokeColor={stroke};"
    )

    off = HEAD
    rows = attrs if attrs else [""]
    for i, a in enumerate(rows):
        cells.append(
            f'<mxCell id="{cid}_a{i}" value="{esc(a)}" style="{row_style}" vertex="1" parent="{cid}">'
            f'<mxGeometry y="{off}" width="{W}" height="{LH}" as="geometry"/></mxCell>'
        )
        off += LH
    cells.append(
        f'<mxCell id="{cid}_div" value="" style="{div_style}" vertex="1" parent="{cid}">'
        f'<mxGeometry y="{off}" width="{W}" height="{DIV}" as="geometry"/></mxCell>'
    )
    off += DIV
    mrows = methods if methods else [""]
    for i, m in enumerate(mrows):
        cells.append(
            f'<mxCell id="{cid}_m{i}" value="{esc(m)}" style="{row_style}" vertex="1" parent="{cid}">'
            f'<mxGeometry y="{off}" width="{W}" height="{LH}" as="geometry"/></mxCell>'
        )
        off += LH
    return cells


def edge_style(kind, route):
    base = ("edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endFill=0;fontSize=11;"
            "labelBackgroundColor=#FFFFFF;fontColor=#555555;jettySize=auto;")
    if kind == "inherit":
        style = base + "endArrow=block;endSize=14;endFill=0;strokeColor=#000000;fontColor=#555555;"
    elif kind == "composition":
        style = base + "startArrow=diamondThin;startFill=1;startSize=14;endArrow=none;strokeColor=#000000;"
    elif kind == "aggregation":
        style = base + "startArrow=diamondThin;startFill=0;startSize=14;endArrow=none;strokeColor=#000000;"
    elif kind == "dependency":
        style = base + "dashed=1;endArrow=open;endSize=12;strokeColor=#777777;"
    else:  # association
        style = base + "endArrow=none;strokeColor=#000000;"
    if route:
        ex, ey = route["exit"]
        nx, ny = route["entry"]
        style += (f"exitX={ex};exitY={ey};exitDx=0;exitDy=0;"
                  f"entryX={nx};entryY={ny};entryDx=0;entryDy=0;")
    return style


def emit_edges():
    cells = []
    for i, (s, t, kind, sm, tm, label) in enumerate(REL):
        eid = f"e{i}"
        route = ROUTES.get((s, t))
        style = edge_style(kind, route)
        geo = '<mxGeometry relative="1" as="geometry">'
        if route and route.get("pts"):
            pts = "".join(f'<mxPoint x="{px}" y="{py}"/>' for px, py in route["pts"])
            geo += f'<Array as="points">{pts}</Array>'
        geo += "</mxGeometry>"
        cells.append(
            f'<mxCell id="{eid}" value="{esc(label)}" style="{style}" edge="1" parent="1" '
            f'source="{s}" target="{t}">{geo}</mxCell>'
        )
        lbl_style = ("edgeLabel;html=1;align=center;verticalAlign=middle;fontSize=11;"
                     "fontStyle=1;labelBackgroundColor=#FFFFFF;")
        if sm:
            cells.append(
                f'<mxCell id="{eid}_sm" value="{esc(sm)}" style="{lbl_style}" '
                f'connectable="0" vertex="1" parent="{eid}">'
                f'<mxGeometry x="-0.82" y="0" relative="1" as="geometry">'
                f'<mxPoint as="offset"/></mxGeometry></mxCell>'
            )
        if tm:
            cells.append(
                f'<mxCell id="{eid}_tm" value="{esc(tm)}" style="{lbl_style}" '
                f'connectable="0" vertex="1" parent="{eid}">'
                f'<mxGeometry x="0.82" y="0" relative="1" as="geometry">'
                f'<mxPoint as="offset"/></mxGeometry></mxCell>'
            )
    return cells


def emit_legend():
    x, y = 40, 850
    style = (
        "swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;"
        "horizontal=1;startSize=26;resizeParent=1;resizeParentMax=0;collapsible=0;"
        "whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;fontSize=13;"
    )
    cells = [
        f'<mxCell id="legend" value="Chú thích quan hệ (Relationships)" style="{style}" vertex="1" parent="1">'
        f'<mxGeometry x="{x}" y="{y}" width="300" height="150" as="geometry"/></mxCell>'
    ]
    items = [
        "▷   Kế thừa (Inheritance)",
        "◆   Composition (chứa mạnh)",
        "◇   Aggregation (chứa yếu)",
        "──  Association (liên kết)",
        "┄▷  Dependency (phụ thuộc)",
    ]
    rs = ("text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;"
          "spacingLeft=8;overflow=hidden;html=1;fontSize=11;")
    off = 26
    for i, it in enumerate(items):
        cells.append(
            f'<mxCell id="legend_{i}" value="{esc(it)}" style="{rs}" vertex="1" parent="legend">'
            f'<mxGeometry y="{off}" width="300" height="24" as="geometry"/></mxCell>'
        )
        off += 24
    return cells


def main():
    body = []
    for name, meta in CLASSES.items():
        body += emit_class(name, name, meta)
    body += emit_edges()
    body += emit_legend()

    inner = "\n        ".join(body)
    xml = f'''<mxfile host="app.diagrams.net">
  <diagram id="05-ClassDiagram" name="05-ClassDiagram">
    <mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="2600" pageHeight="1050" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        {inner}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
'''
    out = os.path.join(os.path.dirname(__file__), "..", "Diagrams", "05-ClassDiagram.drawio")
    out = os.path.abspath(out)
    with open(out, "w", encoding="utf-8") as f:
        f.write(xml)
    print(f"Wrote {out}")
    print(f"Classes: {len(CLASSES)}  Relationships: {len(REL)}  Cells: {len(body)}")


if __name__ == "__main__":
    main()
