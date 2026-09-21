"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, SearchIcon, Users } from "lucide-react";
import { fetchBooksWithRelations } from "@/lib/data/books";
import { groupBooksByAuthor } from "@/lib/data/authors";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthorsList() {
  const [authors, setAuthors] = useState<ReturnType<typeof groupBooksByAuthor> | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchBooksWithRelations().then((books) => {
      if (!cancelled) setAuthors(groupBooksByAuthor(books));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!authors) return null;
    const q = query.trim().toLowerCase();
    if (!q) return authors;
    return authors.filter((a) => a.name.toLowerCase().includes(q));
  }, [authors, query]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <div>
        <h1 className="font-heading text-2xl text-foreground">Auteurs</h1>
        <p className="text-sm text-muted-foreground">
          {authors ? `${authors.length} auteur${authors.length > 1 ? "s" : ""}` : "Chargement…"}
        </p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un auteur…"
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
          <Users className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <p className="max-w-[28ch] text-sm text-muted-foreground">
            {authors?.length
              ? "Aucun auteur ne correspond à cette recherche."
              : "Aucun auteur pour l'instant — ajoutez des livres à votre bibliothèque."}
          </p>
        </div>
      )}

      {filtered && filtered.length > 0 && (
        <div className="flex flex-col">
          {filtered.map((author) => (
            <Link
              key={author.name}
              href={`/authors/${encodeURIComponent(author.name)}`}
              className="flex items-center gap-3 border-b border-border py-3 first:pt-0 last:border-b-0"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-base text-primary">
                {author.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-heading text-base leading-snug text-foreground">
                  {author.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {author.books.length} livre{author.books.length > 1 ? "s" : ""}
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
