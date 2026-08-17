-- CreateIndex
CREATE INDEX "ChargingSession_status_idx" ON "ChargingSession"("status");

-- CreateIndex
CREATE INDEX "Invoice_userId_status_idx" ON "Invoice"("userId", "status");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Reservation_slotId_status_startTime_idx" ON "Reservation"("slotId", "status", "startTime");

-- CreateIndex
CREATE INDEX "WalletTransaction_userId_idx" ON "WalletTransaction"("userId");

