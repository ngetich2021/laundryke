import "server-only";

const IS_PRODUCTION = process.env.MPESA_ENV === "production";
const BASE_URL = IS_PRODUCTION
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";

async function getAccessToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY!;
  const secret = process.env.MPESA_CONSUMER_SECRET!;
  const credentials = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` }, cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error(`M-Pesa auth failed: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// Where Safaricom should POST the payment result. An explicit
// MPESA_CALLBACK_URL always wins (needed for a custom domain); otherwise
// this falls back to Vercel's own runtime env vars, so the app works out
// of the box on any Vercel deployment without manual configuration.
function resolveCallbackBase(): string {
  const explicit = process.env.MPESA_CALLBACK_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  throw new Error(
    "Set MPESA_CALLBACK_URL to this app's public URL so Safaricom can reach /api/mpesa/callback."
  );
}

function daraTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

export type StkPushResult = {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
};

export async function initiateStkPush({
  phone,
  amount,
  accountReference,
  transactionDesc,
}: {
  /** Normalized to 2547XXXXXXXX / 2541XXXXXXXX */
  phone: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}): Promise<StkPushResult> {
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  const timestamp = daraTimestamp();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString(
    "base64"
  );
  const accessToken = await getAccessToken();
  const callbackBase = resolveCallbackBase();

  const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.MPESA_TILL_NUMBER,
      PhoneNumber: phone,
      CallBackURL: `${callbackBase}/api/mpesa/callback`,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    }),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok || data.ResponseCode !== "0") {
    throw new Error(data?.errorMessage ?? data?.ResponseDescription ?? "STK push failed");
  }

  return data as StkPushResult;
}
