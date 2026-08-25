-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "videoPromotedUntil" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "includesVideo" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "merchantRequestId" TEXT,
    "checkoutRequestId" TEXT,
    "mpesaReceipt" TEXT,
    "resultDesc" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "checkoutRequestId", "createdAt", "days", "id", "listingId", "merchantRequestId", "mpesaReceipt", "phone", "resultDesc", "status", "updatedAt", "userId") SELECT "amount", "checkoutRequestId", "createdAt", "days", "id", "listingId", "merchantRequestId", "mpesaReceipt", "phone", "resultDesc", "status", "updatedAt", "userId" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_checkoutRequestId_key" ON "Payment"("checkoutRequestId");
CREATE INDEX "Payment_listingId_idx" ON "Payment"("listingId");
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Listing_isActive_videoPromotedUntil_idx" ON "Listing"("isActive", "videoPromotedUntil");
