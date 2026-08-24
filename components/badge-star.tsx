import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function PromotedBadge({ className }: { className?: string }) {
  return (
    <span
      title="Promoted"
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-600 ring-2 ring-background",
        className
      )}
    >
      <Star className="size-3 fill-white text-white" />
    </span>
  );
}
