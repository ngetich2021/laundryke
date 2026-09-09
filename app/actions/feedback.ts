"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guards";
import { feedbackSchema } from "@/lib/validations";

export async function submitFeedback(input: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.feedback.create({
    data: { userId: session.user.id, ...parsed.data },
  });

  return { success: true as const };
}

export async function getMyFeedback() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.feedback.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllFeedbackForAdmin() {
  await requirePermission("MANAGE_SUPPORT");
  return prisma.feedback.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
}
