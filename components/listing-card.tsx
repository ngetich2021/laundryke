"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PromotedBadge } from "@/components/badge-star";
import { CallButton } from "@/components/call-button";
import { ShopDetailsDialog, SocialBadges } from "@/components/shop-details-dialog";
import type { ActiveListing } from "@/lib/listings-data";

export function ListingCard({ listing }: { listing: ActiveListing }) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-1.5">
            <CardTitle className="text-base">{listing.businessName}</CardTitle>
            {listing.isPromoted && <PromotedBadge />}
            <SocialBadges listing={listing} />
          </div>
          <CardDescription className="line-clamp-3">{listing.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {listing.distanceKm !== null && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" /> {listing.distanceKm.toFixed(1)} km away
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {listing.phone && <CallButton phone={listing.phone} />}
            <Button size="sm" variant="outline" onClick={() => setDetailsOpen(true)}>
              More details
            </Button>
          </div>
        </CardContent>
      </Card>

      <ShopDetailsDialog listing={listing} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </>
  );
}
