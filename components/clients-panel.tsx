"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Users, Wallet, CalendarCheck, Stamp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, sortableHeader, type ColumnDef } from "@/components/ui/data-table";
import { clientSchema, visitSchema } from "@/lib/validations";
import {
  createClient,
  updateClient,
  deleteClient,
  getMyClients,
  getClientDetail,
  logVisit,
  getClientStats,
} from "@/app/actions/clients";
import { addLoyaltyPunch, redeemLoyaltyReward, getMyLoyaltyProgram } from "@/app/actions/loyalty";
import { LoyaltyPanel } from "@/components/loyalty-panel";
import { CampaignsPanel } from "@/components/campaigns-panel";
import type { Listing } from "@/lib/generated/prisma/client";

type MyClient = Awaited<ReturnType<typeof getMyClients>>[number];
type ClientDetail = Awaited<ReturnType<typeof getClientDetail>>;
type ClientStats = Awaited<ReturnType<typeof getClientStats>>;

function ClientFormDialog({
  listingId,
  editing,
  open,
  onOpenChange,
  onSaved,
}: {
  listingId: string;
  editing: MyClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", phone: "", email: "", notes: "" },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: editing?.name ?? "",
        phone: editing?.phone ?? "",
        email: editing?.email ?? "",
        notes: editing?.notes ?? "",
      });
    }
  }, [open, editing, reset]);

  async function onSubmit(data: { name: string; phone?: string; email?: string; notes?: string }) {
    const result = editing ? await updateClient(editing.id, data) : await createClient(listingId, data);
    if (result?.error) {
      const firstError = Object.values(result.error).flat()[0];
      toast.error(firstError ?? "Something went wrong");
      return;
    }
    toast.success(editing ? "Client updated" : "Client added");
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit client" : "Add a client"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="client-name">Name</FieldLabel>
              <Input id="client-name" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="client-phone">Phone (optional)</FieldLabel>
              <Input id="client-phone" placeholder="0712345678" {...register("phone")} />
              <FieldError errors={[errors.phone]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="client-email">Email (optional)</FieldLabel>
              <Input id="client-email" type="email" {...register("email")} />
              <FieldError errors={[errors.email]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="client-notes">Notes (optional)</FieldLabel>
              <Textarea id="client-notes" rows={2} {...register("notes")} />
              <FieldError errors={[errors.notes]} />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save changes" : "Add client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ClientDetailDialog({
  clientId,
  punchesRequired,
  onClose,
  onChanged,
}: {
  clientId: string;
  punchesRequired: number | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(visitSchema),
    defaultValues: { amountKes: undefined, notes: "" },
  });

  function refresh() {
    startTransition(async () => {
      setDetail(await getClientDetail(clientId));
    });
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function onLogVisit(data: { amountKes?: number; notes?: string }) {
    const result = await logVisit(clientId, data);
    if (result?.error) {
      toast.error(Object.values(result.error).flat()[0] ?? "Something went wrong");
      return;
    }
    toast.success("Visit logged");
    reset({ amountKes: undefined, notes: "" });
    refresh();
    onChanged();
  }

  function punch() {
    startTransition(async () => {
      await addLoyaltyPunch(clientId);
      refresh();
      onChanged();
    });
  }

  function redeem() {
    startTransition(async () => {
      try {
        await redeemLoyaltyReward(clientId);
        toast.success("Reward redeemed");
        refresh();
        onChanged();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't redeem");
      }
    });
  }

  const rewardReady = punchesRequired != null && (detail?.loyaltyPunches ?? 0) >= punchesRequired;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{detail?.name ?? "Client"}</DialogTitle>
        </DialogHeader>

        {!detail ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 text-sm">
            <div className="text-muted-foreground">
              {detail.phone ?? "No phone"} {detail.email ? `· ${detail.email}` : ""}
            </div>

            {punchesRequired != null && (
              <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 p-3">
                <div>
                  <p className="flex items-center gap-1.5 font-medium">
                    <Stamp className="size-4" />
                    {detail.loyaltyPunches} / {punchesRequired} punches
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {detail.loyaltyRedemptions} reward{detail.loyaltyRedemptions === 1 ? "" : "s"} redeemed
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={punch} disabled={isPending}>
                    Add punch
                  </Button>
                  <Button size="sm" onClick={redeem} disabled={isPending || !rewardReady}>
                    Redeem
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            <div>
              <p className="mb-2 font-medium">Log a visit</p>
              <form onSubmit={handleSubmit(onLogVisit)} noValidate className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Amount (KES, optional)"
                    {...register("amountKes")}
                  />
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                    Log
                  </Button>
                </div>
                <Input placeholder="Notes (optional)" {...register("notes")} />
                <FieldError errors={[errors.amountKes, errors.notes]} />
              </form>
            </div>

            <Separator />

            <div>
              <p className="mb-2 font-medium">Visit history</p>
              {detail.visits.length === 0 ? (
                <p className="text-muted-foreground">No visits logged yet.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {detail.visits.map((v) => (
                    <li key={v.id} className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">
                        {new Date(v.visitedAt).toLocaleDateString()}
                        {v.notes ? ` — ${v.notes}` : ""}
                      </span>
                      {v.amountKes != null && <span className="font-medium">KES {v.amountKes}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatsRow({ stats }: { stats: ClientStats | null }) {
  const items = [
    { label: "Total clients", value: stats?.totalClients ?? 0, icon: Users },
    { label: "Visits this month", value: stats?.visitsThisMonth ?? 0, icon: CalendarCheck },
    { label: "Revenue this month", value: `KES ${stats?.revenueThisMonthKes ?? 0}`, icon: Wallet },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardContent className="flex items-center gap-3 py-4">
            <Icon className="size-5 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ClientsTab({ listingId }: { listingId: string }) {
  const [clients, setClients] = useState<MyClient[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [punchesRequired, setPunchesRequired] = useState<number | null>(null);
  const [isLoading, startLoading] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MyClient | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function refresh() {
    startLoading(async () => {
      const [clientList, clientStats, program] = await Promise.all([
        getMyClients(listingId),
        getClientStats(listingId),
        getMyLoyaltyProgram(listingId),
      ]);
      setClients(clientList);
      setStats(clientStats);
      setPunchesRequired(program?.isActive ? program.punchesRequired : null);
    });
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  function startCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function startEdit(client: MyClient) {
    setEditing(client);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteClient(id);
      toast.success("Client removed");
      refresh();
    } catch {
      toast.error("Couldn't remove client");
    } finally {
      setDeletingId(null);
    }
  }

  const columns: ColumnDef<MyClient, unknown>[] = [
    { accessorKey: "name", header: sortableHeader<MyClient>("Name") },
    {
      accessorKey: "phone",
      header: sortableHeader<MyClient>("Phone"),
      cell: ({ row }) => row.original.phone ?? "—",
    },
    {
      id: "visits",
      header: "Visits",
      cell: ({ row }) => row.original._count.visits,
    },
    {
      id: "loyalty",
      header: "Punches",
      cell: ({ row }) =>
        punchesRequired != null ? (
          <Badge variant={row.original.loyaltyPunches >= punchesRequired ? "default" : "outline"}>
            {row.original.loyaltyPunches}/{punchesRequired}
          </Badge>
        ) : (
          "—"
        ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="icon-sm" variant="outline" onClick={() => startEdit(row.original)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            disabled={deletingId === row.original.id}
            onClick={() => handleDelete(row.original.id)}
          >
            {deletingId === row.original.id ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <StatsRow stats={stats} />

      {isLoading && clients.length === 0 ? (
        <div className="flex justify-center py-10 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={clients}
          csvFilename="clients.csv"
          csvData={clients.map((c) => ({
            name: c.name,
            phone: c.phone ?? "",
            email: c.email ?? "",
            visits: c._count.visits,
            loyaltyPunches: c.loyaltyPunches,
          }))}
          emptyMessage="No clients yet — add your first one."
          onRowClick={(row) => setDetailId(row.id)}
          toolbar={
            <Button size="sm" onClick={startCreate}>
              <Plus className="size-4" />
              Add client
            </Button>
          }
        />
      )}

      <ClientFormDialog
        listingId={listingId}
        editing={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={refresh}
      />

      {detailId && (
        <ClientDetailDialog
          clientId={detailId}
          punchesRequired={punchesRequired}
          onClose={() => setDetailId(null)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}

export function ClientsPanel({ listings }: { listings: Listing[] }) {
  const [listingId, setListingId] = useState(listings[0]?.id ?? "");

  if (listings.length === 0) {
    return <p className="py-10 text-center text-muted-foreground">You don&apos;t have any shops yet.</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Manage your customers</h2>
        {listings.length > 1 && (
          <Select
            items={Object.fromEntries(listings.map((l) => [l.id, l.businessName]))}
            value={listingId}
            onValueChange={(value) => setListingId(value ?? "")}
          >
            <SelectTrigger size="sm" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {listings.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.businessName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Tabs defaultValue="clients">
        <TabsList variant="line">
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>
        <TabsContent value="clients" className="mt-4">
          <ClientsTab listingId={listingId} />
        </TabsContent>
        <TabsContent value="loyalty" className="mt-4">
          <LoyaltyPanel listingId={listingId} />
        </TabsContent>
        <TabsContent value="campaigns" className="mt-4">
          <CampaignsPanel listingId={listingId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
