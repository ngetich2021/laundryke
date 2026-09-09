"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loyaltyProgramSchema } from "@/lib/validations";

async function requireOwnedListing(listingId: string, userId: string) {
  const listing = await prisma.listing.findFirst({ where: { id: listingId, ownerId: userId } });
  if (!listing) throw new Error("Not found");
  return listing;
}

export async function setLoyaltyProgram(listingId: string, input: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = loyaltyProgramSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await requireOwnedListing(listingId, session.user.id);

  await prisma.loyaltyProgram.upsert({
    where: { listingId },
    create: { listingId, ...parsed.data },
    update: parsed.data,
  });

  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function getMyLoyaltyProgram(listingId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await requireOwnedListing(listingId, session.user.id);

  return prisma.loyaltyProgram.findUnique({ where: { listingId } });
}

export async function getLoyaltyLeaderboard(listingId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await requireOwnedListing(listingId, session.user.id);

  return prisma.client.findMany({
    where: { listingId },
    select: { id: true, name: true, phone: true, loyaltyPunches: true, loyaltyRedemptions: true },
    orderBy: { loyaltyPunches: "desc" },
  });
}

export async function addLoyaltyPunch(clientId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const client = await prisma.client.findFirst({
    where: { id: clientId, listing: { ownerId: session.user.id } },
  });
  if (!client) throw new Error("Not found");

  await prisma.client.update({
    where: { id: clientId },
    data: { loyaltyPunches: { increment: 1 } },
  });

  revalidatePath("/dashboard");
}

export async function redeemLoyaltyReward(clientId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const client = await prisma.client.findFirst({
    where: { id: clientId, listing: { ownerId: session.user.id } },
    include: { listing: { include: { loyaltyProgram: true } } },
  });
  if (!client) throw new Error("Not found");

  const required = client.listing.loyaltyProgram?.punchesRequired;
  if (!required || client.loyaltyPunches < required) {
    throw new Error("This client hasn't earned a reward yet");
  }

  await prisma.client.update({
    where: { id: clientId },
    data: {
      loyaltyPunches: { decrement: required },
      loyaltyRedemptions: { increment: 1 },
    },
  });

  revalidatePath("/dashboard");
}
