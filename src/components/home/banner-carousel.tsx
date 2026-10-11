"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";

type Slide = {
  b1: string;
  b2: string;
  b3: string;
  title: string;
  hi: string;
  desc: string;
  cta: string;
  href: string;
};

export function BannerCarousel() {
  const t = useTranslations("home.banner");
  const th = useTranslations("home");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const slides: Slide[] = [
    { b1: "#c23a17", b2: "#96260c", b3: "#e0602c", title: t("b1Title"), hi: t("b1Hi"), desc: t("b1Desc"), cta: t("b1Cta"), href: "/games" },
    { b1: "#0e3b1c", b2: "#0a2b15", b3: "#44d62c55", title: t("b2Title"), hi: t("b2Hi"), desc: t("b2Desc"), cta: t("b2Cta"), href: "/card" },
    { b1: "#3a1770", b2: "#2a1154", b3: "#8d5bd455", title: t("b3Title"), hi: t("b3Hi"), desc: t("b3Desc"), cta: t("b3Cta"), href: "/mobile-recharge" },
  ];

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((v) => (v + 1) % slides.length), 6000);
    return () => window.clearInterval(id);
  }, [paused, slides.length]);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={t("regionLabel")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        // เลิกพักเฉพาะเมื่อโฟกัสออกนอก carousel ทั้งหมด (ไม่ใช่แค่ย้ายระหว่างลิงก์/จุดข้างใน)
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
    >
      {/* h1 เดียวของหน้าแรก — sr-only เพราะสไลด์โชว์ชื่อโปรโมชั่นเป็น h2 อยู่แล้ว */}
      <h1 className="sr-only">{th("srHeading")}</h1>
      <div className="relative h-[280px] overflow-hidden rounded-2xl shadow-(--shadow-tile) md:h-[230px]">
        {slides.map((s, i) => (
          <div
            key={s.href}
            role="group"
            aria-roledescription="slide"
            aria-hidden={i !== index}
            className={`absolute inset-0 flex items-center transition-opacity duration-500 ${
              i === index ? "z-10 opacity-100" : "pointer-events-none opacity-0"
            }`}
            style={{ background: s.b1 }}
          >
            {/* นีออนซอฟต์มุมบนซ้าย — ให้พื้นสีเข้มมีมิติ ไม่ใช่แผ่นสีแบนราบ */}
            <span
              aria-hidden
              className="absolute -top-[60%] -left-[10%] h-[130%] w-[55%] rounded-full"
              style={{ background: `radial-gradient(closest-side, ${s.b3}, transparent)`, opacity: 0.35 }}
            />
            <span aria-hidden className="absolute -top-[30%] -right-[6%] h-[170%] w-[46%] rotate-[16deg]" style={{ background: s.b2 }} />
            <span aria-hidden className="absolute right-[22%] -bottom-[64%] h-[120%] w-[18%] rotate-[16deg]" style={{ background: s.b2 }} />
            <span aria-hidden className="absolute -bottom-[70%] -left-[4%] h-[110%] w-[30%] rotate-[16deg]" style={{ background: s.b3 }} />
            <div className="relative max-w-[640px] px-6 md:px-10">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-black/25 px-3 py-1 text-2xs font-bold tracking-wide text-white">
                {t("eyebrow")}
              </span>
              <h2 className="mt-3 text-2xl leading-snug font-bold tracking-tight text-white md:text-3xl">
                {s.title} <span className="text-[#ffd9a3]">{s.hi}</span>
              </h2>
              <p className="mt-2 text-sm text-white/85">{s.desc}</p>
              <Link
                href={s.href}
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-[8px] bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 md:h-10"
                tabIndex={i === index ? 0 : -1}
              >
                {s.cta}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
      {/* จุดสลับสไลด์ — container ยืดพื้นที่แตะเป็นแถวสูง 24px,
          ตัวจุดเอง 7px เล็กเกินกดบนมือถือ (WCAG 2.5.8 minimum 24px) */}
      <div className="mt-3 flex justify-center">
        {slides.map((s, i) => (
          <button
            key={s.href}
            type="button"
            aria-label={`${i + 1} / ${slides.length}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className="flex h-11 w-11 items-center justify-center"
          >
            <span
              className={`block h-[7px] rounded-full transition-all duration-300 ${
                i === index ? "w-5 bg-primary" : "w-[7px] bg-border"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
