export const ADVERTISE_PRICE_PER_DAY_KES = 20;
export const VIDEO_PRICE_PER_DAY_KES = 20;

export function advertiseAmount(days: number): number {
  return days * ADVERTISE_PRICE_PER_DAY_KES;
}

export function videoAddonAmount(days: number): number {
  return days * VIDEO_PRICE_PER_DAY_KES;
}

export function totalPromoteAmount(days: number, includeVideo: boolean): number {
  return advertiseAmount(days) + (includeVideo ? videoAddonAmount(days) : 0);
}

// Referral program bounds — a shop owner's reward to customers who refer
// friends (see app/actions/referrals.ts).
export const REFERRAL_PERCENTAGE_MIN = 1;
export const REFERRAL_PERCENTAGE_MAX = 99;
export const REFERRAL_FIXED_AMOUNT_MIN_KES = 1;
export const REFERRAL_FIXED_AMOUNT_MAX_KES = 100_000;

// AI assistant (Groq — see lib/groq.ts)
export const GROQ_MODEL = "openai/gpt-oss-120b";
export const CHAT_MESSAGE_MAX_LENGTH = 1000;
export const CHAT_RATE_LIMIT_MAX_MESSAGES = 15;
export const CHAT_RATE_LIMIT_WINDOW_MS = 60_000;

// Public-facing contact shown in the UI (privacy policy, chat assistant).
// The actual mailbox is process.env.ADMIN_ALERT_EMAIL, read server-side only
// (this file is also imported by client components, where env vars other
// than NEXT_PUBLIC_* aren't available).
export const SUPPORT_CONTACT_EMAIL = "ngetichjustine1@gmail.com";
