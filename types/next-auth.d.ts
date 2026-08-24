import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/generated/prisma/client";
import type { PermissionKey } from "@/lib/permissions";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      phone: string | null;
      permissions: PermissionKey[];
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/types" {
  interface User {
    role: Role;
    phone: string | null;
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: Role;
    phone: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    phone: string | null;
    permissions: PermissionKey[];
    permissionsFetchedAt: number;
  }
}
