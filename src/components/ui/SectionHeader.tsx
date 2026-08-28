import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";

export function SectionHeader({
  title,
  sublabel,
  actionHref,
  actionLabel,
  level = 2,
}: {
  title: string;
  sublabel?: string;
  actionHref?: string;
  actionLabel?: string;
  level?: 1 | 2;
}) {
  const Title = level === 1 ? "h1" : "h2";
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <Title
          className={
            level === 1
              ? "text-xl md:text-2xl font-extrabold text-site-text leading-none mb-1"
              : "text-base md:text-lg font-extrabold text-site-text leading-none mb-1"
          }
        >
          {title}
        </Title>
        {sublabel && (
          <p className="text-[11px] text-site-dim uppercase font-bold tracking-widest leading-none">
            {sublabel}
          </p>
        )}
      </div>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="text-[12px] text-site-accent hover:text-site-accent-hover transition-colors flex items-center gap-0.5 font-semibold mb-0.5"
        >
          {actionLabel} <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}
