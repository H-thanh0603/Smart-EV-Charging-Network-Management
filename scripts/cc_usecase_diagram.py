# -*- coding: utf-8 -*-
"""
Use Case Diagram (OMG UML 2.x) for V-GREEN EV Charging.
Source: GIOI_THIEU_DO_AN.md sections 5 (actors) and 6 (function groups A-L).

Design constraints (per request):
  * Monochrome only - white fill, black stroke/text, no color.
  * No edge may cross over a use-case / actor box.

Layout strategy to satisfy the "no line over box" rule:
  Each primary actor is placed immediately to the LEFT of its own single
  vertical column of use cases. Every actor->use-case association therefore
  routes through the clean vertical lane between the actor column (x=60) and
  the use-case column (x=380) - that lane is guaranteed empty, so no line
  ever passes over another box. include/extend targets live in a second
  column (x=760) reached through the equally-empty x=600..760 lane. Secondary
  actors sit to the RIGHT of the use cases they trigger, mirroring the rule.

Output: Diagrams/claude_code/02-UseCaseDiagram.drawio
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from cc_common import OUT_DIR, Page, write_file, BoxRegistry

# ---- Monochrome style set (local overrides; shared constants are colored) ----
MONO_EDGE = ("edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;jettySize=auto;"
             "orthogonalLoop=1;fontSize=10;strokeColor=#000000;fontColor=#000000;")
S_ASSOC = MONO_EDGE + "endArrow=none;"
S_GEN = MONO_EDGE + "endArrow=block;endFill=0;"
S_INCLUDE = MONO_EDGE + "endArrow=open;endFill=0;dashed=1;fontStyle=2;"
S_EXTEND = MONO_EDGE + "endArrow=open;endFill=0;dashed=1;fontStyle=2;"

S_ACTOR = ("shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;"
           "outlineConnect=0;fillColor=#ffffff;strokeColor=#000000;fontColor=#000000;")
S_ACTOR_EXT = S_ACTOR + "dashed=1;"   # external actors: dashed outline (still monochrome)
S_USECASE = ("ellipse;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;"
             "fontColor=#000000;fontSize=11;")
S_BOUNDARY = ("rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;fillColor=none;"
              "strokeColor=#000000;fontStyle=1;fontSize=14;align=center;fontColor=#000000;")

# geometry
UC_W, UC_H = 220, 50
X_BASE = 380      # primary use-case column
X_RIGHT = 760     # include/extend targets + scheduler use cases
X_ACTOR = 60      # primary actors (left of their column)
X_SEC = 1120      # secondary actors (right of their use cases)


def actor(p, reg, key, label, x, y, ext=False, w=70, h=90):
    style = S_ACTOR_EXT if ext else S_ACTOR
    cid = p.vertex(p.nid("a"), label, style, x, y, w, h)
    reg.register(key, x, y, w, h)
    return cid


def usecase(p, reg, key, label, x, y):
    cid = p.vertex(p.nid("u"), label, S_USECASE, x, y, UC_W, UC_H)
    reg.register(key, x, y, UC_W, UC_H)
    return cid


def build():
    p = Page("02-UseCaseDiagram", w=1320, h=2220)
    reg = BoxRegistry()
    ids = {}

    p.vertex(p.nid("t"), "Use Case Diagram - V-GREEN EV Charging (main flows)",
             "text;html=1;fontSize=18;fontStyle=1;align=left;verticalAlign=middle;",
             30, 6, 1100, 28)

    # ---- System boundary (contains use cases only) ----
    p.vertex(p.nid("b"), "V-GREEN EV Charging System", S_BOUNDARY,
             330, 40, 760, 2130)

    # ---- Guest band (top) ----
    ids["Guest"] = actor(p, reg, "Guest", "Guest", X_ACTOR, 180)
    ids["Register"] = usecase(p, reg, "Register", "Register", X_BASE, 70)
    ids["Login"] = usecase(p, reg, "Login", "Login", X_BASE, 142)
    ids["ResetPassword"] = usecase(p, reg, "ResetPassword", "Reset Password", X_BASE, 214)
    ids["SearchStations"] = usecase(p, reg, "SearchStations", "Search Stations", X_BASE, 286)
    ids["ViewStationDetails"] = usecase(p, reg, "ViewStationDetails", "View Station Details", X_BASE, 358)

    # ---- Customer band ----
    ids["Customer"] = actor(p, reg, "Customer", "Customer", X_ACTOR, 820)
    ids["Driver"] = actor(p, reg, "Driver", "Driver", X_ACTOR, 960)
    ids["ScanStationQrCode"] = usecase(p, reg, "ScanStationQrCode", "Scan Station QR Code", X_BASE, 470)
    ids["MakeReservation"] = usecase(p, reg, "MakeReservation", "Make Reservation", X_BASE, 542)
    ids["MakeRecurringReservation"] = usecase(p, reg, "MakeRecurringReservation", "Make Recurring Reservation", X_BASE, 614)
    ids["CheckInAtStation"] = usecase(p, reg, "CheckInAtStation", "Check In At Station", X_BASE, 686)
    ids["CancelReservation"] = usecase(p, reg, "CancelReservation", "Cancel Reservation", X_BASE, 758)
    ids["StartChargingSession"] = usecase(p, reg, "StartChargingSession", "Start Charging Session", X_BASE, 830)
    ids["EndChargingSession"] = usecase(p, reg, "EndChargingSession", "End Charging Session", X_BASE, 902)
    ids["PayInvoice"] = usecase(p, reg, "PayInvoice", "Pay Invoice", X_BASE, 974)
    ids["TopUpWallet"] = usecase(p, reg, "TopUpWallet", "Top Up Wallet", X_BASE, 1046)
    ids["RedeemLoyaltyPoints"] = usecase(p, reg, "RedeemLoyaltyPoints", "Redeem Loyalty Points", X_BASE, 1118)
    ids["SubmitStationReview"] = usecase(p, reg, "SubmitStationReview", "Submit Station Review", X_BASE, 1190)
    ids["ManageVehicle"] = usecase(p, reg, "ManageVehicle", "Manage Vehicle", X_BASE, 1262)

    # ---- Shared use case (Customer + Technician + Web Push) ----
    ids["ReceiveNotification"] = usecase(p, reg, "ReceiveNotification", "Receive Notification", X_BASE, 1360)

    # ---- Technician band ----
    ids["Technician"] = actor(p, reg, "Technician", "Technician", X_ACTOR, 1445)
    ids["UpdateMaintenanceTicket"] = usecase(p, reg, "UpdateMaintenanceTicket", "Update Maintenance Ticket", X_BASE, 1470)

    # ---- Admin band ----
    ids["Admin"] = actor(p, reg, "Admin", "Admin", X_ACTOR, 1770)
    ids["CreateMaintenanceTicket"] = usecase(p, reg, "CreateMaintenanceTicket", "Create Maintenance Ticket", X_BASE, 1560)
    ids["AssignTechnician"] = usecase(p, reg, "AssignTechnician", "Assign Technician", X_BASE, 1632)
    ids["ManageStationsAndSlots"] = usecase(p, reg, "ManageStationsAndSlots", "Manage Stations And Slots", X_BASE, 1704)
    ids["ConfigureTariff"] = usecase(p, reg, "ConfigureTariff", "Configure Tariff", X_BASE, 1776)
    ids["ManageVouchers"] = usecase(p, reg, "ManageVouchers", "Manage Vouchers", X_BASE, 1848)
    ids["ViewRevenueDashboard"] = usecase(p, reg, "ViewRevenueDashboard", "View Revenue Dashboard", X_BASE, 1920)
    ids["ModerateReviews"] = usecase(p, reg, "ModerateReviews", "Moderate Reviews", X_BASE, 1992)
    ids["ManageFleetsAndUsers"] = usecase(p, reg, "ManageFleetsAndUsers", "Manage Fleets And Users", X_BASE, 2064)

    # ---- Right column: include / extend targets ----
    ids["CheckSlotAvailability"] = usecase(p, reg, "CheckSlotAvailability", "Check Slot Availability", X_RIGHT, 542)
    ids["GenerateInvoice"] = usecase(p, reg, "GenerateInvoice", "Generate Invoice", X_RIGHT, 902)
    ids["CheckWalletBalance"] = usecase(p, reg, "CheckWalletBalance", "Check Wallet Balance", X_RIGHT, 974)
    ids["ProcessVnpayPayment"] = usecase(p, reg, "ProcessVnpayPayment", "Process VNPay Payment", X_RIGHT, 1046)
    ids["ApplyVoucher"] = usecase(p, reg, "ApplyVoucher", "Apply Voucher", X_RIGHT, 1118)
    ids["VerifyChargingHistory"] = usecase(p, reg, "VerifyChargingHistory", "Verify Charging History", X_RIGHT, 1190)

    # ---- Scheduler use cases (right column, lower) ----
    ids["AutoCancelExpiredReservations"] = usecase(p, reg, "AutoCancelExpiredReservations", "Auto-Cancel Expired Reservations", X_RIGHT, 1620)
    ids["SendReservationReminder"] = usecase(p, reg, "SendReservationReminder", "Send Reservation Reminder", X_RIGHT, 1692)

    # ---- Secondary actors (right, beside their use cases) ----
    ids["VNPayGateway"] = actor(p, reg, "VNPayGateway", "VNPay Gateway", X_SEC, 1000, ext=True)
    ids["WebPushService"] = actor(p, reg, "WebPushService", "Web Push Service", X_SEC, 1315, ext=True)
    ids["CronScheduler"] = actor(p, reg, "CronScheduler", "Cron Scheduler", X_SEC, 1610, ext=True)

    reg.bind_ids(ids)

    def gen(child, parent, **kw):
        reg.connect(p, child, parent, "", S_GEN, **kw)

    def assoc(a, uc, side="E"):
        # left actors exit East into the lane; secondary actors exit West.
        d = "W" if side == "E" else "E"
        reg.connect(p, a, uc, "", S_ASSOC, s_side=side, d_side=d)

    def include(src, dst):
        reg.connect(p, src, dst, "<<include>>", S_INCLUDE)

    def extend(src, dst):
        reg.connect(p, src, dst, "<<extend>>", S_EXTEND)

    # ---- Actor generalizations ----
    gen("Customer", "Guest")                  # adjacent in actor column
    gen("Driver", "Customer")
    # long jumps routed through the empty left margin so they clear the
    # Customer/Driver actor boxes sitting between them and Guest.
    gen("Technician", "Guest", s_side="W", d_side="W", points=[(20, 1490), (20, 240)])
    gen("Admin", "Guest", s_side="W", d_side="W", points=[(30, 1815), (30, 250)])

    # ---- Guest-level associations (inherited by all primary actors) ----
    for uc in ("Register", "Login", "ResetPassword", "SearchStations", "ViewStationDetails"):
        assoc("Guest", uc)

    # ---- Customer associations ----
    for uc in ("ScanStationQrCode", "MakeReservation", "MakeRecurringReservation",
               "CheckInAtStation", "CancelReservation", "StartChargingSession",
               "EndChargingSession", "PayInvoice", "TopUpWallet",
               "RedeemLoyaltyPoints", "SubmitStationReview", "ManageVehicle",
               "ReceiveNotification"):
        assoc("Customer", uc)

    # ---- Technician associations ----
    assoc("Technician", "UpdateMaintenanceTicket")
    assoc("Technician", "ReceiveNotification")

    # ---- Admin associations ----
    for uc in ("CreateMaintenanceTicket", "AssignTechnician", "ManageStationsAndSlots",
               "ConfigureTariff", "ManageVouchers", "ViewRevenueDashboard",
               "ModerateReviews", "ManageFleetsAndUsers"):
        assoc("Admin", uc)

    # ---- Secondary actor associations (exit West toward their use cases) ----
    assoc("VNPayGateway", "ProcessVnpayPayment", side="W")
    assoc("WebPushService", "ReceiveNotification", side="W")
    assoc("CronScheduler", "AutoCancelExpiredReservations", side="W")
    assoc("CronScheduler", "SendReservationReminder", side="W")

    # ---- include (always-invoked sub use cases) ----
    include("MakeReservation", "CheckSlotAvailability")
    include("EndChargingSession", "GenerateInvoice")
    include("PayInvoice", "CheckWalletBalance")
    include("TopUpWallet", "ProcessVnpayPayment")
    include("SubmitStationReview", "VerifyChargingHistory")

    # ---- extend (optional / conditional behavior) ----
    extend("ScanStationQrCode", "ViewStationDetails")
    extend("MakeRecurringReservation", "MakeReservation")
    extend("ApplyVoucher", "PayInvoice")
    extend("AssignTechnician", "CreateMaintenanceTicket")

    return p


def build_all():
    p = build()
    os.makedirs(OUT_DIR, exist_ok=True)
    write_file(os.path.join(OUT_DIR, "02-UseCaseDiagram.drawio"), [p])


if __name__ == "__main__":
    build_all()
    print("=== DONE USE CASE DIAGRAM ===")
