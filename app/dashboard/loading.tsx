import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl px-4">
        <div className="flex justify-center py-6">
          <Skeleton className="h-7 w-64" />
        </div>
        <Skeleton className="aspect-40/9 w-full rounded-xl" />
      </div>

      <div className="flex h-14 w-full items-center justify-around gap-4 border-y px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-10" />
        ))}
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
