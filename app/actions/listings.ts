"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listingSchema } from "@/lib/validations";
import { getActiveListings } from "@/lib/listings-data";
import type { ListingInput } from "@/lib/validations";

// A shop only shows up in public search once it has the minimum a customer
// needs to actually visit it. No separate "publish" step — filling these
// in is what makes it live.
function isListingComplete(data: ListingInput) {
  return Boolean(data.businessName.trim() && data.phone && data.latitude != null && data.longitude != null);
}

export async function searchListings(origin?: {
  latitude: number;
  longitude: number;
}) {
  return getActiveListings(origin);
}

export async function createListing(input: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (!session.user.phone) {
    return {
      error: {
        _contact: ["Add a contact phone number in Settings before posting a listing."],
      },
    };
  }

  const parsed = listingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const isActive = isListingComplete(parsed.data);

  await prisma.listing.create({
    data: { ...parsed.data, ownerId: session.user.id, isActive },
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function updateListing(listingId: string, input: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = listingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.listing.findFirst({
    where: { id: listingId, ownerId: session.user.id },
  });
  if (!existing) throw new Error("Not found");

  const isActive = isListingComplete(parsed.data);

  await prisma.listing.update({ where: { id: listingId }, data: { ...parsed.data, isActive } });

  revalidatePath("/");
  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function deleteListing(listingId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const existing = await prisma.listing.findFirst({
    where: {
      id: listingId,
      ...(session.user.role === "ADMIN" ? {} : { ownerId: session.user.id }),
    },
  });
  if (!existing) throw new Error("Not found");

  await prisma.listing.delete({ where: { id: listingId } });

  revalidatePath("/");
  revalidatePath("/dashboard");
}

export async function getMyListings() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.listing.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
}
