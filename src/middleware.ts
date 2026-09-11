import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // `assets` คือ image proxy route (/assets/:fileId → storage) — ห้ามให้ i18n
  // โยน locale prefix ทับ ไม่งั้น rewrite ใน next.config ไม่ match
  matcher: ["/((?!api|assets|_next|_vercel|.*\\..*).*)"],
};
