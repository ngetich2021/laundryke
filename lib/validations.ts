import { z } from "zod";
import { isValidYoutubeUrl } from "@/lib/youtube";

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
