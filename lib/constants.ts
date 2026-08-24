export const ADVERTISE_PRICE_PER_DAY_KES = 20;

export function advertiseAmount(days: number): number {
  return days * ADVERTISE_PRICE_PER_DAY_KES;
}
