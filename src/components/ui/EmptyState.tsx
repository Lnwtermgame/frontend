import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  message,
}: {
  icon: LucideIcon;
  message: string;
}) {
  return (
    <div className="col-span-full flex flex-col items-center py-12 text-site-dim">
      <Icon size={32} className="mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
