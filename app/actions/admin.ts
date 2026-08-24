"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guards";

export async function getAllUsers() {
  await requirePermission("MANAGE_USERS");
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      phone: true,
      locationDescription: true,
      createdAt: true,
      customRole: { select: { id: true, name: true } },
    },
  });
}

export async function setUserRole(userId: string, role: "USER" | "ADMIN") {
  const session = await requirePermission("MANAGE_USERS");
  if (session.user.id === userId && role === "USER") {
    throw new Error("You cannot demote yourself");
  }
  await prisma.user.update({ where: { id: userId }, data: { role, customRoleId: null } });
  revalidatePath("/dashboard");
}

export async function assignCustomRole(userId: string, customRoleId: string | null) {
  await requirePermission("MANAGE_USERS");
  await prisma.user.update({
    where: { id: userId },
    data: { customRoleId, role: "USER" },
  });
  revalidatePath("/dashboard");
}

export async function getAllListingsForAdmin() {
  await requirePermission("MANAGE_LISTINGS");
  return prisma.listing.findMany({
    include: { owner: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function toggleListingActive(listingId: string, isActive: boolean) {
  await requirePermission("MANAGE_LISTINGS");
  await prisma.listing.update({ where: { id: listingId }, data: { isActive } });
  revalidatePath("/");
  revalidatePath("/dashboard");
}

export async function adminDeleteListing(listingId: string) {
  await requirePermission("MANAGE_LISTINGS");
  await prisma.listing.delete({ where: { id: listingId } });
  revalidatePath("/");
  revalidatePath("/dashboard");
}

export async function getAllPaymentsForAdmin() {
  await requirePermission("MANAGE_PAYMENTS");
  return prisma.payment.findMany({
    include: {
      listing: { select: { businessName: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllPricesForAdmin() {
  await requirePermission("MANAGE_PRICING");
  return prisma.priceItem.findMany({
    include: {
      listing: {
        select: { businessName: true, owner: { select: { name: true, email: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
