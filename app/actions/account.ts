"use server";

import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema, normalizeKenyanPhone } from "@/lib/validations";

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function getMyProfile() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, phone: true, locationDescription: true },
  });
}

export async function updateProfile(input: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      phone: normalizeKenyanPhone(parsed.data.phone),
      locationDescription: parsed.data.locationDescription || null,
    },
  });

  revalidatePath("/dashboard");
  return { success: true as const };
}
