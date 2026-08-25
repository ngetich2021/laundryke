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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PromotedBadge } from "@/components/badge-star";
import { FacebookBadge, InstagramBadge, TikTokBadge } from "@/components/social-badges";
import { CallButton } from "@/components/call-button";
import type { ActiveListing } from "@/lib/listings-data";

function SocialBadges({ listing }: { listing: ActiveListing }) {
  return (
    <>
      {listing.facebookUrl && (
        <a
          href={listing.facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <FacebookBadge />
        </a>
      )}
      {listing.instagramUrl && (
        <a
          href={listing.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <InstagramBadge />
        </a>
      )}
      {listing.tiktokUrl && (
        <a
          href={listing.tiktokUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <TikTokBadge />
        </a>
      )}
    </>
  );
}

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

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-1.5">
              {listing.businessName}
              {listing.isPromoted && <PromotedBadge />}
              <SocialBadges listing={listing} />
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-sm">
            <p className="text-muted-foreground">{listing.description}</p>
            {listing.address && (
              <p className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0" /> {listing.address}
              </p>
            )}
            {listing.priceItems.length > 0 ? (
              <ul className="flex flex-col gap-1 rounded-lg border bg-muted/50 p-3">
                {listing.priceItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">KES {item.priceKes}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No services listed yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
