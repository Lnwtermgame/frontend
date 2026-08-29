import type { LucideIcon } from "lucide-react";

export interface TrustItem {
  icon: LucideIcon;
  title: string;
  desc: string;
  tone?: "shield" | "zap" | "award" | "headphones";
}

const circleColor: Record<string, string> = {
  shield: "bg-blue-700",
  zap: "bg-green-600",
  award: "bg-amber-500",
  headphones: "bg-site-deep",
};

export function TrustStrip({ items }: { items: TrustItem[] }) {
  return (
    <div className="site-card flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-site-border-soft">
      {items.map((item) => (
        <div key={item.title} className="flex-1 flex items-center justify-center gap-2.5 py-3.5 px-2 text-center">
          <div
            className={`w-9 h-9 rounded-full ${
              circleColor[item.tone ?? ""] ?? "bg-site-deep"
            } text-white flex items-center justify-center shrink-0`}
          >
            <item.icon size={18} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[12px] font-bold text-site-text leading-tight">{item.title}</p>
            <p className="text-[11px] text-site-dim leading-tight hidden sm:block">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
