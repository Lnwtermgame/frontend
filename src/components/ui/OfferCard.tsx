import { Link } from "@/i18n/routing";
import { Badge } from "./Badge";

export interface Deal {
  id: string;
  slug: string;
  name: string;
  typeName: string;
  discount: number;
  img: string;
}

export function OfferCard({ deal, href, badgeLabel }: { deal: Deal; href: string; badgeLabel: string }) {
  return (
    <Link href={href} className="site-card p-3 hover:border-site-border transition-colors block">
      <div className="flex items-center gap-3">
        <img
          src={deal.img}
          alt={deal.name}
          className="w-10 h-10 rounded-6 object-cover bg-site-raised shrink-0"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-site-text line-clamp-1" title={deal.typeName}>
            {deal.typeName}
          </p>
          <p className="text-[11px] text-site-dim line-clamp-1" title={deal.name}>
            {deal.name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant="danger">{badgeLabel}</Badge>
          <span className="text-status-danger text-[13px] font-bold tabular-nums">-{deal.discount}%</span>
        </div>
      </div>
    </Link>
  );
}
