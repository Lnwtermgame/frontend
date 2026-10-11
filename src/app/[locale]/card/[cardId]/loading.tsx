import { ProductPageSkeleton } from "@/components/skeletons";

// ระหว่างเปลี่ยน route (โหลด chunk / metadata) แสดงโครงหน้าสินค้าตัวเดียวกับที่ ProductPage ใช้ตอนรอ API
// → route loading กับ data loading ต่อกันเนียน ไม่กระพริบสลับโครง
export default function Loading() {
  return <ProductPageSkeleton />;
}
