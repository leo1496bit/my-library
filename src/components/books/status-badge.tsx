import { cn } from "@/lib/utils";
import { STATUS_LABELS, type BookStatus } from "@/lib/types";
import { STATUS_BADGE_CLASSES } from "@/lib/status-styles";

export function StatusBadge({ status, className }: { status: BookStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_BADGE_CLASSES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
