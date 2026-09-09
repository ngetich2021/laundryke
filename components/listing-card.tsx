"use client";

import { useState } from "react";
import { MapPin, Gift } from "lucide-react";
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
          <div className="flex items-center gap-2">
            {listing.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.imageUrl}
                alt=""
                className="size-8 shrink-0 rounded-md border object-cover"
              />
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              <CardTitle className="text-base">{listing.businessName}</CardTitle>
              {listing.isPromoted && <PromotedBadge />}
              <SocialBadges listing={listing} />
            </div>
          </div>
          <CardDescription className="line-clamp-3">{listing.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {listing.distanceKm !== null && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" /> {listing.distanceKm.toFixed(1)} km away
            </p>
          )}

          {listing.referralRewardType && (
            <p className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
              <Gift className="size-3" />
              {listing.referralRewardType === "PERCENTAGE"
                ? `Refer a friend, get ${listing.referralRewardValue}% off`
                : `Refer a friend, get KES ${listing.referralRewardValue} off`}
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
