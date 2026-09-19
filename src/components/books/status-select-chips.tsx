"use client";

import { cn } from "@/lib/utils";
import { BOOK_STATUSES, STATUS_LABELS, type BookStatus } from "@/lib/types";

export function StatusSelectChips({
  value,
  onChange,
}: {
  value: BookStatus;
  onChange: (value: BookStatus) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Statut">
      {BOOK_STATUSES.map((s) => {
        const active = s === value;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(s)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/40",
            )}
          >
            {STATUS_LABELS[s]}
          </button>
        );
      })}
    </div>
  );
}
