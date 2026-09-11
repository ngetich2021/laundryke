"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { recordAnalyticsEvent } from "@/app/actions/analytics";
import { cn } from "@/lib/utils";

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
}

export function CallButton({ phone, listingId }: { phone: string; listingId?: string }) {
  const [mobile, setMobile] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Device type is only knowable client-side — detect after mount so the
  // server-rendered and first client-rendered pass stay identical
  // (avoids a hydration mismatch).
  useEffect(() => {
    setMobile(isMobileDevice());
  }, []);

  if (revealed) {
    return (
      <p className="flex items-center gap-2 text-sm font-medium">
        <Phone className="size-4" /> {phone}
      </p>
    );
  }

  if (mobile) {
    return (
      <a
        href={`tel:${phone}`}
        onClick={(e) => {
          e.stopPropagation();
          recordAnalyticsEvent("CALL_CLICK", listingId);
        }}
        className={cn(buttonVariants({ size: "sm", variant: "outline" }), "gap-1.5")}
      >
        <Phone className="size-4" />
        Call
      </a>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="gap-1.5"
      onClick={(e) => {
        e.stopPropagation();
        setRevealed(true);
        recordAnalyticsEvent("CALL_CLICK", listingId);
      }}
    >
      <Phone className="size-4" />
      Call
    </Button>
  );
}
