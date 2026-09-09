import "server-only";
import { prisma } from "@/lib/prisma";
import { verifyMailTransport } from "@/lib/mailer";
import { getAccessToken as getMpesaAccessToken } from "@/lib/mpesa";
import { pingGroq } from "@/lib/groq";

export type ServiceCheck = {
  name: string;
  ok: boolean;
  latencyMs: number;
  detail?: string;
};

export type HealthMetrics = {
  totalUsers: number;
  activeListings: number;
  pendingPayments24h: number;
  openSupportTickets: number;
  newFeedback24h: number;
  chatMessages24h: number;
  activeReferralOffers: number;
};

export type HealthReport = {
  services: ServiceCheck[];
  metrics: HealthMetrics;
  overallStatus: "OK" | "DEGRADED" | "DOWN";
  generatedAt: string;
};

async function timed(name: string, fn: () => Promise<string | void>): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const detail = await fn();
    return { name, ok: true, latencyMs: Date.now() - start, detail: detail ?? undefined };
  } catch (err) {
    return {
      name,
      ok: false,
      latencyMs: Date.now() - start,
      detail: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function checkDatabase() {
  return timed("Database (Turso/libSQL)", async () => {
    await prisma.$queryRaw`SELECT 1`;
  });
}

async function checkMpesa() {
  return timed("M-Pesa (Safaricom Daraja)", async () => {
    if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
      throw new Error("MPESA_CONSUMER_KEY/SECRET not configured");
    }
    await getMpesaAccessToken();
  });
}

async function checkCloudinary() {
  return timed("Cloudinary", async () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Cloudinary env vars not configured");
    }
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?max_results=1`,
      { headers: { Authorization: `Basic ${auth}` }, cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Cloudinary API returned ${res.status}`);
  });
}

async function checkEmail() {
  return timed("Email (Gmail SMTP)", async () => {
    await verifyMailTransport();
  });
}

async function checkGroq() {
  return timed("AI assistant (Groq)", async () => {
    await pingGroq();
  });
}

async function collectMetrics(): Promise<HealthMetrics> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeListings,
    pendingPayments24h,
    openSupportTickets,
    newFeedback24h,
    chatMessages24h,
    activeReferralOffers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count({ where: { isActive: true } }),
    prisma.payment.count({ where: { status: "PENDING", createdAt: { gte: since24h } } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.feedback.count({ where: { createdAt: { gte: since24h } } }),
    prisma.chatMessage.count({ where: { createdAt: { gte: since24h } } }),
    prisma.listing.count({ where: { referralRewardType: { not: null } } }),
  ]);

  return {
    totalUsers,
    activeListings,
    pendingPayments24h,
    openSupportTickets,
    newFeedback24h,
    chatMessages24h,
    activeReferralOffers,
  };
}

export async function runHealthCheck(): Promise<HealthReport> {
  const services = await Promise.all([
    checkDatabase(),
    checkMpesa(),
    checkCloudinary(),
    checkEmail(),
    checkGroq(),
  ]);
  const metrics = await collectMetrics();

  const failures = services.filter((s) => !s.ok).length;
  const overallStatus: HealthReport["overallStatus"] =
    failures === 0 ? "OK" : failures === services.length ? "DOWN" : "DEGRADED";

  return { services, metrics, overallStatus, generatedAt: new Date().toISOString() };
}

export function renderHealthReportHtml(report: HealthReport): string {
  const statusColor = { OK: "#16a34a", DEGRADED: "#d97706", DOWN: "#dc2626" }[report.overallStatus];

  const rows = report.services
    .map(
      (s) => `
        <tr>
          <td style="padding:6px 10px;border-bottom:1px solid #eee">${s.name}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;color:${s.ok ? "#16a34a" : "#dc2626"}">${s.ok ? "OK" : "FAILED"}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee">${s.latencyMs}ms</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee">${s.detail ?? ""}</td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:sans-serif;max-width:600px">
      <h2 style="margin-bottom:0">Dr. Wash — Daily system health report</h2>
      <p style="color:${statusColor};font-weight:bold;margin-top:4px">Overall status: ${report.overallStatus}</p>
      <table style="border-collapse:collapse;width:100%;font-size:13px">
        <thead>
          <tr style="text-align:left;background:#f5f5f5">
            <th style="padding:6px 10px">Service</th>
            <th style="padding:6px 10px">Status</th>
            <th style="padding:6px 10px">Latency</th>
            <th style="padding:6px 10px">Detail</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <h3>Metrics (last 24h where noted)</h3>
      <ul style="font-size:13px;line-height:1.6">
        <li>Total users: ${report.metrics.totalUsers}</li>
        <li>Active listings: ${report.metrics.activeListings}</li>
        <li>Pending payments (24h): ${report.metrics.pendingPayments24h}</li>
        <li>Open support tickets: ${report.metrics.openSupportTickets}</li>
        <li>New feedback (24h): ${report.metrics.newFeedback24h}</li>
        <li>Chat messages (24h): ${report.metrics.chatMessages24h}</li>
        <li>Active referral offers: ${report.metrics.activeReferralOffers}</li>
      </ul>
      <p style="color:#999;font-size:11px">Generated ${new Date(report.generatedAt).toLocaleString()}</p>
    </div>
  `;
}
