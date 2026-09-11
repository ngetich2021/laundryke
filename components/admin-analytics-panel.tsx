"use client";

import { Phone, MessageCircle, PlusSquare, Eye } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { getAnalyticsSummary } from "@/app/actions/analytics";

type AnalyticsSummary = Awaited<ReturnType<typeof getAnalyticsSummary>>;
type Bucket = AnalyticsSummary["trends"]["daily"][number];

const TREND_TABS: { value: keyof AnalyticsSummary["trends"]; label: string }[] = [
  { value: "daily", label: "Daily (14d)" },
  { value: "weekly", label: "Weekly (12wk)" },
  { value: "monthly", label: "Monthly (12mo)" },
  { value: "yearly", label: "Yearly (5yr)" },
];

function TrendBars({ buckets, valueOf, barClassName }: {
  buckets: Bucket[];
  valueOf: (b: Bucket) => number;
  barClassName?: string;
}) {
  const max = Math.max(1, ...buckets.map(valueOf));
  return (
    <div className="flex flex-col gap-1.5">
      {buckets.map((bucket) => {
        const value = valueOf(bucket);
        return (
          <div key={bucket.label} className="flex items-center gap-2 text-xs">
            <span className="w-24 shrink-0 text-muted-foreground">{bucket.label}</span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={barClassName ?? "h-full rounded-full bg-blue-600 dark:bg-blue-500"}
                style={{ width: `${(value / max) * 100}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right font-medium">{value}</span>
          </div>
        );
      })}
    </div>
  );
}

function TrendCard({ title, buckets, valueOf, barClassName }: {
  title: string;
  buckets: AnalyticsSummary["trends"];
  valueOf: (b: Bucket) => number;
  barClassName?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily">
          <TabsList variant="line">
            {TREND_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {TREND_TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              <TrendBars buckets={buckets[tab.value]} valueOf={valueOf} barClassName={barClassName} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

const EVENT_META = {
  CALL_CLICK: { label: "Call clicks", icon: Phone },
  WHATSAPP_CLICK: { label: "WhatsApp clicks", icon: MessageCircle },
  LISTING_SUBMITTED: { label: "Listings submitted", icon: PlusSquare },
} as const;

function TotalsRow({ label, counts }: { label: string; counts: AnalyticsSummary["totals"]["today"] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(Object.keys(EVENT_META) as (keyof typeof EVENT_META)[]).map((type) => {
        const { label: eventLabel, icon: Icon } = EVENT_META[type];
        return (
          <div key={type} className="rounded-lg border p-2.5 text-center">
            <p className="flex items-center justify-center gap-1.5 text-lg font-semibold">
              <Icon className="size-4 text-muted-foreground" />
              {counts[type]}
            </p>
            <p className="text-[11px] text-muted-foreground">{eventLabel}</p>
          </div>
        );
      })}
      <p className="col-span-3 -mt-1 text-center text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function AdminAnalyticsPanel({ summary }: { summary: AnalyticsSummary | null }) {
  if (!summary) {
    return <p className="py-6 text-center text-muted-foreground">No analytics data yet.</p>;
  }

  const { totals, trends, topListings } = summary;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Site visits and goal conversions tracked in-app. This visit count is a simple page-load
        counter (no bot filtering or unique-visitor dedup) — for the more precise numbers, plus
        traffic sources, top pages, bounce rate and device/location breakdown, see your Cloudflare
        Web Analytics dashboard.
      </p>

      <div className="grid grid-cols-3 gap-2 sm:max-w-md">
        {(["today", "last7d", "last30d"] as const).map((period) => (
          <div key={period} className="rounded-lg border p-2.5 text-center">
            <p className="flex items-center justify-center gap-1.5 text-lg font-semibold">
              <Eye className="size-4 text-muted-foreground" />
              {totals[period].PAGE_VIEW}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {period === "today" ? "Today" : period === "last7d" ? "Last 7 days" : "Last 30 days"}
            </p>
          </div>
        ))}
      </div>

      <TrendCard
        title="Site visits over time"
        buckets={trends}
        valueOf={(b) => b.PAGE_VIEW}
        barClassName="h-full rounded-full bg-emerald-600 dark:bg-emerald-500"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <TotalsRow label="Today" counts={totals.today} />
        <TotalsRow label="Last 7 days" counts={totals.last7d} />
        <TotalsRow label="Last 30 days" counts={totals.last30d} />
      </div>

      <TrendCard
        title="Conversions over time"
        buckets={trends}
        valueOf={(b) => b.CALL_CLICK + b.WHATSAPP_CLICK + b.LISTING_SUBMITTED}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Top listings by lead clicks (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {topListings.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No lead clicks yet.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {topListings.map((listing) => (
                <div
                  key={listing.listingId}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <span className="font-medium">{listing.businessName}</span>
                  <span className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="size-3" /> {listing.CALL_CLICK}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="size-3" /> {listing.WHATSAPP_CLICK}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
