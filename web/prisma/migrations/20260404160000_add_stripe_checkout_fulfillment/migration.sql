-- CreateTable
CREATE TABLE "StripeCheckoutFulfillment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stripeSessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entitlementId" TEXT,
    "planId" TEXT NOT NULL,
    "bookSlug" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StripeCheckoutFulfillment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StripeCheckoutFulfillment_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "Entitlement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "StripeCheckoutFulfillment_stripeSessionId_key" ON "StripeCheckoutFulfillment"("stripeSessionId");

-- CreateIndex
CREATE INDEX "StripeCheckoutFulfillment_userId_createdAt_idx" ON "StripeCheckoutFulfillment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "StripeCheckoutFulfillment_status_createdAt_idx" ON "StripeCheckoutFulfillment"("status", "createdAt");
