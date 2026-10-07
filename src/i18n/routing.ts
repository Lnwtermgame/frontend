import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["th", "en"],
  defaultLocale: "th",
  // localeDetection ปิดไว้ตั้งใจ — ไซต์นี้เป็น Thai-first: ไม่ดันภาษาตาม
  // Accept-Language ของเบราว์เซอร์ ผู้ใช้สลับเองผ่านปุ่ม TH | EN ใน header
  localeDetection: false,
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
