"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { campaignTargetSchema } from "@/lib/validations";
import type { CampaignTarget } from "@/lib/generated/prisma/client";

async function requireOwnedListing(listingId: string, userId: string) {
  const listing = await prisma.listing.findFirst({ where: { id: listingId, ownerId: userId } });
  if (!listing) throw new Error("Not found");
  return listing;
}

async function requireOwnedCampaign(campaignId: string, userId: string) {
  const campaign = await prisma.campaignTarget.findFirst({
    where: { id: campaignId, listing: { ownerId: userId } },
  });
  if (!campaign) throw new Error("Not found");
  return campaign;
}

async function computeCurrentValue(target: CampaignTarget): Promise<number> {
  const range = { gte: target.startDate, lte: target.endDate };

  switch (target.metric) {
    case "NEW_CLIENTS":
      return prisma.client.count({ where: { listingId: target.listingId, createdAt: range } });
    case "VISITS":
      return prisma.visit.count({ where: { listingId: target.listingId, visitedAt: range } });
    case "REVENUE_KES": {
      const agg = await prisma.visit.aggregate({
        where: { listingId: target.listingId, visitedAt: range },
        _sum: { amountKes: true },
      });
      return agg._sum.amountKes ?? 0;
    }
    case "CUSTOM":
      return target.manualValue;
  }
}

export async function createCampaignTarget(listingId: string, input: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = campaignTargetSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await requireOwnedListing(listingId, session.user.id);

  const { title, metric, targetValue, startDate, endDate } = parsed.data;
  await prisma.campaignTarget.create({
    data: {
      listingId,
      title,
      metric,
      targetValue,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function updateCampaignTarget(campaignId: string, input: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = campaignTargetSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await requireOwnedCampaign(campaignId, session.user.id);

  const { title, metric, targetValue, startDate, endDate } = parsed.data;
  await prisma.campaignTarget.update({
    where: { id: campaignId },
    data: {
      title,
      metric,
      targetValue,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function deleteCampaignTarget(campaignId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await requireOwnedCampaign(campaignId, session.user.id);
  await prisma.campaignTarget.delete({ where: { id: campaignId } });

  revalidatePath("/dashboard");
}

export async function bumpCampaignValue(campaignId: string, delta: number) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const campaign = await requireOwnedCampaign(campaignId, session.user.id);
  if (campaign.metric !== "CUSTOM") {
    throw new Error("Only custom-metric targets can be bumped manually");
  }

  await prisma.campaignTarget.update({
    where: { id: campaignId },
    data: { manualValue: { increment: delta } },
  });

  revalidatePath("/dashboard");
}

export async function getMyCampaignTargets(listingId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await requireOwnedListing(listingId, session.user.id);

  const targets = await prisma.campaignTarget.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" },
  });

  const withProgress = await Promise.all(
    targets.map(async (target) => ({ ...target, currentValue: await computeCurrentValue(target) }))
  );

  return withProgress;
}
