import "server-only";
import { prisma } from "@/lib/prisma";
import { haversineDistanceKm } from "@/lib/distance";

export async function getActiveListings(origin?: {
  latitude: number;
  longitude: number;
}) {
  const listings = await prisma.listing.findMany({
    where: { isActive: true },
    include: {
      owner: { select: { name: true, image: true } },
      priceItems: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();

  const withDistance = listings.map((listing) => ({
    ...listing,
    isPromoted: !!listing.promotedUntil && listing.promotedUntil.getTime() > now,
    distanceKm:
      origin && listing.latitude != null && listing.longitude != null
        ? haversineDistanceKm(origin.latitude, origin.longitude, listing.latitude, listing.longitude)
        : null,
  }));

  withDistance.sort((a, b) => {
    if (a.isPromoted !== b.isPromoted) return a.isPromoted ? -1 : 1;
    if (a.distanceKm !== null && b.distanceKm !== null) {
      return a.distanceKm - b.distanceKm;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return withDistance;
}

export type ActiveListing = Awaited<ReturnType<typeof getActiveListings>>[number];

export async function getActiveListingsCount() {
  return prisma.listing.count({ where: { isActive: true } });
}

export async function getFeaturedListings() {
  const listings = await prisma.listing.findMany({
    where: {
      isActive: true,
      videoUrl: { not: null },
      videoSource: { not: null },
      videoPromotedUntil: { gt: new Date() },
    },
    include: {
      priceItems: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { videoPromotedUntil: "desc" },
  });

  const now = Date.now();

  return listings.map((listing) => ({
    ...listing,
    isPromoted: !!listing.promotedUntil && listing.promotedUntil.getTime() > now,
    distanceKm: null,
  }));
}

export type FeaturedListing = Awaited<ReturnType<typeof getFeaturedListings>>[number];
