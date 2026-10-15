"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, LibraryBig, Plus, SearchIcon, TagIcon } from "lucide-react";
import { createBook, fetchBooksWithRelations } from "@/lib/data/books";
import { useAddBookSheet } from "@/components/add/add-book-context";
import { BookCard } from "@/components/books/book-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BOOK_STATUSES, STATUS_LABELS, type BookWithRelations, type Tag } from "@/lib/types";

const FILTERS = [
  { value: "all", label: "Tous" },
  ...BOOK_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
] as const;

export function BookList() {
  const { addedTick, openSheet, notifyAdded } = useAddBookSheet();
  const [books, setBooks] = useState<BookWithRelations[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");
  const [query, setQuery] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [wishTitle, setWishTitle] = useState("");
  const [addingWish, startAddingWish] = useTransition();

  useEffect(() => {
    let cancelled = false;
    fetchBooksWithRelations().then((data) => {
      if (!cancelled) setBooks(data);
    });
    return () => {
      cancelled = true;
    };
  }, [addedTick]);

  const availableTags = useMemo(() => {
    if (!books) return [];
    const byId = new Map<string, Tag>();
    for (const book of books) {
      for (const tag of book.tags ?? []) byId.set(tag.id, tag);
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [books]);

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }

  // Ajout ultra-léger d'une "envie" : juste un titre, statut `to_buy`, sans
  // passer par le sheet Quick Add (recherche Google Books, confirmation de
  // statut...). Ne ferme/ouvre rien et ne redirige pas, pour pouvoir
  // enchaîner plusieurs titres d'affilée.
  function handleAddWish(e: React.FormEvent) {
    e.preventDefault();
    const title = wishTitle.trim();
    if (!title) return;
    startAddingWish(async () => {
      try {
        const book = await createBook({ title, status: "to_buy" });
        toast.success(`« ${book.title} » ajouté à vos envies.`);
        setWishTitle("");
        notifyAdded();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Impossible d'ajouter cette envie.");
      }
    });
  }

  const filtered = useMemo(() => {
    if (!books) return null;
    const q = query.trim().toLowerCase();
    return books.filter((b) => {
      if (filter !== "all" && b.status !== filter) return false;
      if (selectedTagIds.size > 0) {
        const bookTagIds = new Set((b.tags ?? []).map((t) => t.id));
        const matchesAnySelected = [...selectedTagIds].some((id) => bookTagIds.has(id));
        if (!matchesAnySelected) return false;
      }
      if (!q) return true;
      return b.title.toLowerCase().includes(q) || (b.author ?? "").toLowerCase().includes(q);
    });
  }, [books, filter, query, selectedTagIds]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {books ? `${books.length} livre${books.length > 1 ? "s" : ""}` : "Chargement…"}
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un titre, un auteur…"
            className="pl-9"
          />
        </div>

        <form onSubmit={handleAddWish} className="flex gap-2 sm:flex-1">
          <Input
            value={wishTitle}
            onChange={(e) => setWishTitle(e.target.value)}
            placeholder="Ajouter une envie : titre du livre…"
            aria-label="Ajouter une envie par titre"
            className="flex-1"
          />
          <Button
            type="submit"
            variant="outline"
            disabled={addingWish || !wishTitle.trim()}
            aria-label="Ajouter une envie"
          >
            {addingWish ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Envie
          </Button>
        </form>
      </div>

      <div className="relative">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                filter === f.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-r from-transparent to-background"
        />
      </div>

      {availableTags.length > 0 && (
        <div className="relative">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            <TagIcon className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
            {availableTags.map((tag) => {
              const active = selectedTagIds.has(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-xs outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                    active
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-r from-transparent to-background"
          />
        </div>
      )}

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
