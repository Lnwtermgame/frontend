import type { Product } from "@/lib/api/products";
import { MOBILE_COUNTRIES } from "@/lib/mobile-countries";

/**
 * Pure helpers for the mobile recharge wizard (spec §5).
 * No React here — everything is unit-testable in isolation.
 */

/** Group active MOBILE_RECHARGE products by countryCode, sorted by salesCount desc. */
export function groupOperatorsByCountry(products: Product[]): Map<string, Product[]> {
  const knownCodes = new Set(MOBILE_COUNTRIES.map((c) => c.code));
  const groups = new Map<string, Product[]>();

  for (const p of products) {
    if (p.productType !== "MOBILE_RECHARGE") continue;
    if (!p.isActive) continue;
    if (!p.countryCode || !knownCodes.has(p.countryCode)) continue;

    const list = groups.get(p.countryCode) ?? [];
    list.push(p);
    groups.set(p.countryCode, list);
  }

  for (const list of groups.values()) {
    list.sort((a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0));
  }
  return groups;
}

/** Cheapest price among active+in-stock types; null when nothing sellable. */
export function minActivePrice(p: Product): number | null {
  const sellable = (p.types ?? []).filter((t) => t.isActive && t.hasStock);
  if (!sellable.length) return null;
  return Math.min(...sellable.map((t) => t.displayPrice));
}

/** Keep digits only; strip a duplicated calling code prefix ("6684..." -> "084..." stays long). */
export function normalizePhone(raw: string, callingCode: string): string {
  let digits = (raw ?? "").replace(/\D+/g, "");
  if (callingCode && digits.startsWith(callingCode) && digits.length > callingCode.length + 8) {
    digits = digits.slice(callingCode.length);
  }
  return digits;
}

/** Gate for unlocking step 4 and PAY NOW (spec §5.3): 8–12 digits. */
export function isPhoneValid(phone: string): boolean {
  return /^\d{8,12}$/.test(phone);
}

/** Backend contract: fulfillment reads phone / "User ID" / calling_code (no "+"). */
export function buildPlayerInfo(phone: string, callingCode: string): Record<string, string> {
  return {
    phone,
    "User ID": phone,
    calling_code: callingCode,
  };
}
