import { redirect } from "next/navigation";

/**
 * หน้าสินค้า mobile-recharge เดิม — ย้ายเข้า wizard แล้ว (spec §5.8)
 * ทุก slug เก่า redirect เข้า /mobile-recharge?operator=<slug>
 * wizard จะเติมประเทศ+ผู้ให้บริการให้อัตโนมัติ ถ้า slug ไม่ตรงก็เริ่มว่าง ๆ
 *
 * หมายเหตุ: แอปเป็น single-locale (th default, ไม่มี prefix) — redirect ไม่ใส่ /th
 */
export default async function MobileProductRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/mobile-recharge?operator=${encodeURIComponent(slug)}`);
}
