"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  value,
  onChange,
  size = "sm",
}: {
  value: number | null;
  onChange?: (value: number | null) => void;
  size?: "sm" | "md";
}) {
  const iconSize = size === "sm" ? "size-3.5" : "size-5";
  const interactive = Boolean(onChange);

  return (
    <div
      className="flex items-center gap-0.5"
      role={interactive ? "radiogroup" : undefined}
      aria-label="Note"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (value ?? 0) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            aria-checked={filled}
            role={interactive ? "radio" : undefined}
            onClick={() => {
              if (!onChange) return;
              onChange(value === star ? null : star);
            }}
            className={cn(
              "text-muted-foreground/40",
              interactive && "cursor-pointer hover:text-accent",
              filled && "text-accent",
            )}
          >
            <Star className={iconSize} strokeWidth={1.5} fill={filled ? "currentColor" : "none"} />
          </button>
        );
      })}
    </div>
  );
}
