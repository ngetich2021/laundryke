"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guards";
import { referralOfferSchema } from "@/lib/validations";

export async function setReferralOffer(listingId: string, input: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = referralOfferSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, ownerId: session.user.id },
  });
  if (!listing) return { error: { root: ["Listing not found"] } };

  const { rewardType, value, description, isActive } = parsed.data;

  await prisma.listing.update({
    where: { id: listingId },
    data: {
      referralRewardType: isActive ? rewardType : null,
      referralRewardValue: isActive ? value : null,
      referralDescription: description || null,
    },
  });

  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function getMyReferralOffers() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.listing.findMany({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      businessName: true,
      referralRewardType: true,
      referralRewardValue: true,
      referralDescription: true,
      referralClickCount: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// Public: called from the referral banner when someone lands on ?ref=<id>.
// Deliberately minimal fields — no owner/contact data beyond what's already
// public on the listing itself.
export async function getReferralListing(listingId: string) {
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, isActive: true, referralRewardType: { not: null } },
    select: {
      id: true,
      businessName: true,
      phone: true,
      imageUrl: true,
      referralRewardType: true,
      referralRewardValue: true,
      referralDescription: true,
    },
  });
  return listing ?? null;
}

// Public, approximate counter (no per-visitor tracking — see privacy policy).
export async function recordReferralClick(listingId: string) {
  await prisma.listing
    .update({
      where: { id: listingId },
      data: { referralClickCount: { increment: 1 } },
    })
    .catch(() => {
      // Listing may no longer exist/qualify — not worth surfacing an error.
    });
}

export async function getAllReferralOffersForAdmin() {
  await requirePermission("MANAGE_SUPPORT");
  return prisma.listing.findMany({
    where: { referralRewardType: { not: null } },
    select: {
      id: true,
      businessName: true,
      referralRewardType: true,
      referralRewardValue: true,
      referralDescription: true,
      referralClickCount: true,
      owner: { select: { name: true, email: true } },
    },
    orderBy: { referralClickCount: "desc" },
  });
}
