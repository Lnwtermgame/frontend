import { Link } from "@/i18n/routing";
import { Badge } from "./Badge";
import { useTranslations } from "next-intl";

export interface Deal {
  id: string;
  slug: string;
  name: string;
  typeName: string;
  discount: number;
  img: string;
}

export function OfferCard({ deal, href }: { deal: Deal; href: string }) {
  const t = useTranslations();
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
          <p className="text-[13px] font-bold text-site-text line-clamp-1" title={deal.typeName}>
            {deal.typeName}
          </p>
          <p className="text-[11px] text-site-dim line-clamp-1" title={deal.name}>
            {deal.name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant="success">{t("promotion_badge")}</Badge>
          <span className="text-status-success text-[13px] font-black">-{deal.discount}%</span>
        </div>
      </div>
    </Link>
  );
}
