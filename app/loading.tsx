import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-32" />
      </header>

      <div className="mx-auto w-full max-w-3xl px-4">
        <div className="flex justify-center py-6">
          <Skeleton className="h-7 w-64" />
        </div>
        <Skeleton className="aspect-40/9 w-full rounded-xl" />
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <div className="flex justify-center">
          <Skeleton className="h-9 w-72 rounded-lg" />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
