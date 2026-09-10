import Image from "next/image";
import { MessagesSquare, ShieldCheck, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

/** ตัวคั่น "หรือด้วยอีเมล" — ใช้ร่วมกันทั้ง login/register */
export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground/70">
      <span className="h-px flex-1 bg-border/60" />
      {label}
      <span className="h-px flex-1 bg-border/60" />
    </div>
  );
}

/** โครงหน้า auth แบบแยกครึ่งจอ (mockup B):
 *  เดสก์ท็อป = แผงแบรนด์ซ้าย + ฟอร์มขวา · มือถือ = แผงยุบเป็นส่วนหัวบาง */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("auth");
  const tf = useTranslations("footer");

  const trustItems = [
    { icon: Zap, label: tf("trustAuto") },
    { icon: ShieldCheck, label: t("trustSafe") },
    { icon: MessagesSquare, label: t("trustSupport") },
  ];

  return (
    <div className="grid min-h-[calc(100vh-6.5rem)] lg:grid-cols-2">
      {/* แผงแบรนด์ — มือถือ: ส่วนหัวบาง / เดสก์ท็อป: เต็มความสูง */}
      <div
        className="relative overflow-hidden px-6 py-8 lg:flex lg:flex-col lg:justify-center lg:px-12 lg:py-12"
        style={{ background: "linear-gradient(160deg, #3a1c0a, #1d1206 70%)" }}
      >
        <span
          aria-hidden
          className="absolute -top-24 -left-24 size-[420px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--primary) 22%, transparent), transparent 70%)",
          }}
        />
        <div className="relative">
          <Image
            src="/brand/logo-mark.png"
            alt=""
            width={1105}
            height={910}
            className="mb-5 h-11 w-auto lg:h-14"
            priority
          />
          <h2 className="text-xl font-extrabold leading-snug lg:text-2xl">
            {t("shellTitle1")}
            <br />
            <span className="text-primary">{t("shellTitle2")}</span>
          </h2>
          <p className="mt-2.5 max-w-[34ch] text-[13px] text-muted-foreground lg:mt-3">
            {t("shellTag")}
          </p>
          <ul className="mt-6 hidden flex-col gap-3 lg:flex">
            {trustItems.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-[13px] font-semibold text-muted-foreground">
                <Icon className="size-[15px] text-primary" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* คอลัมน์ฟอร์ม */}
      <div className="flex items-start justify-center px-4 py-10 sm:items-center sm:px-8">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
