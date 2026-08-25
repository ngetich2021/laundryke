"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Sparkles, CircleCheck, CircleX } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable, sortableHeader, type ColumnDef } from "@/components/ui/data-table";
import { advertiseSchema, type AdvertiseInput } from "@/lib/validations";
import { advertiseAmount, videoAddonAmount, totalPromoteAmount } from "@/lib/constants";
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
  const [paymentState, setPaymentState] = useState<"form" | "polling" | "success" | "failed">(
    "form"
  );
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(advertiseSchema),
    defaultValues: {
      listingId: activeListings[0]?.id ?? "",
      phone: "",
      days: 3,
      includeVideo: false,
    },
  });

  const days = Number(watch("days")) || 0;
  const selectedListingId = watch("listingId");
  const includeVideo = watch("includeVideo") ?? false;
  const selectedListing = activeListings.find((listing) => listing.id === selectedListingId);
  const hasVideo = !!selectedListing?.videoUrl;

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (!hasVideo && includeVideo) {
      setValue("includeVideo", false);
    }
  }, [hasVideo, includeVideo, setValue]);

  function pollPayment(paymentId: string) {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      const status = await getPaymentStatus(paymentId);
      if (status?.status === "SUCCESS") {
        clearInterval(pollRef.current!);
        setPaymentState("success");
        router.refresh();
        setTimeout(() => {
          setDialogOpen(false);
          setPaymentState("form");
        }, 1600);
      } else if (status?.status === "FAILED") {
        clearInterval(pollRef.current!);
        setPaymentState("failed");
        setFailureReason(status.resultDesc ?? "Payment was not completed");
      } else if (attempts >= 20) {
        clearInterval(pollRef.current!);
        setPaymentState("failed");
        setFailureReason("Still waiting for M-Pesa confirmation. Check back shortly.");
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
      setPaymentState("polling");
      pollPayment(result.paymentId);
    }
  }

  function handleDialogOpenChange(open: boolean) {
    if (!open && paymentState === "polling") return;
    setDialogOpen(open);
    if (!open) {
      setPaymentState("form");
      setFailureReason(null);
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

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4" /> Promote a listing
            </DialogTitle>
          </DialogHeader>

          {paymentState === "form" && (
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
                  <FieldDescription>Blue badge: KES {advertiseAmount(days)}</FieldDescription>
                  <FieldError errors={[errors.days]} />
                </Field>

                <Field>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="includeVideo"
                      checked={includeVideo}
                      disabled={!hasVideo}
                      onCheckedChange={(checked) =>
                        setValue("includeVideo", checked === true, { shouldValidate: true })
                      }
                    />
                    <div className="flex flex-col gap-1">
                      <FieldLabel htmlFor="includeVideo" className="font-normal">
                        Also feature my video (+KES {videoAddonAmount(days)})
                      </FieldLabel>
                      {!hasVideo && (
                        <FieldDescription>
                          This shop has no video yet. Add one from &quot;Your shops&quot; to
                          feature it now — or promote the badge today and come back to add the
                          video later.
                        </FieldDescription>
                      )}
                    </div>
                  </div>
                  <FieldError errors={[errors.includeVideo]} />
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
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                    Pay KES {totalPromoteAmount(days, includeVideo)}
                  </Button>
                </DialogFooter>
              </FieldGroup>
            </form>
          )}

          {paymentState === "polling" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <p className="font-medium">STK push sent to your phone</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Enter your M-Pesa PIN to complete the payment. This can take up to a minute —
                don&apos;t close this window.
              </p>
            </div>
          )}

          {paymentState === "success" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CircleCheck className="size-8 text-green-600" />
              <p className="font-medium">Payment successful — listing promoted!</p>
            </div>
          )}

          {paymentState === "failed" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CircleX className="size-8 text-destructive" />
              <p className="font-medium">Payment not completed</p>
              <p className="max-w-xs text-sm text-muted-foreground">{failureReason}</p>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setPaymentState("form");
                    setFailureReason(null);
                  }}
                >
                  Try again
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
