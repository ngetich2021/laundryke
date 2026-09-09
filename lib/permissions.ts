export const PERMISSIONS = [
  "MANAGE_USERS",
  "MANAGE_LISTINGS",
  "MANAGE_PAYMENTS",
  "MANAGE_PRICING",
  "MANAGE_ROLES",
  "MANAGE_SUPPORT",
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  MANAGE_USERS: "Manage users",
  MANAGE_LISTINGS: "Manage listings",
  MANAGE_PAYMENTS: "Manage payments",
  MANAGE_PRICING: "Manage pricing",
  MANAGE_ROLES: "Manage roles",
  MANAGE_SUPPORT: "Manage support, feedback & referrals",
};

export type PermissionedUser = {
  role: "USER" | "ADMIN";
  permissions: PermissionKey[];
};

export function hasPermission(
  user: PermissionedUser | null | undefined,
  permission: PermissionKey
): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return user.permissions.includes(permission);
}

export function isAdminLike(user: PermissionedUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === "ADMIN" || user.permissions.length > 0;
}
