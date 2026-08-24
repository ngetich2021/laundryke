"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { priceItemSchema } from "@/lib/validations";

async function requireOwnedListing(listingId: string, userId: string) {
  const listing = await prisma.listing.findFirst({ where: { id: listingId, ownerId: userId } });
  if (!listing) throw new Error("Not found");
  return listing;
}

export async function getMyPrices(listingId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await requireOwnedListing(listingId, session.user.id);

  return prisma.priceItem.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPriceItem(listingId: string, input: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await requireOwnedListing(listingId, session.user.id);

  const parsed = priceItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.priceItem.create({
    data: { ...parsed.data, listingId },
  });

  revalidatePath("/dashboard");
  revalidatePath("/");
  return { success: true as const };
}

export async function updatePriceItem(priceItemId: string, input: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = priceItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.priceItem.findFirst({
    where: { id: priceItemId, listing: { ownerId: session.user.id } },
  });
  if (!existing) throw new Error("Not found");

  await prisma.priceItem.update({ where: { id: priceItemId }, data: parsed.data });

  revalidatePath("/dashboard");
  revalidatePath("/");
  return { success: true as const };
}

export async function deletePriceItem(priceItemId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const existing = await prisma.priceItem.findFirst({
    where: { id: priceItemId, listing: { ownerId: session.user.id } },
  });
  if (!existing) throw new Error("Not found");

  await prisma.priceItem.delete({ where: { id: priceItemId } });

  revalidatePath("/dashboard");
  revalidatePath("/");
}
