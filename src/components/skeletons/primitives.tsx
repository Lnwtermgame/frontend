import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * บรรทัดข้อความจำลอง — กล่องนอกสูงเท่า line-box จริงของขนาดตัวอักษรนั้น
 * (Anuphan + line-height ที่ตั้งใน globals.css) แท่งข้างในเตี้ยกว่าเหมือน x-height
 * → ความสูงรวมของ skeleton เท่าของจริงพอดี เนื้อหาโผล่มาแล้วไม่ดันเลย์เอาต์
 */
const LINE_BOX = {
  "2xs": "h-[16.5px]", // 11px × 1.5
  xs: "h-[18px]", // 12px × 1.5
  sm: "h-[21px]", // 14px × 1.5
  base: "h-6", // 16px × 1.5
  lg: "h-7", // 18px · leading 1.75rem
  xl: "h-7", // 20px · leading 1.75rem
  "2xl": "h-[33px]", // 24px × 1.375
} as const;

const LINE_BAR = {
  "2xs": "h-2",
  xs: "h-2.5",
  sm: "h-3",
  base: "h-3.5",
  lg: "h-4",
  xl: "h-[18px]",
  "2xl": "h-5",
} as const;

export type LineSize = keyof typeof LINE_BOX;

export function TextLine({
  size = "sm",
  className,
  barClassName,
}: {
  size?: LineSize;
  /** ความกว้าง/ระยะของกล่องบรรทัด (เช่น w-3/4, mt-1) */
  className?: string;
  /** override แท่ง (เช่น สีพื้นบน band สีเกม) */
  barClassName?: string;
}) {
  return (
    <div className={cn("flex items-center", LINE_BOX[size], className)}>
      <Skeleton className={cn("w-full rounded-full", LINE_BAR[size], barClassName)} />
    </div>
  );
}

/** ชุดความกว้างที่ดูเป็นธรรมชาติ — ใช้ตาม index แทน Math.random (กัน hydration mismatch) */
export const NATURAL_WIDTHS = ["w-[82%]", "w-[64%]", "w-[90%]", "w-[72%]", "w-[56%]", "w-[78%]"] as const;

export function naturalWidth(i: number) {
  return NATURAL_WIDTHS[i % NATURAL_WIDTHS.length];
}

/** ย่อหน้าจำลองหลายบรรทัด — บรรทัดสุดท้ายสั้นเหมือนย่อหน้าจริง */
export function Paragraph({
  lines = 3,
  size = "sm",
  className,
}: {
  lines?: number;
  size?: LineSize;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <TextLine
          key={i}
          size={size}
          className={i === lines - 1 ? "w-[48%]" : i % 2 ? "w-[94%]" : "w-full"}
        />
      ))}
    </div>
  );
}
