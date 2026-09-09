"use client";

import { useState } from "react";
import { Gift } from "lucide-react";
import { DataTable, sortableHeader, type ColumnDef } from "@/components/ui/data-table";
import { DetailDialog, type DetailField } from "@/components/ui/detail-dialog";
import type { getAllReferralOffersForAdmin } from "@/app/actions/referrals";

type AdminReferralOffer = Awaited<ReturnType<typeof getAllReferralOffersForAdmin>>[number];

function rewardText(offer: AdminReferralOffer): string {
  return offer.referralRewardType === "PERCENTAGE"
    ? `${offer.referralRewardValue}% off`
    : `KES ${offer.referralRewardValue} off`;
}

export function AdminReferralsPanel({ offers }: { offers: AdminReferralOffer[] }) {
  const [detail, setDetail] = useState<AdminReferralOffer | null>(null);

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
      cell: ({ row }) => rewardText(row.original),
    },
    {
      accessorKey: "referralClickCount",
      header: sortableHeader<AdminReferralOffer>("Clicks"),
    },
    {
      id: "description",
      header: "Message",
      cell: ({ row }) => <span className="line-clamp-1">{row.original.referralDescription ?? "—"}</span>,
    },
  ];

  const fields: DetailField[] = detail
    ? [
        { label: "Shop", value: detail.businessName },
        { label: "Owner", value: detail.owner.name ?? detail.owner.email },
        { label: "Reward", value: rewardText(detail) },
        { label: "Clicks", value: detail.referralClickCount },
        { label: "Message", value: detail.referralDescription ?? "—" },
      ]
    : [];

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
        onRowClick={setDetail}
      />

      <DetailDialog
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
        title="Referral offer"
        fields={fields}
      />
    </div>
  );
}
