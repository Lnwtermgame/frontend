import type { Coupon } from "@/lib/services";
import { Badge } from "./Badge";

export function CouponCard({
  coupon,
  onClaim,
  claiming,
  claimed,
  claimLabel,
  claimedLabel,
}: {
  coupon: Coupon;
  onClaim: (id: string) => void;
  claiming: boolean;
  claimed: boolean;
  claimLabel: string;
  claimedLabel: string;
}) {
  return (
    <div className="site-card p-3 flex flex-col">
      <div>
        <span className="text-site-accent text-xl font-black">
          {coupon.discountPercentage}%
        </span>
        <span className="text-[10px] text-site-accent font-bold ml-0.5">OFF</span>
      </div>
      <p className="text-[11px] text-site-muted line-clamp-2 mt-1 min-h-[26px]">
        {coupon.description || coupon.code}
      </p>
      <div className="mt-auto pt-2">
        {claimed ? (
          <Badge variant="success" className="w-full justify-center py-1.5">
            {claimedLabel}
          </Badge>
        ) : (
          <button
            onClick={() => onClaim(coupon.id)}
            disabled={claiming}
            aria-busy={claiming}
            aria-label={claimLabel}
            className="w-full border border-site-border-soft rounded-6 py-1.5 text-[11px] font-bold text-site-text hover:border-site-border transition-colors disabled:opacity-50"
          >
            {claiming ? "..." : claimLabel}
          </button>
        )}
      </div>
    </div>
  );
}
