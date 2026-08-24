"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { priceItemSchema, type PriceItemInput } from "@/lib/validations";
import { getMyPrices, createPriceItem, updatePriceItem, deletePriceItem } from "@/app/actions/pricing";
import type { Listing, PriceItem } from "@/lib/generated/prisma/client";

export function PricingPanel({ listings }: { listings: Listing[] }) {
  const router = useRouter();
  const [listingId, setListingId] = useState(listings[0]?.id ?? "");
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [isLoading, startLoading] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PriceItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!listingId) {
      setPrices([]);
      return;
    }
    startLoading(async () => {
      setPrices(await getMyPrices(listingId));
    });
  }, [listingId]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(priceItemSchema),
    defaultValues: { label: "", priceKes: undefined },
  });

  function startCreate() {
    setEditing(null);
    reset({ label: "", priceKes: undefined });
    setDialogOpen(true);
  }

  function startEdit(item: PriceItem) {
    setEditing(item);
    reset({ label: item.label, priceKes: item.priceKes });
    setDialogOpen(true);
  }

  async function onSubmit(data: PriceItemInput) {
    const result = editing
      ? await updatePriceItem(editing.id, data)
      : await createPriceItem(listingId, data);

    if (result?.error) {
      const firstError = Object.values(result.error).flat()[0];
      toast.error(firstError ?? "Something went wrong");
      return;
    }

    toast.success(editing ? "Price updated" : "Price added");
    setDialogOpen(false);
    setEditing(null);
    setPrices(await getMyPrices(listingId));
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deletePriceItem(id);
      toast.success("Price removed");
      setPrices(await getMyPrices(listingId));
      router.refresh();
    } catch {
      toast.error("Couldn't remove price");
    } finally {
      setDeletingId(null);
    }
  }

  const columns: ColumnDef<PriceItem, unknown>[] = [
    {
      accessorKey: "label",
      header: sortableHeader<PriceItem>("Service"),
    },
    {
      accessorKey: "priceKes",
      header: sortableHeader<PriceItem>("Price (KES)"),
      cell: ({ row }) => `KES ${row.original.priceKes}`,
    },
    {
      accessorKey: "createdAt",
      header: sortableHeader<PriceItem>("Added"),
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Your prices</h2>
        {listings.length > 1 && (
          <Select
            items={Object.fromEntries(listings.map((listing) => [listing.id, listing.businessName]))}
            value={listingId}
            onValueChange={(value) => setListingId(value ?? "")}
          >
            <SelectTrigger size="sm" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {listings.map((listing) => (
                <SelectItem key={listing.id} value={listing.id}>
                  {listing.businessName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={prices}
          csvFilename="prices.csv"
          csvData={prices.map((item) => ({
            label: item.label,
            priceKes: item.priceKes,
            createdAt: item.createdAt.toISOString(),
          }))}
          emptyMessage="You haven't added any prices yet."
          toolbar={
            <Button size="sm" onClick={startCreate} disabled={!listingId}>
              <Plus className="size-4" />
              Add price
            </Button>
          }
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit price" : "Add a price"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="label">Service</FieldLabel>
                <Input id="label" placeholder="e.g. 1kg, Duvet" {...register("label")} />
                <FieldError errors={[errors.label]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="priceKes">Price (KES)</FieldLabel>
                <Input id="priceKes" type="number" min={1} {...register("priceKes")} />
                <FieldError errors={[errors.priceKes]} />
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {editing ? "Save changes" : "Add price"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
