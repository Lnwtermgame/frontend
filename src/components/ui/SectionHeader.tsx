import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";

export function SectionHeader({
  title,
  actionHref,
  actionLabel,
  level = 2,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
  level?: 1 | 2;
}) {
  const Title = level === 1 ? "h1" : "h2";
  return (
    <div className="flex items-end justify-between mb-4">
      <Title
        className={
          level === 1
            ? "text-xl md:text-2xl font-extrabold text-site-text leading-tight"
            : "text-base md:text-lg font-bold text-site-text leading-tight"
        }
      >
        {title}
      </Title>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="text-[12px] text-site-accent hover:text-site-accent-hover transition-colors flex items-center gap-0.5 font-semibold"
        >
          {actionLabel} <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}
