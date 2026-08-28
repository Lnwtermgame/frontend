import { Link } from "@/i18n/routing";
import { Zap } from "lucide-react";
import { Badge } from "./Badge";
import { useTranslations } from "next-intl";

export function GameTile({
  slug,
  name,
  image,
  instant,
  href,
}: {
  slug: string;
  name: string;
  image: string;
  instant?: boolean;
  href?: string;
}) {
  const t = useTranslations();
  return (
    <Link href={href || `/games/${slug}`} className="block group">
      <div className="w-full aspect-square rounded-8 overflow-hidden bg-site-raised border border-site-border-soft">
        <img src={image} alt={name} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <h3
        className="mt-2 text-[13px] text-center text-site-text font-bold leading-snug line-clamp-2 group-hover:text-site-accent transition-colors"
        title={name}
      >
        {name}
      </h3>
      <div className="mt-1.5 flex justify-center">
        {instant ? (
          <Badge variant="success">
            <Zap size={10} /> {t("status_instant")}
          </Badge>
        ) : (
          <Badge variant="neutral">{t("status_30_60_mins")}</Badge>
        )}
      </div>
    </Link>
  );
}
