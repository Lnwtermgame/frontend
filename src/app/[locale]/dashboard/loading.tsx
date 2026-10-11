import { DashboardContentSkeleton } from "@/components/skeletons";

// อยู่ใต้ dashboard/layout → sidebar จริงค้างไว้ เปลี่ยนเมนูแล้วเฉพาะฝั่งเนื้อหาเป็น skeleton
export default function Loading() {
  return <DashboardContentSkeleton />;
}
