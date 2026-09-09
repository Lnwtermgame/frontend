"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  HelpCircle,
  MessageSquare,
  Headphones,
  FileText,
  Search,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SupportHubPage() {
  const t = useTranslations("support");
  const router = useRouter();
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    router.push(`/support/faq`);
  };

  const HUB_CARDS = [
    {
      title: "คำถามที่พบบ่อย (FAQ)",
      desc: "ค้นหาคำตอบด่วนเกี่ยวกับช่องทางชำระเงิน ขั้นตอนการเติม และปัญหาที่พบบ่อย",
      href: "/support/faq",
      icon: HelpCircle,
      badge: "45 บทความ",
    },
    {
      title: "แจ้งปัญหาคำสั่งซื้อ (Tickets)",
      desc: "ส่งคำร้องให้เจ้าหน้าที่ตรวจสอบโดยตรง พร้อมติดตามสถานะและสนทนาแบบ Real-time",
      href: "/support/tickets",
      icon: MessageSquare,
      badge: "ดูแลโดยตรง",
    },
    {
      title: "ติดต่อเรา (Contact)",
      desc: "ช่องทางการติดต่อทีมงานและรายละเอียดเวลาทำการ พร้อมช่วยเหลือตลอด 24 ชั่วโมง",
      href: "/support/contact",
      icon: Headphones,
      badge: "24 ชั่วโมง",
    },
    {
      title: "นโยบายการคืนเงิน",
      desc: "เงื่อนไขและข้อกำหนดในการขอรับเงินคืนสำหรับสินค้าดิจิทัล",
      href: "/refund",
      icon: FileText,
      badge: "ข้อกำหนด",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">ศูนย์บริการช่วยเหลือ Lnwtermgame</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          เราพร้อมช่วยเหลือและดูแลทุกปัญหาการสั่งซื้อของคุณตลอด 24 ชั่วโมง
        </p>

        <form onSubmit={handleSearch} className="relative mx-auto mt-6 max-w-lg">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="พิมพ์คำถามที่ต้องการค้นหา…"
            className="pl-9"
          />
        </form>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {HUB_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group flex flex-col justify-between rounded-[14px] border bg-card p-6 shadow-(--shadow-tile) transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-primary"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="inline-flex size-10 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                  <card.icon className="size-5" />
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  {card.badge}
                </span>
              </div>
              <h2 className="mt-4 text-base font-bold text-foreground group-hover:text-primary transition-colors">
                {card.title}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{card.desc}</p>
            </div>

            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-primary">
              <span>ไปยังหน้านี้</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
