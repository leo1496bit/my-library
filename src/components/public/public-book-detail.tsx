"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookText, ChevronLeft, LogIn, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/books/status-badge";
import { RatingStars } from "@/components/books/rating-stars";
import { SuggestSheet } from "@/components/public/suggest-sheet";
import { formatDate } from "@/lib/format";
import { FORMAT_LABELS, type SharedBook, type Tag } from "@/lib/types";

export function PublicBookDetail({
  bookId,
  ownerId,
  slug,
}: {
  bookId: string;
  ownerId: string;
  slug: string;
}) {
  const router = useRouter();
  const [book, setBook] = useState<SharedBook | null | "not-found">(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      // Réinitialisé à chaque changement de livre : le composant peut être
      // réutilisé entre deux navigations client-side (retour/avant), donc
      // sans ce reset l'ancien livre/tags resteraient affichés pendant le
      // chargement du nouveau, voire figés si le nouveau est introuvable.
      setBook(null);
      setTags([]);

      const [{ data: userData }, { data: rows }, { data: bookTags }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.rpc("get_shared_book", { p_book_id: bookId, p_owner_id: ownerId }),
        supabase.from("book_tags").select("tags(*)").eq("book_id", bookId),
      ]);

      if (cancelled) return;

      setIsAuthenticated(Boolean(userData?.user));

      const found = rows?.[0];
      if (!found) {
        setBook("not-found");
        setTags([]);
        return;
      }
      setBook(found as SharedBook);
      setTags(
        ((bookTags ?? []) as unknown as { tags: Tag }[]).map((row) => row.tags).filter(Boolean),
      );
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [bookId, ownerId]);

  if (book === null) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-4">
        <Skeleton className="h-8 w-24" />
        <div className="flex gap-3">
          <Skeleton className="h-40 w-28 rounded-sm" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (book === "not-found") {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 px-4 pt-16 text-center">
        <p className="text-sm text-muted-foreground">Ce livre est introuvable.</p>
        <Button variant="outline" onClick={() => router.push(`/u/${slug}`)}>
          Retour à la bibliothèque
        </Button>
      </div>
    );
  }

  function handleSuggestClick() {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(`/u/${slug}/books/${bookId}`)}`);
      return;
    }
    setSheetOpen(true);
  }

  const details: { label: string; value: string }[] = [
    { label: "Genre", value: book.genre ?? "—" },
    { label: "Éditeur", value: book.publisher ?? "—" },
    { label: "Année", value: book.published_year?.toString() ?? "—" },
    { label: "Pages", value: book.page_count?.toString() ?? "—" },
    { label: "ISBN", value: book.isbn ?? "—" },
    { label: "Langue", value: book.language?.toUpperCase() ?? "—" },
    { label: "Format", value: FORMAT_LABELS[book.format] },
  ];

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pt-4 pb-6">
      <button
        onClick={() => router.push(`/u/${slug}`)}
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Retour
      </button>

      <div className="flex gap-4">
        <span className="flex h-40 w-28 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-muted">
          {book.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.cover_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <BookText className="size-8 text-muted-foreground" strokeWidth={1.5} />
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h1 className="font-heading text-xl leading-snug text-foreground">{book.title}</h1>
          <p className="text-sm text-muted-foreground">{book.author ?? "Auteur inconnu"}</p>
          {book.rating && (
            <div className="mt-1">
              <RatingStars value={book.rating} size="md" />
            </div>
          )}
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-foreground">Statut</h2>
        <StatusBadge status={book.status} />
        {(book.date_started || book.date_finished) && (
          <p className="text-xs text-muted-foreground">
            {book.date_started && `Commencé le ${formatDate(book.date_started)}`}
            {book.date_started && book.date_finished && " · "}
            {book.date_finished && `Terminé le ${formatDate(book.date_finished)}`}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-foreground">Détails</h2>
        <div className="rounded-lg border border-border bg-card px-3">
          {details.map((d) => (
            <div
              key={d.label}
              className="flex items-center justify-between gap-3 border-b border-dashed border-border py-2.5 last:border-b-0"
            >
              <span className="text-sm text-muted-foreground">{d.label}</span>
              <span className="truncate text-sm text-foreground">{d.value}</span>
            </div>
          ))}
        </div>
      </section>

      {tags.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-foreground">Tags</h2>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-xs text-accent-foreground dark:text-accent"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </section>
      )}

      <Button onClick={handleSuggestClick} size="lg">
        {isAuthenticated ? <Plus className="size-4" /> : <LogIn className="size-4" />}
        {isAuthenticated ? "Suggérer ce livre" : "Se connecter pour le suggérer"}
      </Button>

      <SuggestSheet book={book} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
