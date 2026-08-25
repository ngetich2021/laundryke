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
