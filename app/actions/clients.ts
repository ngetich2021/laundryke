"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clientSchema, visitSchema } from "@/lib/validations";

async function requireOwnedListing(listingId: string, userId: string) {
  const listing = await prisma.listing.findFirst({ where: { id: listingId, ownerId: userId } });
  if (!listing) throw new Error("Not found");
  return listing;
}

async function requireOwnedClient(clientId: string, userId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, listing: { ownerId: userId } },
  });
  if (!client) throw new Error("Not found");
  return client;
}

export async function createClient(listingId: string, input: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await requireOwnedListing(listingId, session.user.id);

  const { name, phone, email, notes } = parsed.data;
  await prisma.client.create({
    data: {
      listingId,
      name,
      phone: phone || null,
      email: email || null,
      notes: notes || null,
    },
  });

  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function updateClient(clientId: string, input: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await requireOwnedClient(clientId, session.user.id);

  const { name, phone, email, notes } = parsed.data;
  await prisma.client.update({
    where: { id: clientId },
    data: { name, phone: phone || null, email: email || null, notes: notes || null },
  });

  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function deleteClient(clientId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await requireOwnedClient(clientId, session.user.id);
  await prisma.client.delete({ where: { id: clientId } });

  revalidatePath("/dashboard");
}

export async function getMyClients(listingId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await requireOwnedListing(listingId, session.user.id);

  return prisma.client.findMany({
    where: { listingId },
    include: { _count: { select: { visits: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getClientDetail(clientId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const client = await prisma.client.findFirst({
    where: { id: clientId, listing: { ownerId: session.user.id } },
    include: { visits: { orderBy: { visitedAt: "desc" } } },
  });
  if (!client) throw new Error("Not found");
  return client;
}

export async function logVisit(clientId: string, input: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = visitSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const client = await requireOwnedClient(clientId, session.user.id);

  await prisma.visit.create({
    data: {
      clientId,
      listingId: client.listingId,
      amountKes: parsed.data.amountKes ?? null,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function getClientStats(listingId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await requireOwnedListing(listingId, session.user.id);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalClients, visitsThisMonth, revenueAgg] = await Promise.all([
    prisma.client.count({ where: { listingId } }),
    prisma.visit.count({ where: { listingId, visitedAt: { gte: startOfMonth } } }),
    prisma.visit.aggregate({
      where: { listingId, visitedAt: { gte: startOfMonth } },
      _sum: { amountKes: true },
    }),
  ]);

  return {
    totalClients,
    visitsThisMonth,
    revenueThisMonthKes: revenueAgg._sum.amountKes ?? 0,
  };
}
