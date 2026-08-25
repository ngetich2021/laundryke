"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { VideoPlayer, VideoPlayerFallback } from "@/components/video-player";
import { ShopDetailsDialog } from "@/components/shop-details-dialog";
import { getYoutubeThumbnail } from "@/lib/youtube";
import type { FeaturedListing } from "@/lib/listings-data";

// How long each featured video gets before rotating to the next one.
const ROTATE_INTERVAL_MS = 20_000;

export function HeroBanner({ featured }: { featured: FeaturedListing[] }) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Reset playback when the set of featured listings changes (e.g. a new
  // promotion goes live), rather than in an effect — see "adjusting state
  // when a prop changes" in the React docs.
  const featuredKey = featured.map((listing) => listing.id).join(",");
  const [prevFeaturedKey, setPrevFeaturedKey] = useState(featuredKey);
  if (featuredKey !== prevFeaturedKey) {
    setPrevFeaturedKey(featuredKey);
    setIndex(0);
    setIsPlaying(false);
  }

  const current = featured[index] ?? null;

  // Loop through every paid video in turn (1 -> z -> 1 ...). With only one
  // paid video there's nothing to rotate to, so it just keeps looping itself.
  useEffect(() => {
    if (!isPlaying || featured.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % featured.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isPlaying, featured.length]);

  function handleClick() {
    if (!current) return;
    if (isPlaying) {
      setDetailsOpen(true);
    } else {
      setIsPlaying(true);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4">
      <h1 className="py-6 text-center text-2xl font-bold tracking-tight sm:text-3xl">
        we ensure you are always tidy
      </h1>
      <div className="relative aspect-40/9 w-full overflow-hidden rounded-xl border bg-muted shadow-sm">
        {current ? (
          <>
            {isPlaying ? (
              <VideoPlayer
                key={current.id}
                source={current.videoSource!}
                url={current.videoUrl!}
                title={current.businessName}
                autoPlay
                loop
              />
            ) : (
              <FeaturedPoster listing={current} />
            )}

            <button
              type="button"
              onClick={handleClick}
              aria-label={
                isPlaying ? `View details for ${current.businessName}` : `Play featured video`
              }
              className="absolute inset-0 h-full w-full cursor-pointer bg-transparent"
            />

            {!isPlaying && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-black/50 p-4">
                  <Play className="size-8 fill-white text-white" />
                </div>
              </div>
            )}
          </>
        ) : (
          <VideoPlayerFallback />
        )}
      </div>
      {current && (
        <p className="pt-2 text-center text-sm text-muted-foreground">
          Featured: <span className="font-medium text-foreground">{current.businessName}</span>
        </p>
      )}

      {current && (
        <ShopDetailsDialog listing={current} open={detailsOpen} onOpenChange={setDetailsOpen} />
      )}
    </div>
  );
}

function FeaturedPoster({ listing }: { listing: FeaturedListing }) {
  const thumbnail =
    listing.videoSource === "YOUTUBE" && listing.videoUrl
      ? getYoutubeThumbnail(listing.videoUrl)
      : listing.imageUrl;

  if (!thumbnail) return <VideoPlayerFallback />;

  return (
    // Remote thumbnail (YouTube or Cloudinary) — no next/image remote pattern configured.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={thumbnail} alt={listing.businessName} className="h-full w-full object-cover" />
  );
}
