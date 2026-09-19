import Link from "next/link";
import { BookText } from "lucide-react";
import { StatusBadge } from "@/components/books/status-badge";
import { LoanBadge } from "@/components/books/loan-badge";
import { RatingStars } from "@/components/books/rating-stars";
import type { BookWithRelations } from "@/lib/types";

export function BookCard({ book }: { book: BookWithRelations }) {
  return (
    <Link
      href={`/books/${book.id}`}
      className="flex items-center gap-3 border-b border-border py-3 first:pt-0 last:border-b-0"
    >
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
          {book.active_loan && <LoanBadge />}
        </div>
        {book.rating && (
          <div className="mt-1.5">
            <RatingStars value={book.rating} />
          </div>
        )}
      </div>
    </Link>
  );
}
