import { z } from "zod";
import { isValidYoutubeUrl } from "@/lib/youtube";
import {
  REFERRAL_PERCENTAGE_MIN,
  REFERRAL_PERCENTAGE_MAX,
  REFERRAL_FIXED_AMOUNT_MIN_KES,
  REFERRAL_FIXED_AMOUNT_MAX_KES,
  CHAT_MESSAGE_MAX_LENGTH,
} from "@/lib/constants";

// Accepts 07XXXXXXXX, 01XXXXXXXX, 2547XXXXXXXX, 2541XXXXXXXX, or with a
// leading +. Used for both display validation and M-Pesa STK push targets.
export const kenyanPhoneRegex = /^(?:\+?254|0)(7\d{8}|1\d{8})$/;

export function normalizeKenyanPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  return `254${digits}`;
}

export const phoneSchema = z
  .string()
  .trim()
  .regex(kenyanPhoneRegex, "Enter a valid Kenyan phone number, e.g. 0712345678");

export const coordinatesSchema = z.object({
  latitude: z.coerce.number().min(-90, "Invalid latitude").max(90, "Invalid latitude"),
  longitude: z.coerce
    .number()
    .min(-180, "Invalid longitude")
    .max(180, "Invalid longitude"),
});

const urlSchema = z.string().trim().url("Enter a valid URL").optional().or(z.literal(""));

export const listingSchema = z
  .object({
    businessName: z.string().trim().min(2, "Too short").max(80, "Too long"),
    description: z
      .string()
      .trim()
      .min(10, "Tell customers a bit more (min 10 characters)")
      .max(500, "Keep it under 500 characters"),
    phone: phoneSchema.optional().or(z.literal("")),
    address: z.string().trim().max(120, "Too long").optional().or(z.literal("")),
    latitude: coordinatesSchema.shape.latitude.optional(),
    longitude: coordinatesSchema.shape.longitude.optional(),
    videoSource: z.enum(["YOUTUBE", "UPLOAD"]).optional(),
    videoUrl: z.string().trim().optional().or(z.literal("")),
    imageUrl: z.string().trim().optional().or(z.literal("")),
    tiktokUrl: urlSchema,
    facebookUrl: urlSchema,
    instagramUrl: urlSchema,
  })
  .refine(
    (data) =>
      data.videoSource !== "YOUTUBE" || !data.videoUrl || isValidYoutubeUrl(data.videoUrl),
    {
      message: "Enter a valid YouTube URL",
      path: ["videoUrl"],
    }
  );

export type ListingInput = z.infer<typeof listingSchema>;

export const advertiseSchema = z.object({
  listingId: z.string().min(1),
  phone: phoneSchema,
  days: z.coerce.number().int().min(1, "At least 1 day").max(30, "Max 30 days"),
  includeVideo: z.boolean().optional().default(false),
});

export type AdvertiseInput = z.infer<typeof advertiseSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Too short").max(60, "Too long"),
  phone: phoneSchema,
  locationDescription: z.string().trim().max(200, "Keep it under 200 characters").optional().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const priceItemSchema = z.object({
  label: z.string().trim().min(1, "Required").max(40, "Too long"),
  priceKes: z.coerce
    .number()
    .int("Whole numbers only")
    .min(1, "Must be at least 1")
    .max(1_000_000, "Too large"),
});

export type PriceItemInput = z.infer<typeof priceItemSchema>;

export const referralOfferSchema = z
  .object({
    rewardType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    value: z.coerce.number().int(),
    description: z.string().trim().max(140, "Keep it under 140 characters").optional().or(z.literal("")),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) =>
      data.rewardType !== "PERCENTAGE" ||
      (data.value >= REFERRAL_PERCENTAGE_MIN && data.value <= REFERRAL_PERCENTAGE_MAX),
    {
      message: `Enter a percentage between ${REFERRAL_PERCENTAGE_MIN} and ${REFERRAL_PERCENTAGE_MAX}`,
      path: ["value"],
    }
  )
  .refine(
    (data) =>
      data.rewardType !== "FIXED_AMOUNT" ||
      (data.value >= REFERRAL_FIXED_AMOUNT_MIN_KES && data.value <= REFERRAL_FIXED_AMOUNT_MAX_KES),
    {
      message: `Enter an amount between KES ${REFERRAL_FIXED_AMOUNT_MIN_KES} and ${REFERRAL_FIXED_AMOUNT_MAX_KES}`,
      path: ["value"],
    }
  );

export type ReferralOfferInput = z.infer<typeof referralOfferSchema>;

export const supportTicketSchema = z.object({
  subject: z.string().trim().min(3, "Too short").max(100, "Too long"),
  message: z.string().trim().min(5, "Tell us a bit more").max(2000, "Keep it under 2000 characters"),
});

export type SupportTicketInput = z.infer<typeof supportTicketSchema>;

export const supportMessageSchema = z.object({
  body: z.string().trim().min(1, "Message can't be empty").max(2000, "Keep it under 2000 characters"),
});

export type SupportMessageInput = z.infer<typeof supportMessageSchema>;

export const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1, "Pick a rating").max(5, "Pick a rating"),
  category: z.enum(["BUG", "SUGGESTION", "COMPLIMENT", "OTHER"]).default("OTHER"),
  message: z.string().trim().min(3, "Tell us a bit more").max(1000, "Keep it under 1000 characters"),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

export const chatMessageSchema = z.object({
  message: z.string().trim().min(1).max(CHAT_MESSAGE_MAX_LENGTH),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(CHAT_MESSAGE_MAX_LENGTH),
      })
    )
    .max(12)
    .optional()
    .default([]),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

export const clientSchema = z.object({
  name: z.string().trim().min(2, "Too short").max(80, "Too long"),
  phone: phoneSchema.optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  notes: z.string().trim().max(500, "Keep it under 500 characters").optional().or(z.literal("")),
});

export type ClientInput = z.infer<typeof clientSchema>;

export const visitSchema = z.object({
  amountKes: z.coerce.number().int().min(0, "Can't be negative").max(1_000_000, "Too large").optional(),
  notes: z.string().trim().max(300, "Keep it under 300 characters").optional().or(z.literal("")),
});

export type VisitInput = z.infer<typeof visitSchema>;

export const loyaltyProgramSchema = z.object({
  punchesRequired: z.coerce.number().int().min(1, "At least 1").max(100, "Max 100"),
  rewardDescription: z.string().trim().min(2, "Too short").max(140, "Keep it under 140 characters"),
  isActive: z.boolean().default(true),
});

export type LoyaltyProgramInput = z.infer<typeof loyaltyProgramSchema>;

export const campaignTargetSchema = z
  .object({
    title: z.string().trim().min(2, "Too short").max(80, "Too long"),
    metric: z.enum(["NEW_CLIENTS", "VISITS", "REVENUE_KES", "CUSTOM"]),
    targetValue: z.coerce.number().int().min(1, "Must be at least 1").max(10_000_000, "Too large"),
    startDate: z.string().min(1, "Required"),
    endDate: z.string().min(1, "Required"),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after the start date",
    path: ["endDate"],
  });

export type CampaignTargetInput = z.infer<typeof campaignTargetSchema>;
