"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { MapPin, LocateFixed, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const MapPicker = dynamic(() => import("@/components/map-picker").then((m) => m.MapPicker), {
  ssr: false,
  loading: () => <Skeleton className="h-56 w-full rounded-lg" />,
});

type Coordinates = { latitude: number; longitude: number };

export function LocationPicker({
  onLocate,
}: {
  onLocate: (coords: Coordinates) => void;
}) {
  const [isLocating, startLocating] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  function handleAutoPick() {
    setGeoError(null);
    if (!("geolocation" in navigator)) {
      setGeoError("Your browser doesn't support location detection");
      return;
    }
    startLocating(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onLocate({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        () => setGeoError("Couldn't get your location. Try picking it on the map instead."),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  function handleConfirm(coords: Coordinates) {
    onLocate(coords);
    setDialogOpen(false);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button type="button" variant="secondary" onClick={handleAutoPick} disabled={isLocating}>
        {isLocating ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LocateFixed className="size-4" />
        )}
        Auto pick
      </Button>
      <span className="text-sm text-muted-foreground">or</span>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger render={<Button type="button" variant="outline" />}>
          <MapPin className="size-4" />
          Enter coordinates
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Find your location</DialogTitle>
          </DialogHeader>
          <MapPicker onConfirm={handleConfirm} />
        </DialogContent>
      </Dialog>
      {geoError && <p className="w-full text-center text-sm text-destructive">{geoError}</p>}
    </div>
  );
}
