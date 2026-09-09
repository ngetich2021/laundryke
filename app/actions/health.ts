"use server";

import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { runHealthCheck, renderHealthReportHtml, type HealthReport } from "@/lib/health-check";
import { sendHealthReport } from "@/lib/mailer";

export async function runHealthCheckNow() {
  await requirePermission("MANAGE_SUPPORT");

  const report = await runHealthCheck();

  await prisma.healthCheckLog.create({
    data: { status: report.overallStatus, report: JSON.stringify(report) },
  });

  const adminEmail = process.env.ADMIN_ALERT_EMAIL;
  if (adminEmail) {
    await sendHealthReport({ to: adminEmail, html: renderHealthReportHtml(report) }).catch(() => {
      // The check itself already ran and was logged; email delivery is best-effort.
    });
  }

  return report;
}

export async function getRecentHealthLogs() {
  await requirePermission("MANAGE_SUPPORT");
  const logs = await prisma.healthCheckLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return logs.map((log) => ({
    id: log.id,
    status: log.status,
    createdAt: log.createdAt,
    report: JSON.parse(log.report) as HealthReport,
  }));
}
