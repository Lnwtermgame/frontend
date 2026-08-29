import { Link } from "@/i18n/routing";
import { ChevronRight } from "lucide-react";

export function ListRow({
  href,
  title,
  subtitle,
  icon,
  meta,
}: {
  href: string;
  title: string;
  subtitle?: string;
  icon?: string;
  meta?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 py-2.5 border-b border-site-border-soft last:border-b-0 hover:bg-site-raised/50 transition-colors rounded-4 px-1 -mx-1"
    >
      {icon && (
        <img src={icon} alt="" className="w-6 h-6 rounded-4 object-cover bg-site-raised" loading="lazy" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-site-muted font-medium line-clamp-1">{title}</p>
        {subtitle && <p className="text-[11px] text-site-dim line-clamp-1">{subtitle}</p>}
      </div>
      {meta && <span className="text-[11px] text-site-dim shrink-0">{meta}</span>}
      <ChevronRight size={14} className="text-site-dim shrink-0" />
    </Link>
  );
}
