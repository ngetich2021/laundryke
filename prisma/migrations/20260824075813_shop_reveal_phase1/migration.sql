-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "videoSource" TEXT,
    "videoUrl" TEXT,
    "imageUrl" TEXT,
    "tiktokUrl" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "promotedUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Listing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Listing" ("address", "businessName", "createdAt", "description", "id", "imageUrl", "isActive", "latitude", "longitude", "ownerId", "phone", "promotedUntil", "updatedAt", "videoSource", "videoUrl") SELECT "address", "businessName", "createdAt", "description", "id", "imageUrl", "isActive", "latitude", "longitude", "ownerId", "phone", "promotedUntil", "updatedAt", "videoSource", "videoUrl" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
CREATE INDEX "Listing_ownerId_idx" ON "Listing"("ownerId");
CREATE INDEX "Listing_isActive_createdAt_idx" ON "Listing"("isActive", "createdAt");
CREATE INDEX "Listing_isActive_promotedUntil_idx" ON "Listing"("isActive", "promotedUntil");
CREATE TABLE "new_PriceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "listingId" TEXT,
    "label" TEXT NOT NULL,
    "priceKes" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PriceItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PriceItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PriceItem" ("createdAt", "id", "label", "ownerId", "priceKes", "updatedAt") SELECT "createdAt", "id", "label", "ownerId", "priceKes", "updatedAt" FROM "PriceItem";
DROP TABLE "PriceItem";
ALTER TABLE "new_PriceItem" RENAME TO "PriceItem";
CREATE INDEX "PriceItem_ownerId_idx" ON "PriceItem"("ownerId");
CREATE INDEX "PriceItem_listingId_idx" ON "PriceItem"("listingId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
