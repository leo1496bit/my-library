import { BookText, LogIn, Plus } from "lucide-react";
import { StatusBadge } from "@/components/books/status-badge";
import { RatingStars } from "@/components/books/rating-stars";
import type { SharedBook } from "@/lib/types";

export function PublicBookCard({
  book,
  canSuggest,
  onSuggest,
}: {
  book: SharedBook;
  canSuggest: boolean;
  onSuggest: (book: SharedBook) => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border py-3 first:pt-0 last:border-b-0">
      <span className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-muted">
        {book.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.cover_url} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <BookText className="size-6 text-muted-foreground" strokeWidth={1.5} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-heading text-base leading-snug text-foreground">
          {book.title}
        </h3>
        <p className="truncate text-sm text-muted-foreground">
          {book.author ?? "Auteur inconnu"}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <StatusBadge status={book.status} />
        </div>
        {book.rating && (
          <div className="mt-1.5">
            <RatingStars value={book.rating} />
          </div>
        )}
        {book.tags && book.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {book.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-[11px] text-accent-foreground dark:text-accent"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onSuggest(book)}
        aria-label={canSuggest ? `Suggérer ${book.title}` : `Se connecter pour suggérer ${book.title}`}
        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-accent/40 text-accent hover:bg-accent/10"
      >
        {canSuggest ? <Plus className="size-4" /> : <LogIn className="size-4" />}
      </button>
    </div>
  );
}
