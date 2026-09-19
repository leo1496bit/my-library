"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function DetailField({
  label,
  value,
  onCommit,
  type = "text",
  placeholder = "—",
}: {
  label: string;
  value: string;
  onCommit: (value: string) => void;
  type?: "text" | "number";
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);
  // Resynchronise le brouillon quand `value` change depuis l'extérieur
  // (autre champ enregistré, changement de livre) — ajustement pendant le
  // rendu plutôt qu'un effet, pour éviter un rendu en cascade évitable.
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraft(value);
  }

  return (
    <label className="flex items-center justify-between gap-3 border-b border-dashed border-border py-2.5 last:border-b-0">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <input
        type={type}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) onCommit(draft);
        }}
        className={cn(
          "min-w-0 flex-1 truncate bg-transparent text-right text-sm text-foreground outline-none",
          "placeholder:text-muted-foreground/60 focus:text-left",
        )}
      />
    </label>
  );
}
