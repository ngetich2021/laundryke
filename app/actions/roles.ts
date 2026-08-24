"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guards";
import { PERMISSIONS } from "@/lib/permissions";

const roleSchema = z.object({
  name: z.string().trim().min(2, "Too short").max(40, "Too long"),
  permissions: z.array(z.enum(PERMISSIONS)).min(1, "Pick at least one permission"),
});

export async function getAllRoles() {
  await requirePermission("MANAGE_ROLES");
  return prisma.customRole.findMany({
    include: { permissions: true, _count: { select: { users: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRoleOptions() {
  await requirePermission("MANAGE_USERS");
  return prisma.customRole.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function createRole(input: unknown) {
  await requirePermission("MANAGE_ROLES");
  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.customRole.create({
    data: {
      name: parsed.data.name,
      permissions: { create: parsed.data.permissions.map((permission) => ({ permission })) },
    },
  });

  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function updateRole(roleId: string, input: unknown) {
  await requirePermission("MANAGE_ROLES");
  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId } }),
    prisma.customRole.update({
      where: { id: roleId },
      data: {
        name: parsed.data.name,
        permissions: { create: parsed.data.permissions.map((permission) => ({ permission })) },
      },
    }),
  ]);

  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function deleteRole(roleId: string) {
  await requirePermission("MANAGE_ROLES");
  await prisma.customRole.delete({ where: { id: roleId } });
  revalidatePath("/dashboard");
}
