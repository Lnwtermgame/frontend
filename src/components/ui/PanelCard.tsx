import { SectionHeader } from "./SectionHeader";

export function PanelCard({
  title,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="site-card p-4">
      <SectionHeader title={title} actionHref={actionHref} actionLabel={actionLabel} />
      {children}
    </div>
  );
}
