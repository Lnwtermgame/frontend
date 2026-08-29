/**
 * Shared THB currency formatter (฿ with thousands separators).
 * THB is the only checkout currency today; localize here if that changes.
 */
export function formatTHB(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}
