"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, BookMarked, LibraryBig, LogIn, SearchIcon, TagIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PublicBookCard } from "@/components/public/public-book-card";
import { SuggestSheet } from "@/components/public/suggest-sheet";
import { BOOK_STATUSES, STATUS_LABELS, type SharedBook, type Tag } from "@/lib/types";

const FILTERS = [
  { value: "all", label: "Tous" },
  ...BOOK_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
] as const;

export function PublicLibrary({
  ownerId,
  displayName,
  slug,
}: {
  ownerId: string;
  displayName: string | null;
  slug: string;
}) {
  const [books, setBooks] = useState<SharedBook[] | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");
  const [query, setQuery] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [suggestBook, setSuggestBook] = useState<SharedBook | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const [{ data: userData }, { data: books }, { data: bookTags }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.rpc("get_shared_books", { owner_id: ownerId }),
        // Filtré par propriétaire (via la jointure) : sans ça, la policy
        // RLS "public" renverrait aussi les tags d'autres bibliothèques
        // partagées si plusieurs utilisateurs activent le partage.
        supabase.from("book_tags").select("book_id, tags!inner(*)").eq("tags.user_id", ownerId),
      ]);

      if (cancelled) return;

      const sortedBooks = [...(books ?? [])].sort((a, b) =>
        b.date_added.localeCompare(a.date_added),
      );

      const tagsByBook = new Map<string, Tag[]>();
      for (const row of (bookTags ?? []) as unknown as { book_id: string; tags: Tag }[]) {
        if (!row.tags) continue;
        const list = tagsByBook.get(row.book_id) ?? [];
        list.push(row.tags);
        tagsByBook.set(row.book_id, list);
      }

      setIsAuthenticated(Boolean(userData?.user));
      setBooks(sortedBooks.map((b) => ({ ...b, tags: tagsByBook.get(b.id) ?? [] })));
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

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

  const filtered = useMemo(() => {
    if (!books) return null;
    const q = query.trim().toLowerCase();
    return books.filter((b) => {
      if (filter !== "all" && b.status !== filter) return false;
      if (selectedTagIds.size > 0) {
        const bookTagIds = new Set((b.tags ?? []).map((t) => t.id));
        if (![...selectedTagIds].some((id) => bookTagIds.has(id))) return false;
      }
      if (!q) return true;
      return b.title.toLowerCase().includes(q) || (b.author ?? "").toLowerCase().includes(q);
    });
  }, [books, filter, query, selectedTagIds]);

  function handleSuggest(book: SharedBook) {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(`/u/${slug}`)}`);
      return;
    }
    setSuggestBook(book);
    setSheetOpen(true);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <BookMarked className="size-4" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-[11px] text-muted-foreground">Bibliothèque partagée</p>
              <h1 className="font-heading text-lg leading-snug text-foreground">
                {displayName || "Un lecteur sur Ma bibliothèque"}
              </h1>
            </div>
          </div>
          {isAuthenticated ? (
            <Link
              href="/library"
              className="shrink-0 text-xs text-muted-foreground underline underline-offset-4"
            >
              Ma bibliothèque
            </Link>
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(`/u/${slug}`)}`}
              className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground underline underline-offset-4"
            >
              <LogIn className="size-3" /> Se connecter
            </Link>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {books
              ? `${books.length} livre${books.length > 1 ? "s" : ""} · lecture seule`
              : "Chargement…"}
          </p>
          <Link
            href={`/u/${slug}/stats`}
            className="flex items-center gap-1 text-xs text-accent-foreground underline underline-offset-4 dark:text-accent"
          >
            <BarChart3 className="size-3" /> Statistiques
          </Link>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 py-4">
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

        {availableTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            <TagIcon className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
            {availableTags.map((tag) => {
              const active = selectedTagIds.has(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-xs transition-colors",
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
        )}

        {!filtered && (
          <div className="flex flex-col">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 border-b border-border py-3">
                <Skeleton className="h-20 w-14 rounded-sm" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3.5 w-1/3" />
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
                : "Cette bibliothèque est vide."}
            </p>
          </div>
        )}

        {filtered && filtered.length > 0 && (
          <div className="flex flex-col">
            {filtered.map((book) => (
              <PublicBookCard
                key={book.id}
                book={book}
                slug={slug}
                canSuggest={Boolean(isAuthenticated)}
                onSuggest={handleSuggest}
              />
            ))}
          </div>
        )}
      </div>

      <SuggestSheet book={suggestBook} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
