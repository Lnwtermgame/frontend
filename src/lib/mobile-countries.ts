/**
 * Static country metadata for the mobile recharge wizard.
 *
 * Frontend-only by design (spec §5.7): country names/calling codes are stable
 * public data. Only countries with real MOBILE_RECHARGE inventory belong here —
 * extend as operators are onboarded. Products whose countryCode is missing from
 * this map are hidden from the wizard (defense in depth with the backfill).
 *
 * Flags render from the nucleo-flags SVG set (keyed by `code`), not from emoji —
 * emoji flags do not render on Windows, where regional-indicator pairs fall back
 * to letter boxes.
 */
export interface CountryMeta {
  /** ISO 3166-1 alpha-2, uppercase — matches Product.countryCode */
  code: string;
  nameTh: string;
  nameEn: string;
  /** Digits only, no leading "+" (e.g. "66") */
  callingCode: string;
}

export const MOBILE_COUNTRIES: CountryMeta[] = [
  { code: "TH", nameTh: "ไทย", nameEn: "Thailand", callingCode: "66" },
  { code: "MY", nameTh: "มาเลเซีย", nameEn: "Malaysia", callingCode: "60" },
  { code: "SG", nameTh: "สิงคโปร์", nameEn: "Singapore", callingCode: "65" },
  { code: "ID", nameTh: "อินโดนีเซีย", nameEn: "Indonesia", callingCode: "62" },
  { code: "VN", nameTh: "เวียดนาม", nameEn: "Vietnam", callingCode: "84" },
  { code: "PH", nameTh: "ฟิลิปปินส์", nameEn: "Philippines", callingCode: "63" },
];

export function countryByCode(code: string | null | undefined): CountryMeta | undefined {
  if (!code) return undefined;
  return MOBILE_COUNTRIES.find((c) => c.code === code.toUpperCase());
}
