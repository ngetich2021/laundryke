import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SUPPORT_CONTACT_EMAIL } from "@/lib/constants";

export const metadata = { title: "Privacy Policy — Dr. Wash" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex flex-col gap-2 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
        <div>
          <h1 className="text-2xl font-bold">Privacy Policy</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Last updated September 2026. This explains what Dr. Wash collects, why, and how to
            reach us about it.
          </p>
        </div>

        <Section title="Who we are">
          <p>
            Dr. Wash is a directory that connects laundry shop owners in Kenya with nearby
            customers. This policy covers both shop owners who list a business and visitors who
            browse listings.
          </p>
        </Section>

        <Section title="What we collect">
          <ul className="list-disc pl-5">
            <li>Your Google account name, email address, and profile photo when you sign in.</li>
            <li>Your phone number and location description, if you add them to your profile.</li>
            <li>
              Shop details you submit — business name, description, address, map location, prices,
              and any photos/videos, which are stored via Cloudinary.
            </li>
            <li>
              M-Pesa payment metadata for promotion payments (amount, phone number, M-Pesa receipt
              number, status) — we never see or store your M-Pesa PIN or card details; those are
              handled directly by Safaricom Daraja.
            </li>
            <li>
              Content you send us: support tickets, feedback, and messages to the AI chat
              assistant.
            </li>
            <li>
              Approximate referral link click counts on shops with an active referral offer — we
              do not record individual visitors or IP addresses for this.
            </li>
          </ul>
        </Section>

        <Section title="Why we collect it">
          <p>
            To operate the shop directory and search, process promotion payments, respond to
            support requests, improve the app based on feedback, and power the AI chat assistant&apos;s
            answers about your account when relevant.
          </p>
        </Section>

        <Section title="Who we share it with">
          <ul className="list-disc pl-5">
            <li>Google — for sign-in.</li>
            <li>Safaricom Daraja (M-Pesa) — to process promotion payments.</li>
            <li>Cloudinary — to host shop images and videos.</li>
            <li>Groq — to generate AI chat assistant replies (your chat messages are sent to Groq&apos;s API to produce a response).</li>
            <li>Turso — our database host.</li>
          </ul>
          <p>We do not sell your data to anyone.</p>
        </Section>

        <Section title="Cookies">
          <p>
            We use a single session cookie to keep you signed in. We don&apos;t use tracking or
            advertising cookies.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            You can update or delete your shop listing and profile details at any time from your
            dashboard. To request a copy of your data or full account deletion, email{" "}
            <a href={`mailto:${SUPPORT_CONTACT_EMAIL}`} className="underline">
              {SUPPORT_CONTACT_EMAIL}
            </a>{" "}
            or open a support ticket from your dashboard.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If this policy changes materially, we&apos;ll update the date at the top of this page.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy or your data:{" "}
            <a href={`mailto:${SUPPORT_CONTACT_EMAIL}`} className="underline">
              {SUPPORT_CONTACT_EMAIL}
            </a>
            .
          </p>
          <Link href="/" className="underline">
            Back to Dr. Wash
          </Link>
        </Section>
      </div>
    </div>
  );
}
