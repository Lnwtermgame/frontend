// โลแคลที่รองรับ — ประกาศซ้ำจาก i18n/routing.ts (ไฟล์นั้นไม่ได้ export ลิสต์โลแคล)
// เมื่อเพิ่ม "en" ใน routing.ts ให้เติมที่นี่ด้วย แล้วการถอด prefix จะยังทำงานถูกต้อง
const SUPPORTED_LOCALES = ["th"] as const;
// ถอด prefix โลแคลนำหน้า (/th/... → /...) เพราะ i18n router จะใส่กลับให้เอง
const LOCALE_PREFIX_RE = new RegExp(`^/(?:${SUPPORTED_LOCALES.join("|")})(?=/|$)`);

/**
 * แปลงค่า ?redirect= ให้เป็น path ภายในที่ปลอดภัยสำหรับ i18n router
 * - ต้องขึ้นต้นด้วย "/" และไม่ใช่ "//" (กัน open redirect ไปโดเมนอื่น)
 * - ถอด prefix โลแคลออก
 * - ไม่ส่งกลับไปหน้า /login หรือ /register (กันลูป)
 * คืนค่า "/" ถ้าไม่ผ่านเงื่อนไข
 */
export function resolveSafeRedirect(redirectPath: string | null | undefined): string {
  if (!redirectPath || !redirectPath.startsWith("/") || redirectPath.startsWith("//")) {
    return "/";
  }
  const target = redirectPath.replace(LOCALE_PREFIX_RE, "") || "/";
  if (/^\/(?:login|register)(?=[/?#]|$)/.test(target)) return "/";
  return target;
}
