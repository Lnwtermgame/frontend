/** locale-aware date/time formatting — locale เป็น optional โดย default "th"
 *  (Buddhist era) ฝั่ง en ส่ง useLocale()/getLocale() เข้ามาเพื่อได้ Gregorian */
function intlLocale(locale: string): string {
  return locale === "en" ? "en-US" : "th-TH";
}

export function formatDateTime(iso: string, locale: string = "th"): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatTime(iso: string, locale: string = "th"): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeStyle: "short",
  }).format(new Date(iso));
}
