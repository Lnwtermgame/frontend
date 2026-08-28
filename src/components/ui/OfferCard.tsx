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

export function OfferCard({ deal, href }: { deal: Deal; href: string }) {
  return (
    <Link href={href} className="site-card p-3 hover:border-site-border transition-colors block">
      <div className="flex items-center gap-3">
        <img
          src={deal.img}
          alt={deal.name}
          className="w-9 h-9 rounded-6 object-cover bg-site-raised"
          loading="lazy"
        />
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-site-text line-clamp-1" title={deal.typeName}>
            {deal.typeName}
          </p>
          <p className="text-[11px] text-site-muted line-clamp-1" title={deal.name}>
            {deal.name}
          </p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Badge variant="success">
          {deal.discount > 0 ? `-${deal.discount}%` : `${deal.discount}%`}
        </Badge>
      </div>
    </Link>
  );
}
