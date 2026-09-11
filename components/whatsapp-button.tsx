"use client";

import { MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { recordAnalyticsEvent } from "@/app/actions/analytics";
import { normalizeKenyanPhone } from "@/lib/validations";
import { cn } from "@/lib/utils";

export function WhatsappButton({ phone, listingId }: { phone: string; listingId?: string }) {
  return (
    <a
      href={`https://wa.me/${normalizeKenyanPhone(phone)}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.stopPropagation();
        recordAnalyticsEvent("WHATSAPP_CLICK", listingId);
      }}
      className={cn(buttonVariants({ size: "sm", variant: "outline" }), "gap-1.5")}
    >
      <MessageCircle className="size-4" />
      WhatsApp
    </a>
  );
}
