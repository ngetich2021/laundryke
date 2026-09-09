"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { runHealthCheckNow, type getRecentHealthLogs } from "@/app/actions/health";
import { cn } from "@/lib/utils";

type HealthLog = Awaited<ReturnType<typeof getRecentHealthLogs>>[number];

const STATUS_STYLE: Record<string, string> = {
  OK: "text-green-600 dark:text-green-400",
  DEGRADED: "text-amber-600 dark:text-amber-400",
  DOWN: "text-red-600 dark:text-red-400",
};

function MetricsGrid({ metrics }: { metrics: HealthLog["report"]["metrics"] }) {
  const entries: [string, number][] = [
    ["Total users", metrics.totalUsers],
    ["Active listings", metrics.activeListings],
    ["Pending payments (24h)", metrics.pendingPayments24h],
    ["Open tickets", metrics.openSupportTickets],
    ["New feedback (24h)", metrics.newFeedback24h],
    ["Chat messages (24h)", metrics.chatMessages24h],
    ["Active referral offers", metrics.activeReferralOffers],
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {entries.map(([label, value]) => (
        <div key={label} className="rounded-lg border p-2.5 text-center">
          <p className="text-lg font-semibold">{value}</p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}

export function AdminHealthPanel({ initialLogs }: { initialLogs: HealthLog[] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [isPending, startTransition] = useTransition();

  const latest = logs[0];

  function sendNow() {
    startTransition(async () => {
      const report = await runHealthCheckNow();
      toast.success(`Health check complete — status ${report.overallStatus}. Report emailed.`);
      setLogs((prev) => [
        { id: `local-${Date.now()}`, status: report.overallStatus, createdAt: new Date(), report },
        ...prev,
      ]);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          A daily report is emailed automatically (see vercel.json cron). You can also trigger one
          now.
        </p>
        <Button size="sm" onClick={sendNow} disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Send report now
        </Button>
      </div>

      {latest ? (
        <>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {latest.report.services.map((s) => (
              <Card key={s.name}>
                <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 py-3">
                  <CardTitle className="text-sm">{s.name}</CardTitle>
                  {s.ok ? (
                    <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="size-4 text-red-600 dark:text-red-400" />
                  )}
                </CardHeader>
                <CardContent className="py-0 pb-3 text-xs text-muted-foreground">
                  {s.latencyMs}ms{s.detail ? ` — ${s.detail}` : ""}
                </CardContent>
              </Card>
            ))}
          </div>

          <MetricsGrid metrics={latest.report.metrics} />
        </>
      ) : (
        <p className="py-6 text-center text-muted-foreground">
          No health checks have run yet — click &quot;Send report now&quot;.
        </p>
      )}

      {logs.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">History</p>
          <div className="flex flex-col gap-1.5">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <span className={cn("font-medium", STATUS_STYLE[log.status])}>{log.status}</span>
                <Badge variant="outline">
                  {log.report.services.filter((s) => s.ok).length}/{log.report.services.length} up
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
