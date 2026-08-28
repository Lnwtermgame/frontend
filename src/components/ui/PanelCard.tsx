import { SectionHeader } from "./SectionHeader";

export function PanelCard({
  title,
  sublabel,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  sublabel?: string;
  actionHref?: string;
  actionLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="site-card p-4">
      <SectionHeader title={title} sublabel={sublabel} actionHref={actionHref} actionLabel={actionLabel} />
      {children}
    </div>
  );
}
