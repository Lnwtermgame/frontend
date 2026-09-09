import { Zap, ShieldCheck, Headphones, RefreshCw } from "lucide-react";

const TRUST_ITEMS = [
  {
    icon: Zap,
    title: "จัดส่งอัตโนมัติ 24 ชม.",
    desc: "รับสินค้าทันทีหลังชำระเงินสำเร็จ ไม่ต้องรอแอดมิน",
  },
  {
    icon: ShieldCheck,
    title: "ปลอดภัย ไร้ความกังวล",
    desc: "มาตรฐานความปลอดภัยระดับสูง ข้อมูลได้รับการปกป้อง",
  },
  {
    icon: Headphones,
    title: "บริการด้วยใจตลอด 24 ชม.",
    desc: "มีเจ้าหน้าที่คอยให้คำแนะนำและช่วยเหลือทุกวัน",
  },
  {
    icon: RefreshCw,
    title: "การันตีได้รับสินค้าจริง",
    desc: "ระบบเชื่อมต่อตรง มั่นใจได้ทุกยอดการเติมเงิน",
  },
];

export function TrustStrip() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_ITEMS.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3.5 rounded-[14px] border bg-card p-4 shadow-(--shadow-tile)"
          >
            <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
              <item.icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight text-foreground">{item.title}</p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
