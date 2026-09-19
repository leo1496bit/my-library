"use client";

import { useEffect, useMemo, useState } from "react";
import { LibraryBig, SearchIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAddBookSheet } from "@/components/add/add-book-context";
import { BookCard } from "@/components/books/book-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BOOK_STATUSES, STATUS_LABELS, type BookWithRelations } from "@/lib/types";

const FILTERS = [{ value: "all", label: "Tous" }, ...BOOK_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))] as const;

export function BookList() {
  const { addedTick, openSheet } = useAddBookSheet();
  const [books, setBooks] = useState<BookWithRelations[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const [{ data: books }, { data: loans }] = await Promise.all([
        supabase.from("books").select("*").order("date_added", { ascending: false }),
        supabase.from("loans").select("*").is("returned_at", null),
      ]);

      if (cancelled) return;

      const loanByBook = new Map((loans ?? []).map((l) => [l.book_id, l]));
      setBooks(
        (books ?? []).map((b) => ({ ...b, active_loan: loanByBook.get(b.id) ?? null })),
      );
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [addedTick]);

  const filtered = useMemo(() => {
    if (!books) return null;
    const q = query.trim().toLowerCase();
    return books.filter((b) => {
      if (filter !== "all" && b.status !== filter) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) || (b.author ?? "").toLowerCase().includes(q)
      );
    });
  }, [books, filter, query]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <div>
        <h1 className="font-heading text-2xl text-foreground">Ma bibliothèque</h1>
        <p className="text-sm text-muted-foreground">
          {books ? `${books.length} livre${books.length > 1 ? "s" : ""}` : "Chargement…"}
        </p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un titre, un auteur…"
          className="pl-9"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
              filter === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!filtered && (
        <div className="flex flex-col">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 border-b border-border py-3">
              <Skeleton className="h-20 w-14 rounded-sm" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <LibraryBig className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <p className="max-w-[28ch] text-sm text-muted-foreground">
            {books?.length
              ? "Aucun livre ne correspond à ces filtres."
              : "Votre bibliothèque est vide. Ajoutez votre premier livre."}
          </p>
          {!books?.length && <Button onClick={openSheet}>Ajouter un livre</Button>}
        </div>
      )}

      {filtered && filtered.length > 0 && (
        <div className="flex flex-col">
          {filtered.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
