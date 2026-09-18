"use client";

import { RegionFlagIcon } from "@/components/product/region-flag-icon";

/** ภูมิภาคขาย (enum) → ISO 3166-1 alpha-2 country code ของธง
 *  GLOBAL ไม่มีธง (ไม่ผูกประเทศ) — คืน null เพื่อไม่แสดง badge
 *  เพิ่มภูมิภาคใหม่ในอนาคต: map ค่า enum ไปยังโค้ดประเทศที่นี่ — ธงครบทุกประเทศอยู่ในชุด nucleo-flags แล้ว */
const REGION_TO_COUNTRY: Record<string, string> = {
  THAILAND: "th",
  MALAYSIA: "my",
};

interface RegionFlagProps {
  region: "GLOBAL" | "MALAYSIA" | "THAILAND";
  className?: string;
}

/** ธงภูมิภาคสำหรับ badge บนการ์ดสินค้า — แสดงเฉพาะภูมิภาคที่มีประเทศ (THAILAND, MALAYSIA) */
export function RegionFlag({ region, className }: RegionFlagProps) {
  const country = REGION_TO_COUNTRY[region];
  if (!country) return null;
  return <RegionFlagIcon code={country} className={className} />;
}
