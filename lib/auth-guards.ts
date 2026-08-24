import "server-only";
import { auth } from "@/auth";
import { hasPermission, type PermissionKey } from "@/lib/permissions";

export async function requirePermission(permission: PermissionKey) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!hasPermission(session.user, permission)) throw new Error("Forbidden");
  return session;
}
