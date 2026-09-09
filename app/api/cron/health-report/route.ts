import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runHealthCheck, renderHealthReportHtml } from "@/lib/health-check";
import { sendHealthReport } from "@/lib/mailer";

// Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically once
// CRON_SECRET is set as a project env var — see vercel.json for the schedule.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = await runHealthCheck();

  await prisma.healthCheckLog.create({
    data: { status: report.overallStatus, report: JSON.stringify(report) },
  });

  const adminEmail = process.env.ADMIN_ALERT_EMAIL;
  if (adminEmail) {
    await sendHealthReport({ to: adminEmail, html: renderHealthReportHtml(report) }).catch(() => {
      // The check already ran and was logged; email delivery is best-effort.
    });
  }

  return NextResponse.json({ status: report.overallStatus, generatedAt: report.generatedAt });
}
