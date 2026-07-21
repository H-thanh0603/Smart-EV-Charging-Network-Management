# -*- coding: utf-8 -*-
"""
Activity Diagrams (OMG UML 2.x) for V-GREEN EV Charging.
Source: GIOI_THIEU_DO_AN.md section 7 (business rules & state machines) and 7.3
(list of flows to model). Scope: only the 3 most representative "main" flows
(per user request "chi chon nhung phan chinh"), chosen to jointly cover every
required UML activity element (Initial, Action, Decision/Merge, Fork/Join,
Loop, Final, Swimlane):

  A. Reservation -> Check-in -> Charging -> Invoice   (core lifecycle flow)
  B. VNPay Top-up (Return URL + IPN processed in parallel) (Fork/Join)
  C. Maintenance Ticket workflow (Admin/Technician)   (Loop)

Output: Diagrams/claude_code/03-ActivityDiagram.drawio (3 pages)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from cc_common import (
    OUT_DIR, Page, write_file, BoxRegistry,
    S_INITIAL, S_FINAL_OUT, S_FINAL_IN, S_ACTION, S_DECISION, S_BAR,
    S_SWIMLANE_HDR, S_FLOW, S_FLOW_GUARD,
)

LANE_BODY = "rounded=0;whiteSpace=wrap;html=1;fillColor=#fafafa;strokeColor=#cccccc;verticalAlign=top;fontSize=1;"


def lane(p, name, x, y, w, h):
    p.vertex(p.nid("lnb"), "", LANE_BODY, x, y, w, h)
    p.vertex(p.nid("lnh"), name, S_SWIMLANE_HDR, x, y, w, 34)


def initial(p, reg, key, x, y, d=30):
    cid = p.vertex(p.nid("i"), "", S_INITIAL, x, y, d, d)
    reg.register(key, x, y, d, d)
    return cid


def final(p, reg, key, label, x, y, d=34):
    cid = p.vertex(p.nid("f"), "", S_FINAL_OUT, x, y, d, d)
    inner = d * 0.55
    off = (d - inner) / 2
    p.vertex(p.nid("f"), "", S_FINAL_IN, x + off, y + off, inner, inner)
    if label:
        p.vertex(p.nid("flbl"), label, "text;html=1;fontSize=10;fontStyle=2;align=center;", x - 40, y + d + 2, d + 80, 16)
    reg.register(key, x, y, d, d)
    return cid


def action(p, reg, key, label, x, y, w=220, h=55):
    cid = p.vertex(p.nid("act"), label, S_ACTION, x, y, w, h)
    reg.register(key, x, y, w, h)
    return cid


def decision(p, reg, key, label, x, y, w=200, h=75):
    cid = p.vertex(p.nid("dec"), label, S_DECISION, x, y, w, h)
    reg.register(key, x, y, w, h)
    return cid


def merge(p, reg, key, x, y, w=40, h=40):
    cid = p.vertex(p.nid("mrg"), "", S_DECISION, x, y, w, h)
    reg.register(key, x, y, w, h)
    return cid


def bar(p, reg, key, x, y, w=500, h=14):
    cid = p.vertex(p.nid("bar"), "", S_BAR, x, y, w, h)
    reg.register(key, x, y, w, h)
    return cid


def flow(reg, p, src, dst, label="", guard=False):
    style = S_FLOW_GUARD if guard else S_FLOW
    reg.connect(p, src, dst, label, style)


# ----------------------------------------------------------------------
# Flow A: Reservation -> Check-in -> Charging -> Invoice
# ----------------------------------------------------------------------
def build_flow_a():
    p = Page("03a-Activity-Reservation-Charging-Invoice", w=1300, h=1520)
    reg = BoxRegistry()
    ids = {}

    p.vertex(p.nid("t"), "Activity Diagram - Reservation -> Check-in -> Charging -> Invoice",
              "text;html=1;fontSize=16;fontStyle=1;align=left;", 20, 4, 1100, 26)

    lane(p, "Customer / Driver", 40, 40, 360, 1450)
    lane(p, "System (API + DB)", 430, 40, 520, 1450)
    lane(p, "Cron Scheduler", 980, 40, 280, 1450)

    ids["init"] = initial(p, reg, "init", 190, 110)
    ids["search"] = action(p, reg, "search", "Search & Select Station / Slot", 70, 170, 300, 55)
    ids["request"] = action(p, reg, "request", "Request Reservation (startTime, endTime)", 70, 250, 300, 55)

    ids["decOverlap"] = decision(p, reg, "decOverlap", "Overlap with existing PENDING/\nCONFIRMED reservation on this Slot?", 460, 250, 210, 80)
    ids["reject"] = action(p, reg, "reject", "Reject Reservation (409 Conflict)", 730, 260, 200, 55)
    ids["finReject"] = final(p, reg, "finReject", "Rejected", 800, 350)

    ids["createRes"] = action(p, reg, "createRes", "Create Reservation (status = PENDING)", 460, 380, 210, 60)
    ids["decCheckin"] = decision(p, reg, "decCheckin", "Customer checks in within\n15 minutes of startTime?", 460, 480, 210, 80)

    ids["checkin"] = action(p, reg, "checkin", "Scan QR / Check-in at Station", 70, 490, 300, 55)
    ids["confirmRes"] = action(p, reg, "confirmRes", "Update Reservation -> CONFIRMED, Slot -> OCCUPIED", 460, 600, 210, 60)

    ids["cronExpire"] = action(p, reg, "cronExpire", "Cron Detects Expired Reservation (runs every 1 min)", 1000, 490, 230, 60)
    ids["cancelRes"] = action(p, reg, "cancelRes", "Update Reservation -> CANCELLED", 1000, 590, 230, 55)
    ids["finCancelled"] = final(p, reg, "finCancelled", "Cancelled", 1090, 680)

    ids["startCharge"] = action(p, reg, "startCharge", "Start Charging Session", 70, 700, 300, 55)
    ids["createSession"] = action(p, reg, "createSession", "Create ChargingSession (ACTIVE), Slot -> CHARGING", 460, 700, 210, 60)
    ids["endCharge"] = action(p, reg, "endCharge", "End Charging Session", 70, 800, 300, 55)
    ids["calcEnergy"] = action(p, reg, "calcEnergy", "Calculate energyKwh; Apply Tariff by Hour", 460, 800, 210, 60)

    ids["decFleet"] = decision(p, reg, "decFleet", "Belongs to a Fleet\n(Driver)?", 460, 900, 210, 80)
    ids["applyDiscount"] = action(p, reg, "applyDiscount", "Apply Fleet discountRate", 460, 1020, 210, 55)
    ids["mergeFleet"] = merge(p, reg, "mergeFleet", 545, 1110, 40, 40)

    ids["genInvoice"] = action(p, reg, "genInvoice", "Generate Invoice (UNPAID); ChargingSession -> COMPLETED; Slot -> AVAILABLE", 430, 1190, 260, 70)
    ids["finSuccess"] = final(p, reg, "finSuccess", "Success", 545, 1300)

    reg.bind_ids(ids)

    flow(reg, p, "init", "search")
    flow(reg, p, "search", "request")
    flow(reg, p, "request", "decOverlap")
    flow(reg, p, "decOverlap", "reject", "[Co trung]", guard=True)
    flow(reg, p, "reject", "finReject")
    flow(reg, p, "decOverlap", "createRes", "[Khong trung]", guard=True)
    flow(reg, p, "createRes", "decCheckin")
    flow(reg, p, "decCheckin", "checkin", "[Dung han]", guard=True)
    flow(reg, p, "checkin", "confirmRes")
    flow(reg, p, "decCheckin", "cronExpire", "[Qua 15 phut]", guard=True)
    flow(reg, p, "cronExpire", "cancelRes")
    flow(reg, p, "cancelRes", "finCancelled")
    flow(reg, p, "confirmRes", "startCharge")
    flow(reg, p, "startCharge", "createSession")
    flow(reg, p, "createSession", "endCharge")
    flow(reg, p, "endCharge", "calcEnergy")
    flow(reg, p, "calcEnergy", "decFleet")
    flow(reg, p, "decFleet", "applyDiscount", "[Co fleet]", guard=True)
    flow(reg, p, "applyDiscount", "mergeFleet")
    flow(reg, p, "decFleet", "mergeFleet", "[Khong]", guard=True)
    flow(reg, p, "mergeFleet", "genInvoice")
    flow(reg, p, "genInvoice", "finSuccess")

    return p


# ----------------------------------------------------------------------
# Flow B: VNPay Top-up (Return URL + IPN processed in parallel) - Fork/Join
# ----------------------------------------------------------------------
def build_flow_b():
    p = Page("03b-Activity-VNPay-TopUp", w=1240, h=1250)
    reg = BoxRegistry()
    ids = {}

    p.vertex(p.nid("t"), "Activity Diagram - VNPay Top-up (Return URL + IPN in parallel)",
              "text;html=1;fontSize=16;fontStyle=1;align=left;", 20, 4, 1100, 26)

    lane(p, "Customer", 40, 40, 300, 1180)
    lane(p, "System (API + DB)", 380, 40, 540, 1180)
    lane(p, "VNPay Gateway", 940, 40, 260, 1180)

    ids["init"] = initial(p, reg, "init", 150, 110)
    ids["enterAmount"] = action(p, reg, "enterAmount", "Enter Top-up Amount", 60, 170, 260, 55)
    ids["createPayment"] = action(p, reg, "createPayment", "Create Payment (PENDING); Build VNPay Payment URL", 410, 260, 260, 65)
    ids["redirect"] = action(p, reg, "redirect", "Redirect Customer to VNPay", 410, 360, 260, 55)
    ids["vnpayProcess"] = action(p, reg, "vnpayProcess", "Customer Completes Payment on VNPay", 940, 450, 240, 60)

    ids["fork1"] = bar(p, reg, "fork1", 410, 560, 500, 14)

    ids["returnHandler"] = action(p, reg, "returnHandler", "Handle Return URL (browser redirect)", 410, 610, 230, 55)
    ids["decSigReturn"] = decision(p, reg, "decSigReturn", "Signature & amount\nvalid?", 410, 700, 200, 75)
    ids["errReturn"] = action(p, reg, "errReturn", "Show Error to Customer", 60, 900, 260, 55)
    ids["creditReturn"] = action(p, reg, "creditReturn", "If Payment=PENDING: set SUCCESS, credit Wallet (idempotent)", 410, 900, 230, 65)

    ids["ipnHandler"] = action(p, reg, "ipnHandler", "Handle IPN Callback (server-to-server)", 680, 610, 230, 55)
    ids["decSigIpn"] = decision(p, reg, "decSigIpn", "Signature & amount\nvalid?", 680, 700, 200, 75)
    ids["errIpn"] = action(p, reg, "errIpn", "Respond RspCode=97 to VNPay", 940, 900, 240, 55)
    ids["creditIpn"] = action(p, reg, "creditIpn", "If Payment=PENDING: set SUCCESS, credit Wallet (idempotent); Respond RspCode=00", 680, 900, 230, 65)

    ids["join1"] = bar(p, reg, "join1", 60, 1010, 1120, 14)
    ids["notifyResult"] = action(p, reg, "notifyResult", "Notify Customer: Top-up Result", 60, 1070, 300, 55)
    ids["finB"] = final(p, reg, "finB", "Done", 190, 1160)

    reg.bind_ids(ids)

    flow(reg, p, "init", "enterAmount")
    flow(reg, p, "enterAmount", "createPayment")
    flow(reg, p, "createPayment", "redirect")
    flow(reg, p, "redirect", "vnpayProcess")
    flow(reg, p, "vnpayProcess", "fork1")

    flow(reg, p, "fork1", "returnHandler")
    flow(reg, p, "returnHandler", "decSigReturn")
    flow(reg, p, "decSigReturn", "errReturn", "[Khong hop le]", guard=True)
    flow(reg, p, "decSigReturn", "creditReturn", "[Hop le]", guard=True)
    flow(reg, p, "errReturn", "join1")
    flow(reg, p, "creditReturn", "join1")

    flow(reg, p, "fork1", "ipnHandler")
    flow(reg, p, "ipnHandler", "decSigIpn")
    flow(reg, p, "decSigIpn", "errIpn", "[Khong hop le]", guard=True)
    flow(reg, p, "decSigIpn", "creditIpn", "[Hop le]", guard=True)
    flow(reg, p, "errIpn", "join1")
    flow(reg, p, "creditIpn", "join1")

    flow(reg, p, "join1", "notifyResult")
    flow(reg, p, "notifyResult", "finB")

    return p


# ----------------------------------------------------------------------
# Flow C: Maintenance Ticket workflow (Admin / Technician) - Loop
# ----------------------------------------------------------------------
def build_flow_c():
    p = Page("03c-Activity-Maintenance-Ticket", w=1180, h=1580)
    reg = BoxRegistry()
    ids = {}

    p.vertex(p.nid("t"), "Activity Diagram - Maintenance Ticket Workflow",
              "text;html=1;fontSize=16;fontStyle=1;align=left;", 20, 4, 900, 26)

    lane(p, "Admin", 40, 40, 340, 1510)
    lane(p, "Technician", 420, 40, 340, 1510)
    lane(p, "System (API + DB)", 800, 40, 340, 1510)

    ids["init"] = initial(p, reg, "init", 190, 110)
    ids["createTicket"] = action(p, reg, "createTicket", "Create Maintenance Ticket (select Station / Slot)", 60, 170, 300, 60)
    ids["decSlot"] = decision(p, reg, "decSlot", "Slot specified?", 90, 260, 200, 75)
    ids["lockSlot"] = action(p, reg, "lockSlot", "Lock Slot -> MAINTENANCE", 830, 260, 280, 55)
    ids["merge1"] = merge(p, reg, "merge1", 170, 380, 40, 40)

    ids["ticketOpen"] = action(p, reg, "ticketOpen", "Ticket Created (status = OPEN)", 830, 460, 280, 55)
    ids["decAssignNow"] = decision(p, reg, "decAssignNow", "Assign technician now?", 90, 460, 200, 75)
    ids["merge2"] = merge(p, reg, "merge2", 170, 580, 40, 40)
    ids["assignTech"] = action(p, reg, "assignTech", "Assign Technician", 60, 660, 300, 55)
    ids["ticketInProgress"] = action(p, reg, "ticketInProgress", "Ticket -> IN_PROGRESS; Notify Technician", 830, 660, 280, 60)

    ids["techReceive"] = action(p, reg, "techReceive", "Receive Notification & Review Ticket Details", 440, 760, 300, 60)
    ids["performRepair"] = action(p, reg, "performRepair", "Perform Repair", 440, 860, 300, 55)
    ids["updateProgress"] = action(p, reg, "updateProgress", "Update Ticket Progress", 440, 950, 300, 55)
    ids["decComplete"] = decision(p, reg, "decComplete", "Repair complete?", 470, 1040, 220, 75)
    ids["markResolved"] = action(p, reg, "markResolved", "Mark Resolved", 440, 1160, 300, 55)
    ids["ticketResolved"] = action(p, reg, "ticketResolved", "Ticket -> RESOLVED (resolvedAt set)", 830, 1160, 280, 60)

    ids["decSatisfy"] = decision(p, reg, "decSatisfy", "Admin confirms\nsatisfactory?", 90, 1260, 220, 80)
    ids["closeTicket"] = action(p, reg, "closeTicket", "Close Ticket", 60, 1380, 300, 55)
    ids["ticketClosed"] = action(p, reg, "ticketClosed", "Ticket -> CLOSED; Slot -> AVAILABLE", 830, 1380, 280, 60)
    ids["finC"] = final(p, reg, "finC", "Done", 950, 1480)

    reg.bind_ids(ids)

    flow(reg, p, "init", "createTicket")
    flow(reg, p, "createTicket", "decSlot")
    flow(reg, p, "decSlot", "lockSlot", "[Co]", guard=True)
    flow(reg, p, "lockSlot", "merge1")
    flow(reg, p, "decSlot", "merge1", "[Khong]", guard=True)
    flow(reg, p, "merge1", "ticketOpen")
    flow(reg, p, "ticketOpen", "decAssignNow")
    flow(reg, p, "decAssignNow", "merge2", "[Co]", guard=True)
    flow(reg, p, "decAssignNow", "merge2", "[De sau]", guard=True)
    flow(reg, p, "merge2", "assignTech")
    flow(reg, p, "assignTech", "ticketInProgress")
    flow(reg, p, "ticketInProgress", "techReceive")
    flow(reg, p, "techReceive", "performRepair")
    flow(reg, p, "performRepair", "updateProgress")
    flow(reg, p, "updateProgress", "decComplete")
    flow(reg, p, "decComplete", "performRepair", "[Chua xong]", guard=True)
    flow(reg, p, "decComplete", "markResolved", "[Xong]", guard=True)
    flow(reg, p, "markResolved", "ticketResolved")
    flow(reg, p, "ticketResolved", "decSatisfy")
    flow(reg, p, "decSatisfy", "performRepair", "[Chua dat]", guard=True)
    flow(reg, p, "decSatisfy", "closeTicket", "[Dat yeu cau]", guard=True)
    flow(reg, p, "closeTicket", "ticketClosed")
    flow(reg, p, "ticketClosed", "finC")

    return p


def build_all():
    pages = [build_flow_a(), build_flow_b(), build_flow_c()]
    os.makedirs(OUT_DIR, exist_ok=True)
    write_file(os.path.join(OUT_DIR, "03-ActivityDiagram.drawio"), pages)


if __name__ == "__main__":
    build_all()
    print("=== DONE ACTIVITY DIAGRAMS ===")
