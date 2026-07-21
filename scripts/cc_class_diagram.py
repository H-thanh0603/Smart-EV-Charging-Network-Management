# -*- coding: utf-8 -*-
"""
Class Diagram (OOP, OMG UML 2.x) for V-GREEN EV Charging.
Source: GIOI_THIEU_DO_AN.md section 9 (data model), excluding the
Notification & Integration sub-domain's Webhook / WebhookLog / ApiKey
(third-party API-integration management, out of scope per request).

Output: Diagrams/claude_code/01-ClassDiagram.drawio
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from cc_common import (
    OUT_DIR, Page, write_file, BoxRegistry,
    S_ASSOC, S_AGGREGATION, S_COMPOSITION, S_DEPENDENCY,
)

ROW_H = 15


def class_box(p, reg, name, attrs, methods, x, y, w=250):
    body_attrs = "<br/>".join(attrs) if attrs else "&#160;"
    body_methods = "<br/>".join(methods) if methods else "&#160;"
    value = f"<b>{name}</b><hr/>{body_attrs}<hr/>{body_methods}"
    h = 34 + len(attrs) * ROW_H + len(methods) * ROW_H + 16
    style = ("rounded=0;whiteSpace=wrap;html=1;fillColor=#f8f9fa;strokeColor=#343a40;"
             "fontSize=11;align=left;spacing=6;verticalAlign=top;")
    cid = p.vertex(p.nid("c"), value, style, x, y, w, h)
    reg.register(name, x, y, w, h)
    return cid


def build_v2():
    p = Page("01-ClassDiagram", w=2600, h=1700)
    reg = BoxRegistry()
    ids = {}

    def cb(name, attrs, methods, x, y, w=250):
        ids[name] = class_box(p, reg, name, attrs, methods, x, y, w)

    p.vertex(p.nid("t"), "Class Diagram - V-GREEN EV Charging (Core Domain, excludes API/Webhook Integration)",
              "text;html=1;fontSize=18;fontStyle=1;align=left;verticalAlign=middle;", 30, 8, 1300, 30)
    p.vertex(p.nid("nt"),
             "Assumption: role kept as User.role attribute, no subclass hierarchy (see design note in summary).",
             "text;html=1;fontSize=10;fontStyle=2;fontColor=#666666;align=left;verticalAlign=middle;", 30, 40, 900, 24)

    cb("User", [
        "-id: string", "-email: string {unique}", "-password: string", "-name: string", "-phone: string",
        "-role: string {CUSTOMER|DRIVER|TECHNICIAN|ADMIN}", "-loyaltyPoints: int",
        "-loyaltyTier: string {BRONZE|SILVER|GOLD|PLATINUM}", "-fleetId: string {FK, nullable}",
    ], [
        "+changePassword(oldPwd: string, newPwd: string): boolean",
        "+updateProfile(name: string, phone: string): void",
        "+hasRole(role: string): boolean",
        "+upgradeTier(): void",
    ], 40, 100, 300)

    cb("Station", [
        "-id: string", "-name: string", "-address: string", "-city: string", "-lat: float", "-lng: float",
        "-status: string", "-rating: float", "-reviewCount: int", "-brand: string",
    ], [
        "+updateRating(newRating: float): void",
        "+isOperational(): boolean",
    ], 40, 420, 280)

    cb("Slot", [
        "-id: string", "-slotNumber: string", "-connectorType: string", "-powerKw: float",
        "-status: string {AVAILABLE|OCCUPIED|CHARGING|MAINTENANCE}", "-qrCode: string {unique}", "-stationId: string {FK}",
    ], [
        "+isAvailable(): boolean",
        "+reserve(): void",
        "+release(): void",
    ], 400, 420, 280)

    cb("Reservation", [
        "-id: string", "-userId: string {FK}", "-slotId: string {FK}", "-startTime: datetime",
        "-endTime: datetime", "-status: string {PENDING|CONFIRMED|COMPLETED|CANCELLED}", "-recurringId: string {FK, nullable}",
    ], [
        "+overlapsWith(other: Reservation): boolean",
        "+isCheckinExpired(): boolean",
        "+confirm(): void",
        "+cancel(): void",
    ], 40, 660, 300)

    cb("RecurringReservation", [
        "-id: string", "-userId: string {FK}", "-slotId: string {FK}", "-daysOfWeek: string",
        "-startHour: int", "-endHour: int", "-active: boolean",
    ], [
        "+generateNextReservation(): Reservation",
        "+deactivate(): void",
    ], 400, 660, 280)

    cb("ChargingSession", [
        "-id: string", "-userId: string {FK}", "-slotId: string {FK}", "-reservationId: string {FK, unique}",
        "-startTime: datetime", "-endTime: datetime", "-energyKwh: float", "-status: string {ACTIVE|COMPLETED}",
    ], [
        "+calculateEnergyKwh(powerKw: float): float",
        "+complete(): void",
    ], 40, 940, 300)

    cb("Wallet", [
        "-id: string", "-userId: string {FK, unique}", "-balance: float",
    ], [
        "+deposit(amount: float): void",
        "+withdraw(amount: float): boolean",
        "+hasSufficientBalance(amount: float): boolean",
    ], 800, 100, 260)

    cb("WalletTransaction", [
        "-id: string", "-userId: string {FK}", "-type: string {TOPUP|PAYMENT|REFUND}", "-amount: float",
        "-balance: float", "-note: string", "-paymentId: string {FK, nullable}",
    ], [], 1140, 100, 280)

    cb("Payment", [
        "-id: string", "-userId: string {FK}", "-txnRef: string {unique}", "-amount: float",
        "-status: string {PENDING|SUCCESS|FAILED}", "-provider: string", "-responseCode: string",
    ], [
        "+verifySignature(secureHash: string): boolean",
        "+markSuccess(): void",
        "+markFailed(): void",
    ], 1140, 360, 280)

    cb("Invoice", [
        "-id: string", "-invoiceNo: string {unique}", "-sessionId: string {FK, unique}", "-userId: string {FK}",
        "-subtotal: float", "-discount: float", "-amount: float", "-status: string {UNPAID|PAID}", "-paidAt: datetime",
    ], [
        "+applyVoucher(voucher: Voucher): void",
        "+markAsPaid(): void",
        "+generatePdf(): string",
    ], 800, 660, 300)

    cb("Tariff", [
        "-id: string", "-name: string", "-startHour: int", "-endHour: int",
        "-ratePerKwh: float", "-isPeak: boolean", "-active: boolean",
    ], [
        "+appliesTo(hour: int): boolean",
    ], 1140, 660, 260)

    cb("LoyaltyTransaction", [
        "-id: string", "-userId: string {FK}", "-type: string {EARN|REDEEM|ADJUST}",
        "-points: int", "-balance: int", "-reason: string",
    ], [], 1500, 100, 280)

    cb("Voucher", [
        "-id: string", "-code: string {unique}", "-name: string", "-type: string {PERCENT|FIXED}",
        "-value: float", "-minAmount: float", "-maxDiscount: float", "-usageLimit: int",
        "-perUserLimit: int", "-validFrom: datetime", "-validUntil: datetime", "-active: boolean", "-usedCount: int",
    ], [
        "+isValidFor(amount: float, userUsageCount: int): boolean",
        "+calculateDiscount(amount: float): float",
    ], 1500, 380, 300)

    cb("VoucherUsage", [
        "-id: string", "-voucherId: string {FK}", "-userId: string {FK}", "-invoiceId: string {FK}", "-discount: float",
    ], [], 1500, 760, 280)

    cb("MaintenanceTicket", [
        "-id: string", "-stationId: string {FK}", "-slotId: string {FK, nullable}", "-title: string",
        "-priority: string {LOW|MEDIUM|HIGH|CRITICAL}", "-status: string {OPEN|IN_PROGRESS|RESOLVED|CLOSED}",
        "-createdById: string {FK}", "-assignedToId: string {FK, nullable}", "-resolvedAt: datetime",
    ], [
        "+assignTo(technicianId: string): void",
        "+resolve(): void",
        "+close(): void",
    ], 400, 1220, 320)

    cb("Fleet", [
        "-id: string", "-name: string", "-code: string {unique}", "-discountRate: float", "-active: boolean",
    ], [
        "+calculateDiscountedAmount(amount: float): float",
    ], 40, 1440, 280)

    cb("Vehicle", [
        "-id: string", "-userId: string {FK}", "-fleetId: string {FK, nullable}", "-brand: string",
        "-model: string", "-licensePlate: string {unique}", "-connectorType: string",
    ], [
        "+isCompatibleWith(slot: Slot): boolean",
    ], 780, 1220, 280)

    cb("Review", [
        "-id: string", "-userId: string {FK}", "-stationId: string {FK}", "-rating: int",
        "-comment: string", "-verified: boolean",
    ], [
        "+isVerifiedPurchase(): boolean",
    ], 1900, 100, 280)

    cb("Notification", [
        "-id: string", "-userId: string {FK}", "-title: string", "-message: string",
        "-type: string", "-read: boolean", "-link: string",
    ], [
        "+markAsRead(): void",
    ], 1900, 380, 280)

    cb("PushSubscription", [
        "-id: string", "-userId: string {FK}", "-endpoint: string {unique}", "-p256dh: string", "-auth: string",
    ], [], 1900, 620, 280)

    reg.bind_ids(ids)

    # Composition (part cannot exist without whole)
    reg.connect(p, "User", "Wallet", "1          1", S_COMPOSITION)
    reg.connect(p, "Station", "Slot", "1          0..*", S_COMPOSITION)
    reg.connect(p, "Reservation", "ChargingSession", "1          0..1", S_COMPOSITION)
    reg.connect(p, "ChargingSession", "Invoice", "1          0..1", S_COMPOSITION)

    # Aggregation (weak ownership, part can exist independently)
    reg.connect(p, "Fleet", "User", "1          0..*", S_AGGREGATION)
    reg.connect(p, "Fleet", "Vehicle", "1          0..*", S_AGGREGATION)

    # Associations
    reg.connect(p, "User", "Reservation", "1          0..*", S_ASSOC)
    reg.connect(p, "Slot", "Reservation", "1          0..*", S_ASSOC)
    reg.connect(p, "User", "RecurringReservation", "1          0..*", S_ASSOC)
    reg.connect(p, "Slot", "RecurringReservation", "1          0..*", S_ASSOC)
    reg.connect(p, "RecurringReservation", "Reservation", "1          0..*", S_ASSOC)
    reg.connect(p, "User", "ChargingSession", "1          0..*", S_ASSOC)
    reg.connect(p, "Slot", "ChargingSession", "1          0..*", S_ASSOC)
    reg.connect(p, "User", "Invoice", "1          0..*", S_ASSOC)
    reg.connect(p, "User", "WalletTransaction", "1          0..*", S_ASSOC)
    reg.connect(p, "Payment", "WalletTransaction", "0..1          0..*", S_ASSOC)
    reg.connect(p, "User", "Payment", "1          0..*", S_ASSOC)
    reg.connect(p, "User", "LoyaltyTransaction", "1          0..*", S_ASSOC)
    reg.connect(p, "Voucher", "VoucherUsage", "1          0..*", S_ASSOC)
    reg.connect(p, "User", "VoucherUsage", "1          0..*", S_ASSOC)
    reg.connect(p, "Invoice", "VoucherUsage", "1          0..*", S_ASSOC)
    reg.connect(p, "Station", "MaintenanceTicket", "1          0..*", S_ASSOC)
    reg.connect(p, "Slot", "MaintenanceTicket", "0..1          0..*", S_ASSOC)
    reg.connect(p, "User", "MaintenanceTicket", "1          0..*", S_ASSOC)
    reg.connect(p, "User", "Review", "1          0..*", S_ASSOC)
    reg.connect(p, "Station", "Review", "1          0..*", S_ASSOC)
    reg.connect(p, "User", "Notification", "1          0..*", S_ASSOC)
    reg.connect(p, "User", "PushSubscription", "1          0..*", S_ASSOC)
    reg.connect(p, "User", "Vehicle", "1          0..*", S_ASSOC)

    # Dependency (uses, no stored FK)
    reg.connect(p, "ChargingSession", "Tariff", "", S_DEPENDENCY)
    reg.connect(p, "Invoice", "Tariff", "", S_DEPENDENCY)
    reg.connect(p, "Invoice", "Voucher", "", S_DEPENDENCY)

    return p


def build_all():
    p = build_v2()
    os.makedirs(OUT_DIR, exist_ok=True)
    write_file(os.path.join(OUT_DIR, "01-ClassDiagram.drawio"), [p])


if __name__ == "__main__":
    build_all()
    print("=== DONE CLASS DIAGRAM ===")
