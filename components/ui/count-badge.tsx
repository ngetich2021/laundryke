import { cn } from "@/lib/utils";

/** Small numbered pill for "N unread/pending" indicators next to nav labels. */
export function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex h-4 min-w-4 shrink-0 animate-in items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold leading-none text-white shadow-sm ring-2 ring-background zoom-in-50 duration-300",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
