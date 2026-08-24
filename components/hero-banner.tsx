import { VideoPlayer, VideoPlayerFallback } from "@/components/video-player";

export function HeroBanner({
  featured,
}: {
  featured: {
    businessName: string;
    videoSource: "YOUTUBE" | "UPLOAD" | null;
    videoUrl: string | null;
  } | null;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4">
      <h1 className="py-6 text-center text-2xl font-bold tracking-tight sm:text-3xl">
        we ensure you are always tidy
      </h1>
      <div className="aspect-40/9 w-full overflow-hidden rounded-xl border bg-muted shadow-sm">
        {featured?.videoSource && featured.videoUrl ? (
          <VideoPlayer
            source={featured.videoSource}
            url={featured.videoUrl}
            title={featured.businessName}
          />
        ) : (
          <VideoPlayerFallback />
        )}
      </div>
      {featured && (
        <p className="pt-2 text-center text-sm text-muted-foreground">
          Featured: <span className="font-medium text-foreground">{featured.businessName}</span>
        </p>
      )}
    </div>
  );
}
