import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { getActiveListingsCount, getFeaturedListings } from "@/lib/listings-data";
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
import { getMyTickets, getAllTicketsForAdmin, getAllChatMessagesForAdmin } from "@/app/actions/support";
import { getMyFeedback, getAllFeedbackForAdmin } from "@/app/actions/feedback";
import { getMyReferralOffers, getAllReferralOffersForAdmin } from "@/app/actions/referrals";
import { getRecentHealthLogs } from "@/app/actions/health";
import { getAnalyticsSummary } from "@/app/actions/analytics";
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
  const canSupport = hasPermission(me, "MANAGE_SUPPORT");

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
    myTickets,
    myFeedback,
    myReferralOffers,
    adminTickets,
    adminFeedback,
    adminChatMessages,
    adminReferralOffers,
    healthLogs,
    analyticsSummary,
  ] = await Promise.all([
    getActiveListingsCount(),
    getFeaturedListings(),
    getMyListings(),
    getMyPayments(),
    getMyProfile(),
    canUsers ? getAllUsers() : Promise.resolve(null),
    canListings ? getAllListingsForAdmin() : Promise.resolve(null),
    canPayments ? getAllPaymentsForAdmin() : Promise.resolve(null),
    canPricing ? getAllPricesForAdmin() : Promise.resolve(null),
    canRoles ? getAllRoles() : Promise.resolve(null),
    canUsers ? getRoleOptions() : Promise.resolve(null),
    getMyTickets(),
    getMyFeedback(),
    getMyReferralOffers(),
    canSupport ? getAllTicketsForAdmin() : Promise.resolve(null),
    canSupport ? getAllFeedbackForAdmin() : Promise.resolve(null),
    canSupport ? getAllChatMessagesForAdmin() : Promise.resolve(null),
    canSupport ? getAllReferralOffersForAdmin() : Promise.resolve(null),
    canSupport ? getRecentHealthLogs() : Promise.resolve(null),
    canSupport ? getAnalyticsSummary() : Promise.resolve(null),
  ]);

  return (
    <DashboardShell
      header={<SiteHeader />}
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
      myTickets={myTickets}
      myFeedback={myFeedback}
      myReferralOffers={myReferralOffers}
      adminTickets={adminTickets}
      adminFeedback={adminFeedback}
      adminChatMessages={adminChatMessages}
      adminReferralOffers={adminReferralOffers}
      healthLogs={healthLogs}
      analyticsSummary={analyticsSummary}
    />
  );
}
