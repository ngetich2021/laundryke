import { WashingMachine } from "lucide-react";
import { getYoutubeEmbedUrl, getYoutubeId } from "@/lib/youtube";

export function VideoPlayer({
  source,
  url,
  title,
  autoPlay = false,
  loop = false,
}: {
  source: "YOUTUBE" | "UPLOAD";
  url: string;
  title: string;
  autoPlay?: boolean;
  loop?: boolean;
}) {
  if (source === "YOUTUBE") {
    const embedUrl = getYoutubeEmbedUrl(url);
    if (embedUrl) {
      const params = new URLSearchParams();
      if (autoPlay) params.set("autoplay", "1");
      if (loop) {
        const id = getYoutubeId(url);
        if (id) {
          params.set("loop", "1");
          params.set("playlist", id);
        }
      }
      const query = params.toString();

      return (
        <iframe
          className="h-full w-full"
          src={query ? `${embedUrl}?${query}` : embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
  }

  return (
    <video
      className="h-full w-full object-cover"
      src={url}
      controls={!autoPlay}
      autoPlay={autoPlay}
      loop={loop}
      playsInline
    />
  );
}

export function VideoPlayerFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-linear-to-br from-teal-600 to-teal-900 text-teal-50">
      <WashingMachine className="size-12" strokeWidth={1.5} />
      <p className="text-sm font-medium">
        Promoted listings will feature their video here
      </p>
    </div>
  );
}
