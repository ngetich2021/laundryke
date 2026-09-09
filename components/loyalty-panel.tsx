"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { DataTable, sortableHeader, type ColumnDef } from "@/components/ui/data-table";
import { loyaltyProgramSchema } from "@/lib/validations";
import { setLoyaltyProgram, getMyLoyaltyProgram, getLoyaltyLeaderboard } from "@/app/actions/loyalty";
import { ClientDetailDialog } from "@/components/clients-panel";

type LeaderboardRow = Awaited<ReturnType<typeof getLoyaltyLeaderboard>>[number];

export function LoyaltyPanel({ listingId }: { listingId: string }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [isLoading, startLoading] = useTransition();
  const [detailClientId, setDetailClientId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loyaltyProgramSchema),
    defaultValues: { punchesRequired: 10, rewardDescription: "", isActive: true },
  });

  const isActive = watch("isActive");
  const punchesRequired = isActive ? Number(watch("punchesRequired")) || null : null;

  function refresh() {
    startLoading(async () => {
      const [program, board] = await Promise.all([
        getMyLoyaltyProgram(listingId),
        getLoyaltyLeaderboard(listingId),
      ]);
      reset({
        punchesRequired: program?.punchesRequired ?? 10,
        rewardDescription: program?.rewardDescription ?? "",
        isActive: program?.isActive ?? false,
      });
      setLeaderboard(board);
    });
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  async function onSubmit(data: {
    punchesRequired: number;
    rewardDescription: string;
    isActive: boolean;
  }) {
    const result = await setLoyaltyProgram(listingId, data);
    if (result?.error) {
      toast.error(Object.values(result.error).flat()[0] ?? "Something went wrong");
      return;
    }
    toast.success("Loyalty program saved");
    refresh();
  }

  const columns: ColumnDef<LeaderboardRow, unknown>[] = [
    { accessorKey: "name", header: sortableHeader<LeaderboardRow>("Client") },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone ?? "—",
    },
    {
      accessorKey: "loyaltyPunches",
      header: sortableHeader<LeaderboardRow>("Punches"),
    },
    {
      accessorKey: "loyaltyRedemptions",
      header: sortableHeader<LeaderboardRow>("Redeemed"),
      cell: ({ row }) => <Badge variant="outline">{row.original.loyaltyRedemptions}</Badge>,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="loyalty-active">Loyalty program active</FieldLabel>
            <Switch
              id="loyalty-active"
              checked={isActive}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="punches-required">
              <Award className="mr-1 inline size-4" />
              Punches required for a reward
            </FieldLabel>
            <Input
              id="punches-required"
              type="number"
              min={1}
              max={100}
              {...register("punchesRequired")}
            />
            <FieldError errors={[errors.punchesRequired]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="reward-description">Reward</FieldLabel>
            <Input
              id="reward-description"
              placeholder="e.g. One free wash"
              {...register("rewardDescription")}
            />
            <FieldError errors={[errors.rewardDescription]} />
          </Field>

          <Button type="submit" disabled={isSubmitting} className="w-fit">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </FieldGroup>
      </form>

      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">Leaderboard</p>
        {isLoading && leaderboard.length === 0 ? (
          <div className="flex justify-center py-6 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={leaderboard}
            csvFilename="loyalty-leaderboard.csv"
            csvData={leaderboard.map((c) => ({
              name: c.name,
              phone: c.phone ?? "",
              punches: c.loyaltyPunches,
              redemptions: c.loyaltyRedemptions,
            }))}
            emptyMessage="No clients yet — add punches from the Clients tab."
            onRowClick={(row) => setDetailClientId(row.id)}
          />
        )}
      </div>

      {detailClientId && (
        <ClientDetailDialog
          clientId={detailClientId}
          punchesRequired={punchesRequired}
          onClose={() => setDetailClientId(null)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}
