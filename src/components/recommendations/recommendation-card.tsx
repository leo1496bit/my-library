"use client";

import { useState } from "react";
import { BookText, Check, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addBookAction } from "@/lib/actions/books";
import type { GoogleBookResult } from "@/lib/google-books";

export function RecommendationCard({
  recommendation,
}: {
  recommendation: GoogleBookResult & { reason: string };
}) {
  const [status, setStatus] = useState<"idle" | "pending" | "added">("idle");

  async function handleAdd() {
    setStatus("pending");
    const result = await addBookAction({
      title: recommendation.title,
      author: recommendation.author,
      genre: recommendation.genre,
      isbn: recommendation.isbn,
      cover_url: recommendation.coverUrl,
      publisher: recommendation.publisher,
      published_year: recommendation.publishedYear,
      language: recommendation.language,
      page_count: recommendation.pageCount,
      format: "physical",
      status: "to_read",
      google_books_id: recommendation.googleBooksId,
      location: null,
    });
    setStatus(result.book ? "added" : "idle");
  }

  return (
    <div className="flex w-40 shrink-0 flex-col gap-2">
      <span className="flex h-56 w-40 items-center justify-center overflow-hidden rounded-sm border border-border bg-muted">
        {recommendation.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recommendation.coverUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <BookText className="size-7 text-muted-foreground" strokeWidth={1.5} />
        )}
      </span>
      <div>
        <p className="line-clamp-2 text-sm font-medium text-foreground">{recommendation.title}</p>
        <p className="truncate text-xs text-muted-foreground">{recommendation.author}</p>
        <p className="mt-0.5 truncate text-[11px] text-accent">{recommendation.reason}</p>
      </div>
      <Button
        size="sm"
        variant={status === "added" ? "secondary" : "outline"}
        disabled={status !== "idle"}
        onClick={handleAdd}
        className="mt-auto"
      >
        {status === "pending" && <Loader2 className="size-3.5 animate-spin" />}
        {status === "added" ? (
          <>
            <Check className="size-3.5" /> Ajouté
          </>
        ) : (
          <>
            <Plus className="size-3.5" /> Ajouter
          </>
        )}
      </Button>
    </div>
  );
}
