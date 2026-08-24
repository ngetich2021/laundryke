"use client";

import { useState } from "react";
import { MapPin, Phone, ExternalLink } from "lucide-react";
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
import type { ActiveListing } from "@/lib/listings-data";

const SOCIAL_LINKS: { key: "tiktokUrl" | "facebookUrl" | "instagramUrl"; label: string }[] = [
  { key: "tiktokUrl", label: "TikTok" },
  { key: "facebookUrl", label: "Facebook" },
  { key: "instagramUrl", label: "Instagram" },
];

export function ListingCard({ listing }: { listing: ActiveListing }) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{listing.businessName}</CardTitle>
            {listing.isPromoted && <PromotedBadge />}
          </div>
          <CardDescription className="line-clamp-3">{listing.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {listing.distanceKm !== null && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" /> {listing.distanceKm.toFixed(1)} km away
            </p>
          )}

          {listing.phone && (
            <p className="flex items-center gap-2 text-sm font-medium">
              <Phone className="size-4" /> {listing.phone}
            </p>
          )}

          {SOCIAL_LINKS.some(({ key }) => listing[key]) && (
            <div className="flex flex-wrap gap-2">
              {SOCIAL_LINKS.map(
                ({ key, label }) =>
                  listing[key] && (
                    <a
                      key={key}
                      href={listing[key]!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {label} <ExternalLink className="size-3" />
                    </a>
                  )
              )}
            </div>
          )}

          <Button size="sm" variant="outline" onClick={() => setDetailsOpen(true)}>
            More details
          </Button>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {listing.businessName}
              {listing.isPromoted && <PromotedBadge />}
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
