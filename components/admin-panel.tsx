"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import {
  Loader2,
  Trash2,
  Pencil,
  Plus,
  Users,
  ListChecks,
  Wallet,
  Tag,
  ShieldCheck,
  LifeBuoy,
  Gift,
  HeartPulse,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PromotedBadge } from "@/components/badge-star";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, sortableHeader, type ColumnDef } from "@/components/ui/data-table";
import { DetailDialog, type DetailField } from "@/components/ui/detail-dialog";
import { setUserRole, toggleListingActive, adminDeleteListing, assignCustomRole } from "@/app/actions/admin";
import { createRole, updateRole, deleteRole } from "@/app/actions/roles";
import { PERMISSIONS, PERMISSION_LABELS, type PermissionKey } from "@/lib/permissions";
import type { Payment, PriceItem, RolePermission } from "@/lib/generated/prisma/client";
import { AdminSupportPanel, type AdminChatMessage } from "@/components/admin-support-panel";
import { AdminReferralsPanel } from "@/components/admin-referrals-panel";
import { AdminHealthPanel } from "@/components/admin-health-panel";
import { CountBadge } from "@/components/ui/count-badge";
import type { getAllTicketsForAdmin } from "@/app/actions/support";
import type { getAllFeedbackForAdmin } from "@/app/actions/feedback";
import type { getAllReferralOffersForAdmin } from "@/app/actions/referrals";
import type { getRecentHealthLogs } from "@/app/actions/health";
import { countUnread } from "@/lib/support-unread";

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

const roleFormSchema = z.object({
  name: z.string().trim().min(2, "Too short").max(40, "Too long"),
  permissions: z.array(z.enum(PERMISSIONS)).min(1, "Pick at least one permission"),
});

export function AdminPanel({
  users,
  listings,
  payments,
  prices,
  roles,
  roleOptions,
  currentUserId,
  permissions,
  tickets,
  feedback,
  chatMessages,
  referralOffers,
  healthLogs,
}: {
  users: AdminUser[];
  listings: AdminListing[];
  payments: AdminPayment[];
  prices: AdminPriceItem[];
  roles: AdminRole[];
  roleOptions: RoleOption[];
  currentUserId: string;
  permissions: PermissionKey[];
  tickets: Awaited<ReturnType<typeof getAllTicketsForAdmin>>;
  feedback: Awaited<ReturnType<typeof getAllFeedbackForAdmin>>;
  chatMessages: AdminChatMessage[];
  referralOffers: Awaited<ReturnType<typeof getAllReferralOffersForAdmin>>;
  healthLogs: Awaited<ReturnType<typeof getRecentHealthLogs>>;
}) {
  const router = useRouter();
  const can = (key: PermissionKey) => permissions.includes(key);

  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingListingId, setPendingListingId] = useState<string | null>(null);
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null);

  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [detailListing, setDetailListing] = useState<AdminListing | null>(null);
  const [detailPayment, setDetailPayment] = useState<AdminPayment | null>(null);
  const [detailPrice, setDetailPrice] = useState<AdminPriceItem | null>(null);

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);

  const {
    register: registerRole,
    handleSubmit: handleRoleSubmit,
    watch: watchRole,
    setValue: setRoleValue,
    reset: resetRoleForm,
    formState: { errors: roleErrors, isSubmitting: isRoleSubmitting },
  } = useForm({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { name: "", permissions: [] as PermissionKey[] },
  });

  const selectedPermissions = watchRole("permissions") ?? [];

  function handleRoleChange(userId: string, role: "USER" | "ADMIN") {
    setPendingUserId(userId);
    setUserRole(userId, role)
      .then(() => {
        toast.success("Role updated");
        router.refresh();
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Couldn't update role");
      })
      .finally(() => setPendingUserId(null));
  }

  function handleAssignCustomRole(userId: string, customRoleId: string) {
    setPendingUserId(userId);
    assignCustomRole(userId, customRoleId)
      .then(() => {
        toast.success("Role updated");
        router.refresh();
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Couldn't update role");
      })
      .finally(() => setPendingUserId(null));
  }

  function handleRoleSelectChange(userId: string, value: string) {
    if (value === "USER" || value === "ADMIN") {
      handleRoleChange(userId, value);
    } else if (value.startsWith("role:")) {
      handleAssignCustomRole(userId, value.slice(5));
    }
  }

  function handleToggleActive(listingId: string, isActive: boolean) {
    setPendingListingId(listingId);
    toggleListingActive(listingId, isActive)
      .then(() => router.refresh())
      .finally(() => setPendingListingId(null));
  }

  function handleDeleteListing(listingId: string) {
    setPendingListingId(listingId);
    adminDeleteListing(listingId)
      .then(() => {
        toast.success("Listing deleted");
        router.refresh();
      })
      .finally(() => setPendingListingId(null));
  }

  function startCreateRole() {
    setEditingRole(null);
    resetRoleForm({ name: "", permissions: [] });
    setRoleDialogOpen(true);
  }

  function startEditRole(role: AdminRole) {
    setEditingRole(role);
    resetRoleForm({ name: role.name, permissions: role.permissions.map((p) => p.permission) });
    setRoleDialogOpen(true);
  }

  async function onRoleSubmit(data: z.infer<typeof roleFormSchema>) {
    const result = editingRole ? await updateRole(editingRole.id, data) : await createRole(data);
    if (result?.error) {
      const firstError = Object.values(result.error).flat()[0];
      toast.error(firstError ?? "Something went wrong");
      return;
    }
    toast.success(editingRole ? "Role updated" : "Role created");
    setRoleDialogOpen(false);
    setEditingRole(null);
    router.refresh();
  }

  function handleDeleteRole(roleId: string) {
    setPendingRoleId(roleId);
    deleteRole(roleId)
      .then(() => {
        toast.success("Role deleted");
        router.refresh();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Couldn't delete role"))
      .finally(() => setPendingRoleId(null));
  }

  const userColumns: ColumnDef<AdminUser, unknown>[] = [
    {
      id: "user",
      header: sortableHeader<AdminUser>("User"),
      accessorFn: (row) => row.name ?? row.email,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarImage src={row.original.image ?? undefined} alt={row.original.name ?? ""} />
            <AvatarFallback>{row.original.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{row.original.name ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: sortableHeader<AdminUser>("Phone"),
      cell: ({ row }) => row.original.phone ?? "—",
    },
    {
      id: "role",
      header: "Role",
      cell: ({ row }) => (
        <Select
          items={{
            USER: "USER",
            ADMIN: "ADMIN",
            ...Object.fromEntries(roleOptions.map((role) => [`role:${role.id}`, role.name])),
          }}
          value={row.original.customRole ? `role:${row.original.customRole.id}` : row.original.role}
          onValueChange={(value) => handleRoleSelectChange(row.original.id, value as string)}
          disabled={pendingUserId === row.original.id || row.original.id === currentUserId}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USER">USER</SelectItem>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
            {roleOptions.map((role) => (
              <SelectItem key={role.id} value={`role:${role.id}`}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
  ];

  const listingColumns: ColumnDef<AdminListing, unknown>[] = [
    {
      accessorKey: "businessName",
      header: sortableHeader<AdminListing>("Business"),
    },
    {
      id: "owner",
      header: sortableHeader<AdminListing>("Owner"),
      accessorFn: (row) => row.owner.name ?? row.owner.email,
    },
    {
      id: "active",
      header: "Active",
      cell: ({ row }) => (
        <Switch
          checked={row.original.isActive}
          onCheckedChange={(checked) => handleToggleActive(row.original.id, checked)}
          disabled={pendingListingId === row.original.id}
        />
      ),
    },
    {
      id: "promoted",
      header: "Promoted",
      cell: ({ row }) =>
        row.original.promotedUntil && row.original.promotedUntil > new Date() ? (
          <PromotedBadge />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          size="icon-sm"
          variant="outline"
          disabled={pendingListingId === row.original.id}
          onClick={() => handleDeleteListing(row.original.id)}
        >
          {pendingListingId === row.original.id ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
        </Button>
      ),
    },
  ];

  const paymentColumns: ColumnDef<AdminPayment, unknown>[] = [
    {
      id: "listing",
      header: sortableHeader<AdminPayment>("Listing"),
      accessorFn: (row) => row.listing.businessName,
    },
    {
      id: "user",
      header: sortableHeader<AdminPayment>("User"),
      accessorFn: (row) => row.user.name ?? row.user.email,
    },
    {
      accessorKey: "amount",
      header: sortableHeader<AdminPayment>("Amount"),
      cell: ({ row }) => `KES ${row.original.amount}`,
    },
    {
      accessorKey: "status",
      header: sortableHeader<AdminPayment>("Status"),
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === "SUCCESS"
              ? "default"
              : row.original.status === "FAILED"
                ? "destructive"
                : "secondary"
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: sortableHeader<AdminPayment>("Date"),
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
  ];

  const priceColumns: ColumnDef<AdminPriceItem, unknown>[] = [
    {
      id: "shop",
      header: sortableHeader<AdminPriceItem>("Shop"),
      accessorFn: (row) => row.listing.businessName,
    },
    {
      id: "owner",
      header: sortableHeader<AdminPriceItem>("Owner"),
      accessorFn: (row) => row.listing.owner.name ?? row.listing.owner.email,
    },
    {
      accessorKey: "label",
      header: sortableHeader<AdminPriceItem>("Service"),
    },
    {
      accessorKey: "priceKes",
      header: sortableHeader<AdminPriceItem>("Price (KES)"),
      cell: ({ row }) => `KES ${row.original.priceKes}`,
    },
    {
      accessorKey: "createdAt",
      header: sortableHeader<AdminPriceItem>("Added"),
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
  ];

  const roleColumns: ColumnDef<AdminRole, unknown>[] = [
    {
      accessorKey: "name",
      header: sortableHeader<AdminRole>("Role"),
    },
    {
      id: "permissions",
      header: "Permissions",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.permissions.map((p) => (
            <Badge key={p.id} variant="outline">
              {PERMISSION_LABELS[p.permission]}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: "members",
      header: "Members",
      cell: ({ row }) => row.original._count.users,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="icon-sm" variant="outline" onClick={() => startEditRole(row.original)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            disabled={pendingRoleId === row.original.id}
            onClick={() => handleDeleteRole(row.original.id)}
          >
            {pendingRoleId === row.original.id ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  const userFields: DetailField[] = detailUser
    ? [
        { label: "Name", value: detailUser.name ?? "—" },
        { label: "Email", value: detailUser.email },
        { label: "Phone", value: detailUser.phone ?? "—" },
        { label: "Shop location", value: detailUser.locationDescription ?? "—" },
        { label: "Role", value: detailUser.customRole?.name ?? detailUser.role },
        { label: "Joined", value: new Date(detailUser.createdAt).toLocaleString() },
        { label: "User ID", value: detailUser.id },
      ]
    : [];

  const listingFields: DetailField[] = detailListing
    ? [
        { label: "Business", value: detailListing.businessName },
        { label: "Description", value: detailListing.description },
        { label: "Owner", value: detailListing.owner.name ?? detailListing.owner.email },
        { label: "Phone", value: detailListing.phone ?? "—" },
        { label: "Address", value: detailListing.address ?? "—" },
        { label: "Active", value: detailListing.isActive ? "Yes" : "No" },
        {
          label: "Promoted until",
          value: detailListing.promotedUntil
            ? new Date(detailListing.promotedUntil).toLocaleString()
            : "—",
        },
        { label: "Posted", value: new Date(detailListing.createdAt).toLocaleString() },
        { label: "Listing ID", value: detailListing.id },
      ]
    : [];

  const paymentFields: DetailField[] = detailPayment
    ? [
        { label: "Listing", value: detailPayment.listing.businessName },
        { label: "User", value: detailPayment.user.name ?? detailPayment.user.email },
        { label: "Amount", value: `KES ${detailPayment.amount}` },
        { label: "Days", value: detailPayment.days },
        { label: "Phone", value: detailPayment.phone },
        { label: "Status", value: detailPayment.status },
        { label: "M-Pesa receipt", value: detailPayment.mpesaReceipt ?? "—" },
        { label: "Result", value: detailPayment.resultDesc ?? "—" },
        { label: "Date", value: new Date(detailPayment.createdAt).toLocaleString() },
        { label: "Payment ID", value: detailPayment.id },
      ]
    : [];

  const priceFields: DetailField[] = detailPrice
    ? [
        { label: "Shop", value: detailPrice.listing.businessName },
        {
          label: "Owner",
          value: detailPrice.listing.owner.name ?? detailPrice.listing.owner.email,
        },
        { label: "Service", value: detailPrice.label },
        { label: "Price", value: `KES ${detailPrice.priceKes}` },
        { label: "Added", value: new Date(detailPrice.createdAt).toLocaleString() },
        { label: "Price ID", value: detailPrice.id },
      ]
    : [];

  const defaultTab = can("MANAGE_USERS")
    ? "users"
    : can("MANAGE_LISTINGS")
      ? "listings"
      : can("MANAGE_PAYMENTS")
        ? "payments"
        : can("MANAGE_PRICING")
          ? "prices"
          : can("MANAGE_ROLES")
            ? "roles"
            : "support";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Tabs defaultValue={defaultTab}>
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          {can("MANAGE_USERS") && (
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="size-4" /> Users
            </TabsTrigger>
          )}
          {can("MANAGE_LISTINGS") && (
            <TabsTrigger value="listings" className="gap-1.5">
              <ListChecks className="size-4" /> Listings
            </TabsTrigger>
          )}
          {can("MANAGE_PAYMENTS") && (
            <TabsTrigger value="payments" className="gap-1.5">
              <Wallet className="size-4" /> Payments
            </TabsTrigger>
          )}
          {can("MANAGE_PRICING") && (
            <TabsTrigger value="prices" className="gap-1.5">
              <Tag className="size-4" /> Pricing
            </TabsTrigger>
          )}
          {can("MANAGE_ROLES") && (
            <TabsTrigger value="roles" className="gap-1.5">
              <ShieldCheck className="size-4" /> Roles
            </TabsTrigger>
          )}
          {can("MANAGE_SUPPORT") && (
            <TabsTrigger value="support" className="gap-1.5">
              <LifeBuoy className="size-4" /> Support
              <CountBadge count={countUnread(tickets, "ADMIN")} />
            </TabsTrigger>
          )}
          {can("MANAGE_SUPPORT") && (
            <TabsTrigger value="referrals" className="gap-1.5">
              <Gift className="size-4" /> Referrals
            </TabsTrigger>
          )}
          {can("MANAGE_SUPPORT") && (
            <TabsTrigger value="health" className="gap-1.5">
              <HeartPulse className="size-4" /> Health
            </TabsTrigger>
          )}
        </TabsList>

        {can("MANAGE_USERS") && (
          <TabsContent value="users" className="mt-4">
            <DataTable
              columns={userColumns}
              data={users}
              csvFilename="users.csv"
              csvData={users.map((u) => ({
                name: u.name ?? "",
                email: u.email,
                phone: u.phone ?? "",
                role: u.customRole?.name ?? u.role,
              }))}
              emptyMessage="No users yet."
              onRowClick={setDetailUser}
            />
          </TabsContent>
        )}

        {can("MANAGE_LISTINGS") && (
          <TabsContent value="listings" className="mt-4">
            <DataTable
              columns={listingColumns}
              data={listings}
              csvFilename="listings.csv"
              csvData={listings.map((l) => ({
                businessName: l.businessName,
                owner: l.owner.name ?? l.owner.email,
                isActive: l.isActive,
              }))}
              emptyMessage="No listings yet."
              onRowClick={setDetailListing}
            />
          </TabsContent>
        )}

        {can("MANAGE_PAYMENTS") && (
          <TabsContent value="payments" className="mt-4">
            <DataTable
              columns={paymentColumns}
              data={payments}
              csvFilename="payments.csv"
              csvData={payments.map((p) => ({
                listing: p.listing.businessName,
                user: p.user.name ?? p.user.email,
                amount: p.amount,
                status: p.status,
                createdAt: p.createdAt.toISOString(),
              }))}
              emptyMessage="No payments yet."
              onRowClick={setDetailPayment}
            />
          </TabsContent>
        )}

        {can("MANAGE_PRICING") && (
          <TabsContent value="prices" className="mt-4">
            <DataTable
              columns={priceColumns}
              data={prices}
              csvFilename="prices.csv"
              csvData={prices.map((p) => ({
                shop: p.listing.businessName,
                owner: p.listing.owner.name ?? p.listing.owner.email,
                label: p.label,
                priceKes: p.priceKes,
              }))}
              emptyMessage="No prices set yet."
              onRowClick={setDetailPrice}
            />
          </TabsContent>
        )}

        {can("MANAGE_ROLES") && (
          <TabsContent value="roles" className="mt-4">
            <DataTable
              columns={roleColumns}
              data={roles}
              csvFilename="roles.csv"
              csvData={roles.map((r) => ({
                name: r.name,
                permissions: r.permissions.map((p) => p.permission).join("; "),
                members: r._count.users,
              }))}
              emptyMessage="No custom roles yet."
              onRowClick={startEditRole}
              toolbar={
                <Button size="sm" onClick={startCreateRole}>
                  <Plus className="size-4" />
                  Add role
                </Button>
              }
            />
          </TabsContent>
        )}

        {can("MANAGE_SUPPORT") && (
          <TabsContent value="support" className="mt-4">
            <AdminSupportPanel tickets={tickets} feedback={feedback} chatMessages={chatMessages} />
          </TabsContent>
        )}

        {can("MANAGE_SUPPORT") && (
          <TabsContent value="referrals" className="mt-4">
            <AdminReferralsPanel offers={referralOffers} />
          </TabsContent>
        )}

        {can("MANAGE_SUPPORT") && (
          <TabsContent value="health" className="mt-4">
            <AdminHealthPanel initialLogs={healthLogs} />
          </TabsContent>
        )}
      </Tabs>

      <DetailDialog
        open={!!detailUser}
        onOpenChange={(open) => !open && setDetailUser(null)}
        title="User details"
        fields={userFields}
      />
      <DetailDialog
        open={!!detailListing}
        onOpenChange={(open) => !open && setDetailListing(null)}
        title="Listing details"
        fields={listingFields}
      />
      <DetailDialog
        open={!!detailPayment}
        onOpenChange={(open) => !open && setDetailPayment(null)}
        title="Payment details"
        fields={paymentFields}
      />
      <DetailDialog
        open={!!detailPrice}
        onOpenChange={(open) => !open && setDetailPrice(null)}
        title="Price details"
        fields={priceFields}
      />

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit role" : "Add a role"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRoleSubmit(onRoleSubmit)} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="roleName">Name</FieldLabel>
                <Input id="roleName" placeholder="e.g. Support" {...registerRole("name")} />
                <FieldError errors={[roleErrors.name]} />
              </Field>
              <Field>
                <FieldLabel>Permissions</FieldLabel>
                <div className="flex flex-col gap-2">
                  {PERMISSIONS.map((permission) => (
                    <label key={permission} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selectedPermissions.includes(permission)}
                        onCheckedChange={(checked) => {
                          const next = checked
                            ? [...selectedPermissions, permission]
                            : selectedPermissions.filter((p) => p !== permission);
                          setRoleValue("permissions", next, { shouldValidate: true });
                        }}
                      />
                      {PERMISSION_LABELS[permission]}
                    </label>
                  ))}
                </div>
                <FieldError errors={[roleErrors.permissions]} />
              </Field>
              <DialogFooter className="mt-2">
                <Button type="submit" disabled={isRoleSubmitting}>
                  {isRoleSubmitting && <Loader2 className="size-4 animate-spin" />}
                  {editingRole ? "Save changes" : "Add role"}
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
