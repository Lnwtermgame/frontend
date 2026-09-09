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
      aria-label="โปรโมชั่น"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[280px] overflow-hidden rounded-[14px] md:h-[230px]">
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
            <span aria-hidden className="absolute -top-[30%] -right-[6%] h-[170%] w-[46%] rotate-[16deg]" style={{ background: s.b2 }} />
            <span aria-hidden className="absolute right-[22%] -bottom-[64%] h-[120%] w-[18%] rotate-[16deg]" style={{ background: s.b2 }} />
            <span aria-hidden className="absolute -bottom-[70%] -left-[4%] h-[110%] w-[30%] rotate-[16deg]" style={{ background: s.b3 }} />
            <div className="relative max-w-[640px] px-6 md:px-10">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[11.5px] font-bold tracking-wide text-white">
                {t("eyebrow")}
              </span>
              <h2 className="mt-3 text-[26px] leading-[1.16] font-extrabold tracking-tight text-white md:text-[31px]">
                {s.title} <span className="text-[#ffd9a3]">{s.hi}</span>
              </h2>
              <p className="mt-2 text-[13px] text-white/85 md:text-[13.5px]">{s.desc}</p>
              <Link
                href={s.href}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-[10px] bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                tabIndex={i === index ? 0 : -1}
              >
                {s.cta}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s.href}
            type="button"
            aria-label={`${i + 1} / ${slides.length}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={`h-[7px] rounded-full transition-all duration-300 ${
              i === index ? "w-5 bg-primary" : "w-[7px] bg-border hover:bg-muted-foreground/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
