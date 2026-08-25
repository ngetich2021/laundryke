"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Store } from "lucide-react";
import { LocationPicker } from "@/components/location-picker";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchListings } from "@/app/actions/listings";
import type { ActiveListing } from "@/lib/listings-data";

export function ListingGrid({ initialCount }: { initialCount: number }) {
  const [listings, setListings] = useState<ActiveListing[] | null>(null);
  const [hasLocated, setHasLocated] = useState(false);
  const [radiusKm, setRadiusKm] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleLocate(coords: { latitude: number; longitude: number }) {
    startTransition(async () => {
      const results = await searchListings(coords);
      setListings(results);
      setHasLocated(true);
      setRevealed(false);
    });
  }

  const visibleListings = useMemo(() => {
    if (!listings) return [];
    // No radius typed yet: default to an easy walk-in range. Once the
    // customer types an explicit radius, that's the actual search — apply
    // it to everyone. Badge listings still get shown first (see the sort
    // in getActiveListings) but never at a nonsensical distance.
    const cutoff = radiusKm === 0 ? 0.5 : radiusKm;
    return listings.filter((l) => (l.distanceKm ?? Infinity) <= cutoff);
  }, [listings, radiusKm]);

  const radiusLabel = radiusKm === 0 ? null : `${radiusKm} km`;
  const resultMessage =
    visibleListings.length === 0
      ? radiusLabel
        ? `No laundry found within ${radiusLabel}.`
        : "No laundry found nearby."
      : `${visibleListings.length} laundr${visibleListings.length === 1 ? "y" : "ies"} ${
          radiusLabel ? `within ${radiusLabel}` : "nearby"
        }`;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <LocationPicker onLocate={handleLocate} />

      <div className="mt-6 flex flex-col items-center gap-4">
        {isPending ? (
          <div className="flex justify-center py-6 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : !hasLocated ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="size-4" /> {initialCount} laundr{initialCount === 1 ? "y" : "ies"}{" "}
            listed
          </p>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">Within</span>
              <Input
                type="number"
                min={0}
                step="any"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Math.max(0, Number(e.target.value) || 0))}
                className="w-20"
              />
              <span className="text-muted-foreground">
                km {radiusKm === 0 && "(any distance)"}
              </span>
            </div>

            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Store className="size-4" /> {resultMessage}
            </p>

            {!revealed && visibleListings.length > 0 && (
              <Button onClick={() => setRevealed(true)}>View laundry</Button>
            )}
          </>
        )}
      </div>

      {hasLocated && !isPending && revealed && (
        <div className="mt-6">
          {visibleListings.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">{resultMessage}</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
              {visibleListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
