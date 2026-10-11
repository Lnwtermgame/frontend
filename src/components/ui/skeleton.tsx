import { cn } from "cn"

/**
 * Skeleton — ชิ้นจองพื้นที่ระหว่างรอข้อมูล (shimmer + fade-in หน่วง 120ms ดู globals.css)
 * aria-hidden เป็นค่าเริ่มต้น: ประกาศสถานะ "กำลังโหลด" ให้ screen reader ครั้งเดียวที่
 * <SkeletonRegion> แทนให้อ่านทีละชิ้น — override สีพื้นได้ด้วย bg-* (cn merge แทน bg-skeleton)
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("skeleton rounded-md bg-skeleton", className)}
      {...props}
    />
  )
}

export { Skeleton }
