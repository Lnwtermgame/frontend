import { useTranslations } from "next-intl";

export function HowItWorks() {
  const t = useTranslations("home");
  const steps = [
    { title: t("how1Title"), desc: t("how1Desc") },
    { title: t("how2Title"), desc: t("how2Desc") },
    { title: t("how3Title"), desc: t("how3Desc") },
  ];
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-10">
      <h2 className="mb-4 text-xl font-bold">{t("howTitle")}</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div key={i} className="rounded-[14px] border bg-card p-4">
            <span className="mb-2 inline-flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {i + 1}
            </span>
            <p className="text-sm font-semibold">{s.title}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
