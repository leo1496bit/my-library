import { cn } from "@/lib/utils";

// Le badge "Prêté" reprend le motif du tampon de bibliothèque — seul badge
// du système à porter cette légère inclinaison, pour rester un accent
// ponctuel plutôt qu'un effet généralisé.
export function LoanBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "stamp-tilt inline-flex items-center rounded-sm border-2 border-loan px-2 py-0.5 text-[11px] font-semibold tracking-tight text-loan",
        className,
      )}
    >
      Prêté
    </span>
  );
}
