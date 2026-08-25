"use client";

import { MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PromotedBadge } from "@/components/badge-star";
import { FacebookBadge, InstagramBadge, TikTokBadge } from "@/components/social-badges";

export type ShopDetails = {
  businessName: string;
  description: string;
  address: string | null;
  isPromoted: boolean;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  priceItems: { id: string; label: string; priceKes: number }[];
};

export function SocialBadges({ listing }: { listing: ShopDetails }) {
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

export function ShopDetailsDialog({
  listing,
  open,
  onOpenChange,
}: {
  listing: ShopDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
  );
}
