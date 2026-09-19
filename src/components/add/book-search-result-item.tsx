"use client";

import { BookText } from "lucide-react";
import type { GoogleBookResult } from "@/lib/google-books";

export function BookSearchResultItem({
  result,
  onSelect,
}: {
  result: GoogleBookResult;
  onSelect: (result: GoogleBookResult) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(result)}
      className="flex w-full items-center gap-3 rounded-lg border border-transparent px-2 py-2 text-left transition-colors hover:border-border hover:bg-secondary/50 active:bg-secondary"
    >
      <span className="flex h-16 w-11 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-muted">
        {result.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.coverUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <BookText className="size-5 text-muted-foreground" strokeWidth={1.5} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {result.title}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {[result.author, result.publishedYear].filter(Boolean).join(" — ") || "Auteur inconnu"}
        </span>
      </span>
    </button>
  );
}
