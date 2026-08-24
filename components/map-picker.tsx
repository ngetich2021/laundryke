"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TILE_LAYERS = {
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },
} as const;

type Coordinates = { latitude: number; longitude: number };

const DEFAULT_CENTER: [number, number] = [-1.286389, 36.817223];

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 15);
  }, [position, map]);
  return null;
}

export function MapPicker({
  initial,
  onConfirm,
}: {
  initial?: Coordinates | null;
  onConfirm: (coords: Coordinates) => void;
}) {
  const [layer, setLayer] = useState<keyof typeof TILE_LAYERS>("satellite");
  const [marker, setMarker] = useState<Coordinates | null>(initial ?? null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  function handleUseMyLocation() {
    setGeoError(null);
    if (!("geolocation" in navigator)) {
      setGeoError("Your browser doesn't support location detection");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setMarker(coords);
        setFlyTarget([coords.latitude, coords.longitude]);
        setLocating(false);
      },
      () => {
        setGeoError("Couldn't get your location. Tap the map to drop a pin instead.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const center: [number, number] = marker ? [marker.latitude, marker.longitude] : DEFAULT_CENTER;
  const tiles = TILE_LAYERS[layer];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex gap-1 rounded-lg border p-0.5">
          <Button
            type="button"
            size="sm"
            variant={layer === "satellite" ? "default" : "ghost"}
            onClick={() => setLayer("satellite")}
          >
            Satellite
          </Button>
          <Button
            type="button"
            size="sm"
            variant={layer === "street" ? "default" : "ghost"}
            onClick={() => setLayer("street")}
          >
            Street
          </Button>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleUseMyLocation}
          disabled={locating}
        >
          {locating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LocateFixed className="size-4" />
          )}
          Use my location
        </Button>
      </div>

      <div className="h-56 w-full overflow-hidden rounded-lg border">
        <MapContainer center={center} zoom={marker ? 15 : 12} scrollWheelZoom className="h-full w-full">
          <TileLayer url={tiles.url} attribution={tiles.attribution} />
          <ClickHandler onPick={(lat, lng) => setMarker({ latitude: lat, longitude: lng })} />
          <FlyTo position={flyTarget} />
          {marker && <Marker position={[marker.latitude, marker.longitude]} />}
        </MapContainer>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Tap the map to drop a pin before confirming.
      </p>
      {geoError && <p className="text-center text-sm text-destructive">{geoError}</p>}

      <Button type="button" disabled={!marker} onClick={() => marker && onConfirm(marker)}>
        Confirm location
      </Button>
    </div>
  );
}
