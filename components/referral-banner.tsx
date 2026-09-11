"use client";

import { useEffect, useState } from "react";
import { Gift, X } from "lucide-react";
import { CallButton } from "@/components/call-button";
import { WhatsappButton } from "@/components/whatsapp-button";
import { getReferralListing, recordReferralClick } from "@/app/actions/referrals";

type ReferredListing = {
  id: string;
  businessName: string;
  phone: string | null;
  imageUrl: string | null;
  referralRewardType: "PERCENTAGE" | "FIXED_AMOUNT" | null;
  referralRewardValue: number | null;
  referralDescription: string | null;
};

function rewardText(listing: ReferredListing): string {
  if (listing.referralDescription) return listing.referralDescription;
  if (listing.referralRewardType === "PERCENTAGE") {
    return `Get ${listing.referralRewardValue}% off when you mention you were referred.`;
  }
  if (listing.referralRewardType === "FIXED_AMOUNT") {
    return `Get KES ${listing.referralRewardValue} off when you mention you were referred.`;
  }
  return "";
}

export function ReferralBanner({ listingId }: { listingId: string }) {
  const [listing, setListing] = useState<ReferredListing | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getReferralListing(listingId).then((result) => {
      if (cancelled) return;
      setListing(result);
      if (!result) return;

      const dedupeKey = `drwash-ref-click-${listingId}`;
      if (!sessionStorage.getItem(dedupeKey)) {
        sessionStorage.setItem(dedupeKey, "1");
        recordReferralClick(listingId);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  if (!listing || dismissed) return null;

  return (
    <div className="mx-auto mt-4 flex w-full max-w-7xl items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm dark:border-blue-900 dark:bg-blue-950/40">
      <Gift className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
      <div className="flex-1">
        <p className="font-medium">
          You were referred to <span className="font-semibold">{listing.businessName}</span>!
        </p>
        <p className="mt-0.5 text-muted-foreground">{rewardText(listing)}</p>
        {listing.phone && (
          <div className="mt-2 flex flex-wrap gap-2">
            <CallButton phone={listing.phone} listingId={listing.id} />
            <WhatsappButton phone={listing.phone} listingId={listing.id} />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
