-- CreateIndex
CREATE INDEX "Listing_isActive_createdAt_idx" ON "Listing"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "Listing_isActive_promotedUntil_idx" ON "Listing"("isActive", "promotedUntil");
