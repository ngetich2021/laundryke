"use client";

import { Gift } from "lucide-react";
import { DataTable, sortableHeader, type ColumnDef } from "@/components/ui/data-table";
import type { getAllReferralOffersForAdmin } from "@/app/actions/referrals";

type AdminReferralOffer = Awaited<ReturnType<typeof getAllReferralOffersForAdmin>>[number];

export function AdminReferralsPanel({ offers }: { offers: AdminReferralOffer[] }) {
  const columns: ColumnDef<AdminReferralOffer, unknown>[] = [
    { accessorKey: "businessName", header: sortableHeader<AdminReferralOffer>("Shop") },
    {
      id: "owner",
      header: sortableHeader<AdminReferralOffer>("Owner"),
      accessorFn: (row) => row.owner.name ?? row.owner.email,
    },
    {
      id: "reward",
      header: "Reward",
      cell: ({ row }) =>
        row.original.referralRewardType === "PERCENTAGE"
          ? `${row.original.referralRewardValue}% off`
          : `KES ${row.original.referralRewardValue} off`,
    },
    {
      accessorKey: "referralClickCount",
      header: sortableHeader<AdminReferralOffer>("Clicks"),
    },
    {
      id: "description",
      header: "Message",
      cell: ({ row }) => row.original.referralDescription ?? "—",
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Gift className="size-4" />
        Shops currently running a referral offer, sorted by clicks.
      </p>
      <DataTable
        columns={columns}
        data={offers}
        csvFilename="referral-offers.csv"
        csvData={offers.map((o) => ({
          shop: o.businessName,
          owner: o.owner.name ?? o.owner.email,
          rewardType: o.referralRewardType,
          rewardValue: o.referralRewardValue,
          clicks: o.referralClickCount,
        }))}
        emptyMessage="No shop has set up a referral offer yet."
      />
    </div>
  );
}
