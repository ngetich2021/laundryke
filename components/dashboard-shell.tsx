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
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HeroBanner } from "@/components/hero-banner";
import { ListingGrid } from "@/components/listing-grid";
import { PostListingPanel } from "@/components/post-listing-panel";
import { AdvertisePanel } from "@/components/advertise-panel";
import { SettingsPanel } from "@/components/settings-panel";
import { AccountPanel } from "@/components/account-panel";
import { AdminPanel } from "@/components/admin-panel";
import { PricingPanel } from "@/components/pricing-panel";
import { isAdminLike, type PermissionKey } from "@/lib/permissions";
import type { Listing, Payment, PriceItem, RolePermission } from "@/lib/generated/prisma/client";

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
  featured: {
    businessName: string;
    videoSource: "YOUTUBE" | "UPLOAD" | null;
    videoUrl: string | null;
  } | null;
  myListings: Listing[];
  myPayments: PaymentWithListing[];
  permissions: PermissionKey[];
  adminUsers: AdminUser[] | null;
  adminListings: AdminListing[] | null;
  adminPayments: AdminPayment[] | null;
  adminPrices: AdminPriceItem[] | null;
  adminRoles: AdminRole[] | null;
  roleOptions: RoleOption[] | null;
}) {
  const [tab, setTab] = useState("browse");
  const showAdminTab = isAdminLike({ role: user.role, permissions });

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as string)}
      className="flex flex-1 flex-col gap-0"
    >
      <HeroBanner featured={featured} />

      <TabsList
        variant="line"
        className="sticky top-0 z-20 h-14 w-full justify-around gap-0 rounded-none border-y bg-background/95 p-0 backdrop-blur"
      >
        <TabsTrigger value="browse" className="h-full flex-col gap-1 rounded-none text-xs">
          <Search className="size-4" />
          Browse
        </TabsTrigger>
        <TabsTrigger value="post" className="h-full flex-col gap-1 rounded-none text-xs">
          <PlusSquare className="size-4" />
          post
        </TabsTrigger>
        <TabsTrigger value="advertise" className="h-full flex-col gap-1 rounded-none text-xs">
          <Megaphone className="size-4" />
          advertise
        </TabsTrigger>
        <TabsTrigger value="pricing" className="h-full flex-col gap-1 rounded-none text-xs">
          <Tag className="size-4" />
          pricing
        </TabsTrigger>
        <TabsTrigger value="settings" className="h-full flex-col gap-1 rounded-none text-xs">
          <Settings className="size-4" />
          settings
        </TabsTrigger>
        <TabsTrigger value="account" className="h-full flex-col gap-1 rounded-none text-xs">
          <UserRound className="size-4" />
          Account
        </TabsTrigger>
        {showAdminTab && (
          <TabsTrigger value="admin" className="h-full flex-col gap-1 rounded-none text-xs">
            <ShieldCheck className="size-4" />
            admin
          </TabsTrigger>
        )}
      </TabsList>

      <div className="flex-1">
        <TabsContent value="browse" className="mt-0">
          <ListingGrid initialCount={initialCount} />
        </TabsContent>

        <TabsContent value="post" className="mt-0 px-4 py-6">
          <PostListingPanel
            initialListings={myListings}
            hasContact={!!myProfile.phone}
            onNavigateToSettings={() => setTab("settings")}
          />
        </TabsContent>

        <TabsContent value="advertise" className="mt-0 px-4 py-6">
          <AdvertisePanel listings={myListings} payments={myPayments} />
        </TabsContent>

        <TabsContent value="pricing" className="mt-0 px-4 py-6">
          <PricingPanel listings={myListings} />
        </TabsContent>

        <TabsContent value="settings" className="mt-0 px-4 py-6">
          <SettingsPanel
            name={myProfile.name ?? ""}
            phone={myProfile.phone ?? ""}
            locationDescription={myProfile.locationDescription ?? ""}
          />
        </TabsContent>

        <TabsContent value="account" className="mt-0 px-4 py-6">
          <AccountPanel
            name={user.name}
            email={user.email}
            image={user.image}
            role={user.role}
          />
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
            />
          </TabsContent>
        )}
      </div>
    </Tabs>
  );
}
