"use client";

import { useState } from "react";
import {
  Search,
  PlusSquare,
  Megaphone,
  Settings,
  UserRound,
  ShieldCheck,
  Tag,
  LifeBuoy,
  Gift,
  Users,
  Store,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CountBadge } from "@/components/ui/count-badge";
import { HeroBanner } from "@/components/hero-banner";
import { ListingGrid } from "@/components/listing-grid";
import { PostListingPanel } from "@/components/post-listing-panel";
import { AdvertisePanel } from "@/components/advertise-panel";
import { SettingsPanel } from "@/components/settings-panel";
import { AccountPanel } from "@/components/account-panel";
import { AdminPanel } from "@/components/admin-panel";
import { PricingPanel } from "@/components/pricing-panel";
import { SupportPanel } from "@/components/support-panel";
import { ReferralsPanel } from "@/components/referrals-panel";
import { ClientsPanel } from "@/components/clients-panel";
import { isAdminLike, type PermissionKey } from "@/lib/permissions";
import { countUnread } from "@/lib/support-unread";
import type { Listing, Payment, PriceItem, RolePermission } from "@/lib/generated/prisma/client";
import type { FeaturedListing } from "@/lib/listings-data";
import type { getMyTickets, getAllTicketsForAdmin } from "@/app/actions/support";
import type { getMyFeedback, getAllFeedbackForAdmin } from "@/app/actions/feedback";
import type { getMyReferralOffers, getAllReferralOffersForAdmin } from "@/app/actions/referrals";
import type { getRecentHealthLogs } from "@/app/actions/health";
import type { AdminChatMessage } from "@/components/admin-support-panel";

type PaymentWithListing = Payment & { listing: { businessName: string } };

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "USER" | "ADMIN";
  phone: string | null;
  locationDescription: string | null;
  createdAt: Date;
  customRole: { id: string; name: string } | null;
};

type AdminListing = {
  id: string;
  businessName: string;
  description: string;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  promotedUntil: Date | null;
  createdAt: Date;
  owner: { name: string | null; email: string };
};

type AdminPayment = Payment & {
  listing: { businessName: string };
  user: { name: string | null; email: string };
};

type AdminPriceItem = PriceItem & {
  listing: { businessName: string; owner: { name: string | null; email: string } };
};

type AdminRole = {
  id: string;
  name: string;
  createdAt: Date;
  permissions: RolePermission[];
  _count: { users: number };
};

type RoleOption = { id: string; name: string };

// Compact icon+label style shared by every top-level tab trigger.
const TAB_TRIGGER_CLASS =
  "h-full min-w-16 shrink-0 flex-col gap-1 rounded-none text-xs";

export function DashboardShell({
  user,
  myProfile,
  initialCount,
  featured,
  myListings,
  myPayments,
  permissions,
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
}: {
  user: {
    id: string;
    name: string | null | undefined;
    email: string | null | undefined;
    image: string | null | undefined;
    role: "USER" | "ADMIN";
  };
  myProfile: { name: string | null; phone: string | null; locationDescription: string | null };
  initialCount: number;
  featured: FeaturedListing[];
  myListings: Listing[];
  myPayments: PaymentWithListing[];
  permissions: PermissionKey[];
  adminUsers: AdminUser[] | null;
  adminListings: AdminListing[] | null;
  adminPayments: AdminPayment[] | null;
  adminPrices: AdminPriceItem[] | null;
  adminRoles: AdminRole[] | null;
  roleOptions: RoleOption[] | null;
  myTickets: Awaited<ReturnType<typeof getMyTickets>>;
  myFeedback: Awaited<ReturnType<typeof getMyFeedback>>;
  myReferralOffers: Awaited<ReturnType<typeof getMyReferralOffers>>;
  adminTickets: Awaited<ReturnType<typeof getAllTicketsForAdmin>> | null;
  adminFeedback: Awaited<ReturnType<typeof getAllFeedbackForAdmin>> | null;
  adminChatMessages: AdminChatMessage[] | null;
  adminReferralOffers: Awaited<ReturnType<typeof getAllReferralOffersForAdmin>> | null;
  healthLogs: Awaited<ReturnType<typeof getRecentHealthLogs>> | null;
}) {
  const [tab, setTab] = useState("browse");
  const [accountTab, setAccountTab] = useState("profile");
  const showAdminTab = isAdminLike({ role: user.role, permissions });

  const myTicketUnread = countUnread(myTickets, "USER");
  const adminTicketUnread = adminTickets ? countUnread(adminTickets, "ADMIN") : 0;

  function goToSettings() {
    setTab("account");
    setAccountTab("settings");
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as string)}
      className="flex flex-1 flex-col gap-0"
    >
      <HeroBanner featured={featured} />

      <TabsList
        variant="line"
        className="sticky top-0 z-20 h-14 w-full justify-around gap-0 overflow-x-auto rounded-none border-y bg-background/95 p-0 backdrop-blur"
      >
        <TabsTrigger value="browse" className={TAB_TRIGGER_CLASS}>
          <Search className="size-4" />
          Browse
        </TabsTrigger>
        <TabsTrigger value="shop" className={TAB_TRIGGER_CLASS}>
          <Store className="size-4" />
          shop
        </TabsTrigger>
        <TabsTrigger value="clients" className={TAB_TRIGGER_CLASS}>
          <Users className="size-4" />
          clients
        </TabsTrigger>
        <TabsTrigger value="support" className={TAB_TRIGGER_CLASS}>
          <span className="relative">
            <LifeBuoy className="size-4" />
            {myTicketUnread > 0 && (
              <CountBadge count={myTicketUnread} className="absolute -top-2 -right-2" />
            )}
          </span>
          support
        </TabsTrigger>
        <TabsTrigger value="account" className={TAB_TRIGGER_CLASS}>
          <UserRound className="size-4" />
          account
        </TabsTrigger>
        {showAdminTab && (
          <TabsTrigger value="admin" className={TAB_TRIGGER_CLASS}>
            <span className="relative">
              <ShieldCheck className="size-4" />
              {adminTicketUnread > 0 && (
                <CountBadge count={adminTicketUnread} className="absolute -top-2 -right-2" />
              )}
            </span>
            admin
          </TabsTrigger>
        )}
      </TabsList>

      <div className="flex-1">
        <TabsContent value="browse" className="mt-0">
          <ListingGrid initialCount={initialCount} />
        </TabsContent>

        <TabsContent value="shop" className="mt-0 px-4 py-6">
          <Tabs defaultValue="post" className="mx-auto w-full max-w-3xl">
            <TabsList variant="line">
              <TabsTrigger value="post" className="gap-1.5">
                <PlusSquare className="size-4" /> Post
              </TabsTrigger>
              <TabsTrigger value="pricing" className="gap-1.5">
                <Tag className="size-4" /> Pricing
              </TabsTrigger>
              <TabsTrigger value="advertise" className="gap-1.5">
                <Megaphone className="size-4" /> Advertise
              </TabsTrigger>
              <TabsTrigger value="referrals" className="gap-1.5">
                <Gift className="size-4" /> Referrals
              </TabsTrigger>
            </TabsList>

            <TabsContent value="post" className="mt-4">
              <PostListingPanel
                initialListings={myListings}
                hasContact={!!myProfile.phone}
                onNavigateToSettings={goToSettings}
              />
            </TabsContent>

            <TabsContent value="pricing" className="mt-4">
              <PricingPanel listings={myListings} />
            </TabsContent>

            <TabsContent value="advertise" className="mt-4">
              <AdvertisePanel listings={myListings} payments={myPayments} />
            </TabsContent>

            <TabsContent value="referrals" className="mt-4">
              <ReferralsPanel listings={myReferralOffers} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="clients" className="mt-0 px-4 py-6">
          <ClientsPanel listings={myListings} />
        </TabsContent>

        <TabsContent value="support" className="mt-0 px-4 py-6">
          <SupportPanel initialTickets={myTickets} initialFeedback={myFeedback} />
        </TabsContent>

        <TabsContent value="account" className="mt-0 px-4 py-6">
          <Tabs
            value={accountTab}
            onValueChange={(value) => setAccountTab(value as string)}
            className="mx-auto w-full max-w-2xl"
          >
            <TabsList variant="line">
              <TabsTrigger value="profile" className="gap-1.5">
                <UserRound className="size-4" /> Profile
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5">
                <Settings className="size-4" /> Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-4">
              <AccountPanel name={user.name} email={user.email} image={user.image} role={user.role} />
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <SettingsPanel
                name={myProfile.name ?? ""}
                phone={myProfile.phone ?? ""}
                locationDescription={myProfile.locationDescription ?? ""}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {showAdminTab && (
          <TabsContent value="admin" className="mt-0 px-4 py-6">
            <AdminPanel
              users={adminUsers ?? []}
              listings={adminListings ?? []}
              payments={adminPayments ?? []}
              prices={adminPrices ?? []}
              roles={adminRoles ?? []}
              roleOptions={roleOptions ?? []}
              currentUserId={user.id}
              permissions={permissions}
              tickets={adminTickets ?? []}
              feedback={adminFeedback ?? []}
              chatMessages={adminChatMessages ?? []}
              referralOffers={adminReferralOffers ?? []}
              healthLogs={healthLogs ?? []}
            />
          </TabsContent>
        )}
      </div>
    </Tabs>
  );
}
