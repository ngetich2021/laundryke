"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2, Upload, TriangleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { PromotedBadge } from "@/components/badge-star";
import { LocationPicker } from "@/components/location-picker";
import { DataTable, sortableHeader, type ColumnDef } from "@/components/ui/data-table";
import { listingSchema, type ListingInput } from "@/lib/validations";
import { createListing, updateListing, deleteListing } from "@/app/actions/listings";
import { reverseGeocode } from "@/app/actions/geocode";
import { uploadToCloudinary } from "@/lib/cloudinary-client";
import { cn } from "@/lib/utils";
import type { Listing } from "@/lib/generated/prisma/client";

export function PostListingPanel({
  initialListings,
  hasContact,
  onNavigateToSettings,
}: {
  initialListings: Listing[];
  hasContact: boolean;
  onNavigateToSettings: () => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Listing | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      businessName: "",
      description: "",
      phone: "",
      address: "",
      videoSource: "YOUTUBE",
      videoUrl: "",
      imageUrl: "",
      tiktokUrl: "",
      facebookUrl: "",
      instagramUrl: "",
    },
  });

  const videoSource = watch("videoSource");
  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const imageUrl = watch("imageUrl");

  function startEdit(listing: Listing) {
    setEditing(listing);
    reset({
      businessName: listing.businessName,
      description: listing.description,
      phone: listing.phone ?? "",
      address: listing.address ?? "",
      latitude: listing.latitude ?? undefined,
      longitude: listing.longitude ?? undefined,
      videoSource: listing.videoSource ?? "YOUTUBE",
      videoUrl: listing.videoUrl ?? "",
      imageUrl: listing.imageUrl ?? "",
      tiktokUrl: listing.tiktokUrl ?? "",
      facebookUrl: listing.facebookUrl ?? "",
      instagramUrl: listing.instagramUrl ?? "",
    });
    setDialogOpen(true);
  }

  function startCreate() {
    setEditing(null);
    reset({
      businessName: "",
      description: "",
      phone: "",
      address: "",
      latitude: undefined,
      longitude: undefined,
      videoSource: "YOUTUBE",
      videoUrl: "",
      imageUrl: "",
      tiktokUrl: "",
      facebookUrl: "",
      instagramUrl: "",
    });
    setDialogOpen(true);
  }

  async function onSubmit(data: ListingInput) {
    const result = editing ? await updateListing(editing.id, data) : await createListing(data);

    if (result?.error) {
      const firstError = Object.values(result.error).flat()[0];
      toast.error(firstError ?? "Something went wrong");
      return;
    }

    toast.success(editing ? "Shop updated" : "Shop added");
    setDialogOpen(false);
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteListing(id);
      toast.success("Listing deleted");
      router.refresh();
    } catch {
      toast.error("Couldn't delete listing");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const result = await uploadToCloudinary(file);
      setValue("videoSource", "UPLOAD");
      setValue("videoUrl", result.url, { shouldValidate: true });
      toast.success("Video uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleLogoUpload(file: File) {
    setLogoUploading(true);
    try {
      const result = await uploadToCloudinary(file);
      setValue("imageUrl", result.url, { shouldValidate: true });
      toast.success("Logo uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setLogoUploading(false);
    }
  }

  const columns: ColumnDef<Listing, unknown>[] = [
    {
      accessorKey: "businessName",
      header: sortableHeader<Listing>("Business"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.original.imageUrl}
              alt=""
              className="size-6 shrink-0 rounded object-cover"
            />
          ) : null}
          {row.original.businessName}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Badge variant={row.original.isActive ? "default" : "secondary"}>
            {row.original.isActive ? "Active" : "Hidden"}
          </Badge>
          {row.original.promotedUntil && row.original.promotedUntil > new Date() && (
            <PromotedBadge />
          )}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: sortableHeader<Listing>("Posted"),
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
            onClick={() => handleDelete(row.original.id)}
            disabled={deletingId === row.original.id}
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your shops</h2>
      </div>

      {!hasContact && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          <TriangleAlert className="size-4 shrink-0 text-amber-600" />
          <p className="flex-1">
            Add a contact phone number in Settings before you can add another shop.
          </p>
          <Button size="sm" variant="outline" onClick={onNavigateToSettings}>
            Go to Settings
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={initialListings}
        csvFilename="shops.csv"
        csvData={initialListings.map((listing) => ({
          businessName: listing.businessName,
          phone: listing.phone ?? "",
          address: listing.address ?? "",
          isActive: listing.isActive,
          createdAt: listing.createdAt.toISOString(),
        }))}
        emptyMessage="You don't have any shops yet."
        toolbar={
          <Button size="sm" variant="outline" onClick={startCreate} disabled={!hasContact}>
            <Plus className="size-4" />
            Add another shop
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit shop" : "Add a new shop"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="businessName">Business name</FieldLabel>
                <Input id="businessName" {...register("businessName")} />
                <FieldError errors={[errors.businessName]} />
              </Field>

              <Field>
                <FieldLabel>Shop logo (optional)</FieldLabel>
                <div className="flex items-center gap-3">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt="Shop logo"
                      className="size-12 shrink-0 rounded-lg border object-cover"
                    />
                  ) : (
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">
                      No logo
                    </div>
                  )}
                  <label
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "cursor-pointer",
                      logoUploading && "pointer-events-none opacity-50"
                    )}
                  >
                    {logoUploading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Upload className="size-4" />
                    )}
                    {logoUploading ? "Uploading..." : imageUrl ? "Change logo" : "Upload logo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file);
                      }}
                    />
                  </label>
                </div>
                <FieldError errors={[errors.imageUrl]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea id="description" rows={3} {...register("description")} />
                <FieldError errors={[errors.description]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="phone">Contact phone</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="0712345678"
                  {...register("phone")}
                />
                <FieldError errors={[errors.phone]} />
              </Field>

              <Field>
                <FieldLabel>Location</FieldLabel>
                <LocationPicker
                  onLocate={async (coords) => {
                    setValue("latitude", coords.latitude, { shouldValidate: true });
                    setValue("longitude", coords.longitude, { shouldValidate: true });
                    setLocating(true);
                    const address = await reverseGeocode(coords.latitude, coords.longitude);
                    if (address) setValue("address", address, { shouldValidate: true });
                    setLocating(false);
                  }}
                />
                {latitude !== undefined && longitude !== undefined && (
                  <FieldDescription>
                    {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
                  </FieldDescription>
                )}
                <FieldError errors={[errors.latitude ?? errors.longitude]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="address">
                  Address (optional)
                  {locating && <Loader2 className="ml-2 inline size-3 animate-spin" />}
                </FieldLabel>
                <Input
                  id="address"
                  placeholder="Filled in from the map — edit if needed"
                  {...register("address")}
                />
                <FieldError errors={[errors.address]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="tiktokUrl">TikTok (optional)</FieldLabel>
                <Input
                  id="tiktokUrl"
                  placeholder="https://tiktok.com/@yourshop"
                  {...register("tiktokUrl")}
                />
                <FieldError errors={[errors.tiktokUrl]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="facebookUrl">Facebook (optional)</FieldLabel>
                <Input
                  id="facebookUrl"
                  placeholder="https://facebook.com/yourshop"
                  {...register("facebookUrl")}
                />
                <FieldError errors={[errors.facebookUrl]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="instagramUrl">Instagram (optional)</FieldLabel>
                <Input
                  id="instagramUrl"
                  placeholder="https://instagram.com/yourshop"
                  {...register("instagramUrl")}
                />
                <FieldError errors={[errors.instagramUrl]} />
              </Field>

              <Field>
                <FieldLabel>Promo video (optional)</FieldLabel>
                <Select
                  items={{ YOUTUBE: "YouTube link", UPLOAD: "Upload a video" }}
                  value={videoSource}
                  onValueChange={(value) =>
                    setValue("videoSource", value as "YOUTUBE" | "UPLOAD", {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YOUTUBE">YouTube link</SelectItem>
                    <SelectItem value="UPLOAD">Upload a video</SelectItem>
                  </SelectContent>
                </Select>

                {videoSource === "YOUTUBE" ? (
                  <Input
                    className="mt-2"
                    placeholder="https://youtube.com/watch?v=..."
                    {...register("videoUrl")}
                  />
                ) : (
                  <div className="mt-2 flex items-center gap-3">
                    <label
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "cursor-pointer",
                        uploading && "pointer-events-none opacity-50"
                      )}
                    >
                      {uploading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Upload className="size-4" />
                      )}
                      {uploading ? "Uploading..." : "Choose video"}
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                      />
                    </label>
                    {watch("videoUrl") && (
                      <span className="text-xs text-muted-foreground">Video ready</span>
                    )}
                  </div>
                )}
                <FieldError errors={[errors.videoUrl]} />
              </Field>

              <DialogFooter className="mt-2">
                <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || uploading}>
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  {editing ? "Save changes" : "Add shop"}
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
