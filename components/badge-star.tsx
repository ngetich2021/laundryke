import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function PromotedBadge({ className }: { className?: string }) {
  return (
    <BadgeCheck
      className={cn("size-4 shrink-0 fill-blue-500 text-white", className)}
      aria-label="Promoted"
    />
  );
}
