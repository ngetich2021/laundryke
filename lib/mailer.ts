import "server-only";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendMail(opts: { to: string; subject: string; html: string }) {
  await transporter.sendMail({
    from: `"Dr. Wash" <${process.env.GMAIL_USER}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}

export async function verifyMailTransport(): Promise<void> {
  await transporter.verify();
}

export async function sendSupportReply({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  await sendMail({
    to,
    subject: `Re: ${subject} — Dr. Wash Support`,
    html: `
      <p>Hi,</p>
      <p>${body.replace(/\n/g, "<br/>")}</p>
      <p style="color:#666;font-size:12px;margin-top:24px">Reply from the Support tab in your Dr. Wash dashboard.</p>
    `,
  });
}

export async function sendHealthReport({ to, html }: { to: string; html: string }) {
  await sendMail({ to, subject: "Dr. Wash — Daily system health report", html });
}

export async function sendAdvertiseReceipt({
  to,
  businessName,
  amount,
  days,
  mpesaReceipt,
}: {
  to: string;
  businessName: string;
  amount: number;
  days: number;
  mpesaReceipt: string;
}) {
  await sendMail({
    to,
    subject: "Your listing is now promoted — Dr. Wash",
    html: `
      <p>Hi,</p>
      <p><strong>${businessName}</strong> is now featured on Dr. Wash for the next ${days} day(s).</p>
      <p>Amount paid: KES ${amount}<br/>M-Pesa receipt: ${mpesaReceipt}</p>
      <p>Thanks for advertising with us.</p>
    `,
  });
}
