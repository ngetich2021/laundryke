/*
  Warnings:

  - You are about to drop the column `ownerId` on the `PriceItem` table. All the data in the column will be lost.
  - Made the column `listingId` on table `PriceItem` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PriceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "priceKes" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PriceItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PriceItem" ("createdAt", "id", "label", "listingId", "priceKes", "updatedAt") SELECT "createdAt", "id", "label", "listingId", "priceKes", "updatedAt" FROM "PriceItem";
DROP TABLE "PriceItem";
ALTER TABLE "new_PriceItem" RENAME TO "PriceItem";
CREATE INDEX "PriceItem_listingId_idx" ON "PriceItem"("listingId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
