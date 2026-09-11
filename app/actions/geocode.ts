"use server";

// Hosts we'll follow when a pasted string turns out to be a link rather
// than raw coordinates or a place name — e.g. a location shared via
// WhatsApp, which forwards as a Google/Apple Maps URL (sometimes a
// maps.app.goo.gl short link that redirects to the real one).
const MAP_LINK_HOSTS = ["google.com", "goo.gl", "maps.apple.com"];

function isMapLinkHost(hostname: string): boolean {
  return MAP_LINK_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

function isValidCoords(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

// Covers the coordinate shapes that show up in map links and plain paste:
// Google's detailed place data (!3d..!4d..), q=/ll= query params, the
// @lat,lng path segment, and a bare "lat,lng" string.
const COORD_PATTERNS = [
  /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
  /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
  /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
  /@(-?\d+\.\d+),(-?\d+\.\d+)/,
  /^\s*(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/,
];

function parseCoordinatesFromText(text: string): { latitude: number; longitude: number } | null {
  for (const pattern of COORD_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (isValidCoords(latitude, longitude)) return { latitude, longitude };
  }
  return null;
}

export type LocationInputResult =
  | { type: "coords"; latitude: number; longitude: number; label?: string }
  | { type: "error"; message: string };

// Accepts a raw "lat,lng" pair, a shared Google/Apple Maps link (including
// WhatsApp's forwarded short links), or a free-text place name like
// "Nairobi" or "Laikipia" — resolved via Nominatim, biased to Kenya.
export async function resolveLocationInput(input: string): Promise<LocationInputResult> {
  const trimmed = input.trim();
  if (!trimmed) return { type: "error", message: "Enter a place name or paste a location link" };

  const direct = parseCoordinatesFromText(trimmed);
  if (direct) return { type: "coords", ...direct };

  let url: URL | null = null;
  try {
    url = new URL(trimmed);
  } catch {
    url = null;
  }

  if (url && (url.protocol === "http:" || url.protocol === "https:")) {
    if (!isMapLinkHost(url.hostname)) {
      return { type: "error", message: "That link isn't a supported maps link" };
    }
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: { "User-Agent": "LaundryListingsApp/1.0" },
        signal: AbortSignal.timeout(6000),
      });
      const fromFinalUrl = parseCoordinatesFromText(res.url || url.toString());
      if (fromFinalUrl) return { type: "coords", ...fromFinalUrl };

      const body = await res.text();
      const fromBody = parseCoordinatesFromText(body.slice(0, 20000));
      if (fromBody) return { type: "coords", ...fromBody };
    } catch {
      // fall through to the error below
    }
    return { type: "error", message: "Couldn't read that location link" };
  }

  try {
    const searchUrl = new URL("https://nominatim.openstreetmap.org/search");
    searchUrl.searchParams.set("format", "jsonv2");
    searchUrl.searchParams.set("q", trimmed);
    searchUrl.searchParams.set("countrycodes", "ke");
    searchUrl.searchParams.set("limit", "1");

    const res = await fetch(searchUrl, {
      headers: { "User-Agent": "LaundryListingsApp/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { type: "error", message: "Couldn't find that place" };

    const data = await res.json();
    const first = Array.isArray(data) ? data[0] : null;
    if (!first) return { type: "error", message: `Couldn't find "${trimmed}"` };

    const latitude = Number(first.lat);
    const longitude = Number(first.lon);
    if (!isValidCoords(latitude, longitude)) {
      return { type: "error", message: `Couldn't find "${trimmed}"` };
    }

    return { type: "coords", latitude, longitude, label: first.display_name };
  } catch {
    return { type: "error", message: "Couldn't search for that place right now" };
  }
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("zoom", "18");

    const res = await fetch(url, {
      headers: { "User-Agent": "LaundryListingsApp/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    return typeof data?.display_name === "string" ? data.display_name : null;
  } catch {
    return null;
  }
}
