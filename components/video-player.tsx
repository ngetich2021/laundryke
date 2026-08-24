import { WashingMachine } from "lucide-react";
import { getYoutubeEmbedUrl } from "@/lib/youtube";

export function VideoPlayer({
  source,
  url,
  title,
}: {
  source: "YOUTUBE" | "UPLOAD";
  url: string;
  title: string;
}) {
  if (source === "YOUTUBE") {
    const embedUrl = getYoutubeEmbedUrl(url);
    if (embedUrl) {
      return (
        <iframe
          className="h-full w-full"
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
  }

  return (
    <video className="h-full w-full object-cover" src={url} controls playsInline />
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
