import type { LucideIcon } from "lucide-react";

export interface TrustItem {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export function TrustStrip({ items }: { items: TrustItem[] }) {
  return (
    <div className="site-card flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-site-border-soft">
      {items.map((item) => (
        <div key={item.title} className="flex-1 flex items-center justify-center gap-2.5 py-3.5 px-2 text-center">
          <item.icon size={16} className="text-site-muted shrink-0" />
          <div>
            <p className="text-[12px] font-bold text-site-text leading-tight">{item.title}</p>
            <p className="text-[11px] text-site-dim leading-tight hidden sm:block">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
