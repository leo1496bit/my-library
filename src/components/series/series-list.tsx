"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Layers, SearchIcon } from "lucide-react";
import { fetchBooksWithRelations } from "@/lib/data/books";
import { groupBooksBySeries } from "@/lib/data/series";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export function SeriesList() {
  const [series, setSeries] = useState<ReturnType<typeof groupBooksBySeries> | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchBooksWithRelations().then((books) => {
      if (!cancelled) setSeries(groupBooksBySeries(books));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!series) return null;
    const q = query.trim().toLowerCase();
    if (!q) return series;
    return series.filter((s) => s.name.toLowerCase().includes(q));
  }, [series, query]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {series ? `${series.length} série${series.length > 1 ? "s" : ""}` : "Chargement…"}
      </p>

      <div className="relative">
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une série…"
          className="pl-9"
        />
      </div>

      {!filtered && (
        <div className="flex flex-col">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 border-b border-border py-3">
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3.5 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Layers className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <p className="max-w-[28ch] text-sm text-muted-foreground">
            {series?.length
              ? "Aucune série ne correspond à cette recherche."
              : "Aucune série pour l'instant — renseignez le champ Série sur la fiche d'un livre."}
          </p>
        </div>
      )}

      {filtered && filtered.length > 0 && (
        <div className="flex flex-col">
          {filtered.map((entry) => (
            <Link
              key={entry.name}
              href={`/series/${encodeURIComponent(entry.name)}`}
              className="flex items-center gap-3 border-b border-border py-3 first:pt-0 last:border-b-0"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-base text-primary">
                {entry.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-heading text-base leading-snug text-foreground">
                  {entry.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {entry.books.length} tome{entry.books.length > 1 ? "s" : ""}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
