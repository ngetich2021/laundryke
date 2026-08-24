"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
  FieldDescription,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DataTable, sortableHeader, type ColumnDef } from "@/components/ui/data-table";
import { advertiseSchema, type AdvertiseInput } from "@/lib/validations";
import { advertiseAmount } from "@/lib/constants";
import { initiateAdvertisePayment, getPaymentStatus } from "@/app/actions/payments";
import type { Listing, Payment } from "@/lib/generated/prisma/client";

type PaymentWithListing = Payment & { listing: { businessName: string } };

export function AdvertisePanel({
  listings,
  payments,
}: {
  listings: Listing[];
  payments: PaymentWithListing[];
}) {
  const router = useRouter();
  const activeListings = listings.filter((listing) => listing.isActive);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(advertiseSchema),
    defaultValues: { listingId: activeListings[0]?.id ?? "", phone: "", days: 3 },
  });

  const days = Number(watch("days")) || 0;

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function pollPayment(paymentId: string) {
    setPolling(true);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      const status = await getPaymentStatus(paymentId);
      if (status?.status === "SUCCESS") {
        clearInterval(pollRef.current!);
        setPolling(false);
        toast.success("Payment confirmed — listing promoted!");
        router.refresh();
      } else if (status?.status === "FAILED") {
        clearInterval(pollRef.current!);
        setPolling(false);
        toast.error(status.resultDesc ?? "Payment was not completed");
      } else if (attempts >= 20) {
        clearInterval(pollRef.current!);
        setPolling(false);
        toast.info("Still waiting for M-Pesa confirmation. Check back shortly.");
      }
    }, 3000);
  }

  async function onSubmit(data: AdvertiseInput) {
    const result = await initiateAdvertisePayment(data);
    if (result?.error) {
      const firstError = Object.values(result.error).flat()[0];
      toast.error(firstError ?? "Couldn't start payment");
      return;
    }
    if (result?.success) {
      toast.success(result.message ?? "Check your phone to complete payment");
      setDialogOpen(false);
      pollPayment(result.paymentId);
    }
  }

  const columns: ColumnDef<PaymentWithListing, unknown>[] = [
    {
      id: "listing",
      header: sortableHeader<PaymentWithListing>("Listing"),
      accessorFn: (row) => row.listing.businessName,
    },
    {
      accessorKey: "amount",
      header: sortableHeader<PaymentWithListing>("Amount"),
      cell: ({ row }) => `KES ${row.original.amount}`,
    },
    {
      accessorKey: "days",
      header: sortableHeader<PaymentWithListing>("Days"),
    },
    {
      accessorKey: "status",
      header: sortableHeader<PaymentWithListing>("Status"),
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
      header: sortableHeader<PaymentWithListing>("Date"),
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
  ];

  if (activeListings.length === 0) {
    return (
      <div className="mx-auto max-w-md py-10 text-center text-sm text-muted-foreground">
        Finish setting up your shop (name, phone, location) first, then come back here to
        promote it.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your promotions</h2>
      </div>

      <DataTable
        columns={columns}
        data={payments}
        csvFilename="payments.csv"
        csvData={payments.map((payment) => ({
          listing: payment.listing.businessName,
          amount: payment.amount,
          days: payment.days,
          status: payment.status,
          createdAt: payment.createdAt.toISOString(),
        }))}
        emptyMessage="No promotions yet."
        toolbar={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Add promotion
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4" /> Promote a listing
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel>Listing</FieldLabel>
                <Select
                  items={Object.fromEntries(
                    activeListings.map((listing) => [listing.id, listing.businessName])
                  )}
                  value={watch("listingId")}
                  onValueChange={(value) => {
                    if (value) setValue("listingId", value, { shouldValidate: true });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activeListings.map((listing) => (
                      <SelectItem key={listing.id} value={listing.id}>
                        {listing.businessName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.listingId]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="days">Days to feature</FieldLabel>
                <Input id="days" type="number" min={1} max={30} {...register("days")} />
                <FieldDescription>KES {advertiseAmount(days)} total</FieldDescription>
                <FieldError errors={[errors.days]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="phone">M-Pesa phone number</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="0712345678"
                  {...register("phone")}
                />
                <FieldError errors={[errors.phone]} />
              </Field>

              <DialogFooter className="mt-2">
                <Button type="submit" disabled={isSubmitting || polling}>
                  {(isSubmitting || polling) && <Loader2 className="size-4 animate-spin" />}
                  {polling ? "Waiting for M-Pesa..." : `Pay KES ${advertiseAmount(days)}`}
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
