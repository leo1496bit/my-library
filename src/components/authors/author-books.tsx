"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, UserRound } from "lucide-react";
import { fetchBooksWithRelations } from "@/lib/data/books";
import { booksByAuthor } from "@/lib/data/authors";
import { BookCard } from "@/components/books/book-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { BookWithRelations } from "@/lib/types";

export function AuthorBooks({ name }: { name: string }) {
  const router = useRouter();
  const [books, setBooks] = useState<BookWithRelations[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchBooksWithRelations().then((all) => {
      if (!cancelled) setBooks(booksByAuthor(all, name));
    });
    return () => {
      cancelled = true;
    };
  }, [name]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Retour
      </button>

      <div>
        <h1 className="font-heading text-2xl text-foreground">{name}</h1>
        <p className="text-sm text-muted-foreground">
          {books ? `${books.length} livre${books.length > 1 ? "s" : ""}` : "Chargement…"}
        </p>
      </div>

      {!books && (
        <div className="flex flex-col">
          {[0, 1].map((i) => (
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

      {books && books.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <UserRound className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <p className="max-w-[28ch] text-sm text-muted-foreground">
            Aucun livre de cet auteur dans votre bibliothèque.
          </p>
        </div>
      )}

      {books && books.length > 0 && (
        <div className="flex flex-col">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
