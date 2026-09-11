"use server";

import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import type { AnalyticsEventType } from "@/lib/generated/prisma/client";

const TRACKED_TYPES: AnalyticsEventType[] = [
  "CALL_CLICK",
  "WHATSAPP_CLICK",
  "LISTING_SUBMITTED",
  "PAGE_VIEW",
];

// Called from public pages (listing cards, the post-listing form) — no auth
// required, and failures are swallowed since a tracking miss shouldn't ever
// block the underlying action (a call, a WhatsApp chat, a listing save).
export async function recordAnalyticsEvent(type: AnalyticsEventType, listingId?: string) {
  await prisma.analyticsEvent
    .create({ data: { type, listingId: listingId || null } })
    .catch(() => {});
}

type EventCounts = {
  CALL_CLICK: number;
  WHATSAPP_CLICK: number;
  LISTING_SUBMITTED: number;
  PAGE_VIEW: number;
};
type Bucket = EventCounts & { label: string };

function emptyCounts(): EventCounts {
  return { CALL_CLICK: 0, WHATSAPP_CLICK: 0, LISTING_SUBMITTED: 0, PAGE_VIEW: 0 };
}

function incr(map: Map<string, EventCounts>, key: string, type: AnalyticsEventType) {
  if (!map.has(key)) map.set(key, emptyCounts());
  map.get(key)![type]++;
}

// All bucketing below is UTC-based (matches how SQLite stores the
// timestamps) — good enough for an internal trend view, not meant to align
// to any particular visitor's local calendar day.
function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function monthKey(d: Date) {
  return d.toISOString().slice(0, 7);
}

function yearKey(d: Date) {
  return d.toISOString().slice(0, 4);
}

function startOfWeekUTC(d: Date) {
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const r = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  r.setUTCDate(r.getUTCDate() + diff);
  return r;
}

function addDaysUTC(d: Date, n: number) {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

function startOfMonthUTC(d: Date, monthOffset = 0) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + monthOffset, 1));
}

function startOfYearUTC(d: Date, yearOffset = 0) {
  return new Date(Date.UTC(d.getUTCFullYear() + yearOffset, 0, 1));
}

function dayLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function monthLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

function buildBuckets(count: number, dataMap: Map<string, EventCounts>, at: (i: number) => { key: string; label: string }): Bucket[] {
  return Array.from({ length: count }, (_, i) => {
    const { key, label } = at(i);
    return { label, ...(dataMap.get(key) ?? emptyCounts()) };
  });
}

export async function getAnalyticsSummary() {
  await requirePermission("MANAGE_SUPPORT");

  const now = new Date();
  const since7 = addDaysUTC(now, -7);
  const since30 = addDaysUTC(now, -30);
  // Yearly view covers the current + 4 prior years — also wide enough to
  // seed the weekly/monthly buckets, so this is the only query we need.
  const queryFrom = startOfYearUTC(now, -4);

  const events = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: queryFrom } },
    include: { listing: { select: { businessName: true } } },
    orderBy: { createdAt: "desc" },
  });

  const todayKey = dayKey(now);

  const totals = {
    today: emptyCounts(),
    last7d: emptyCounts(),
    last30d: emptyCounts(),
  };

  const dailyMap = new Map<string, EventCounts>();
  const weeklyMap = new Map<string, EventCounts>();
  const monthlyMap = new Map<string, EventCounts>();
  const yearlyMap = new Map<string, EventCounts>();
  const listingCounts = new Map<
    string,
    { businessName: string; CALL_CLICK: number; WHATSAPP_CLICK: number }
  >();

  for (const event of events) {
    const t = event.createdAt;
    if (t >= since30) totals.last30d[event.type]++;
    if (t >= since7) totals.last7d[event.type]++;
    if (dayKey(t) === todayKey) totals.today[event.type]++;

    incr(dailyMap, dayKey(t), event.type);
    incr(weeklyMap, dayKey(startOfWeekUTC(t)), event.type);
    incr(monthlyMap, monthKey(t), event.type);
    incr(yearlyMap, yearKey(t), event.type);

    if (
      t >= since30 &&
      event.listingId &&
      event.listing &&
      (event.type === "CALL_CLICK" || event.type === "WHATSAPP_CLICK")
    ) {
      const type = event.type;
      if (!listingCounts.has(event.listingId)) {
        listingCounts.set(event.listingId, {
          businessName: event.listing.businessName,
          CALL_CLICK: 0,
          WHATSAPP_CLICK: 0,
        });
      }
      listingCounts.get(event.listingId)![type]++;
    }
  }

  const daily = buildBuckets(14, dailyMap, (i) => {
    const d = addDaysUTC(now, -(13 - i));
    return { key: dayKey(d), label: dayLabel(d) };
  });

  const weekly = buildBuckets(12, weeklyMap, (i) => {
    const d = addDaysUTC(startOfWeekUTC(now), -(11 - i) * 7);
    return { key: dayKey(d), label: `Wk of ${dayLabel(d)}` };
  });

  const monthly = buildBuckets(12, monthlyMap, (i) => {
    const d = startOfMonthUTC(now, -(11 - i));
    return { key: monthKey(d), label: monthLabel(d) };
  });

  const yearly = buildBuckets(5, yearlyMap, (i) => {
    const d = startOfYearUTC(now, -(4 - i));
    return { key: yearKey(d), label: yearKey(d) };
  });

  const topListings = Array.from(listingCounts.entries())
    .map(([listingId, v]) => ({ listingId, ...v, total: v.CALL_CLICK + v.WHATSAPP_CLICK }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    totals,
    trends: { daily, weekly, monthly, yearly },
    topListings,
    trackedTypes: TRACKED_TYPES,
  };
}
