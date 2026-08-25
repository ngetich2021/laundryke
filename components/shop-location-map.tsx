"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "@/lib/leaflet-setup";

export function ShopLocationMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const position: [number, number] = [latitude, longitude];
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-40 w-full overflow-hidden rounded-lg border">
        <MapContainer center={position} zoom={15} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <Marker position={position} />
        </MapContainer>
      </div>
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-xs font-medium text-primary hover:underline"
      >
        Open in Google Maps
      </a>
    </div>
  );
}
