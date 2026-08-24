import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { getActiveListingsCount, getFeaturedListing } from "@/lib/listings-data";
import { getMyListings } from "@/app/actions/listings";
import { getMyPayments } from "@/app/actions/payments";
import { getMyProfile } from "@/app/actions/account";
import {
  getAllUsers,
  getAllListingsForAdmin,
  getAllPaymentsForAdmin,
  getAllPricesForAdmin,
} from "@/app/actions/admin";
import { getAllRoles, getRoleOptions } from "@/app/actions/roles";
import { DashboardShell } from "@/components/dashboard-shell";
import { PERMISSIONS, hasPermission, type PermissionKey } from "@/lib/permissions";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const me = session.user;
  const permissions: PermissionKey[] =
    me.role === "ADMIN" ? [...PERMISSIONS] : me.permissions;

  const canUsers = hasPermission(me, "MANAGE_USERS");
  const canListings = hasPermission(me, "MANAGE_LISTINGS");
  const canPayments = hasPermission(me, "MANAGE_PAYMENTS");
  const canPricing = hasPermission(me, "MANAGE_PRICING");
  const canRoles = hasPermission(me, "MANAGE_ROLES");

  const [
    count,
    featured,
    myListings,
    myPayments,
    myProfile,
    adminUsers,
    adminListings,
    adminPayments,
    adminPrices,
    adminRoles,
    roleOptions,
  ] = await Promise.all([
    getActiveListingsCount(),
    getFeaturedListing(),
    getMyListings(),
    getMyPayments(),
    getMyProfile(),
    canUsers ? getAllUsers() : Promise.resolve(null),
    canListings ? getAllListingsForAdmin() : Promise.resolve(null),
    canPayments ? getAllPaymentsForAdmin() : Promise.resolve(null),
    canPricing ? getAllPricesForAdmin() : Promise.resolve(null),
    canRoles ? getAllRoles() : Promise.resolve(null),
    canUsers ? getRoleOptions() : Promise.resolve(null),
  ]);

  return (
    <>
      <SiteHeader />
      <DashboardShell
        user={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: session.user.role,
        }}
        myProfile={myProfile}
        initialCount={count}
        featured={featured}
        myListings={myListings}
        myPayments={myPayments}
        permissions={permissions}
        adminUsers={adminUsers}
        adminListings={adminListings}
        adminPayments={adminPayments}
        adminPrices={adminPrices}
        adminRoles={adminRoles}
        roleOptions={roleOptions}
      />
    </>
  );
}
