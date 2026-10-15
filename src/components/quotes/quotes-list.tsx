"use client";

// Vue de parcours "Citations" : toutes les citations de l'utilisateur,
// toutes bibliothèques confondues, les plus récentes d'abord — pour
// retrouver une citation sans se souvenir de quel livre elle vient. Modelé
// sur src/components/loans/loan-list.tsx (même structure : fetch unique au
// montage, livre d'origine lié via Link, pas de pagination).
//
// Point d'entrée choisi : une entrée du menu compte (à côté d'Importer/
// Exporter/Idées) plutôt qu'un 4ᵉ onglet sur /library — Livres/Auteurs/
// Séries sont trois façons de parcourir la même collection de livres,
// alors que les Citations sont un contenu d'une autre nature (des extraits
// de texte, pas des livres), et un 4ᵉ onglet aurait commencé à être serré
// sur la largeur d'un écran de téléphone.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Quote as QuoteIcon } from "lucide-react";
import { fetchAllQuotes, type QuoteWithBook } from "@/lib/data/quotes";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";

export function QuotesList() {
  const [quotes, setQuotes] = useState<QuoteWithBook[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAllQuotes().then((data) => {
      if (!cancelled) setQuotes(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-6">
      <div>
        <h1 className="font-heading text-2xl text-foreground">Citations</h1>
        <p className="text-sm text-muted-foreground">
          {quotes ? `${quotes.length} citation${quotes.length > 1 ? "s" : ""}` : "Chargement…"}
        </p>
      </div>

      {!quotes && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {quotes && quotes.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <QuoteIcon className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <p className="max-w-[30ch] text-sm text-muted-foreground">
            Aucune citation pour l&apos;instant — ajoutez-en depuis la fiche d&apos;un livre.
          </p>
        </div>
      )}

      {quotes && quotes.length > 0 && (
        <div className="flex flex-col gap-3">
          {quotes.map((quote) => (
            <div key={quote.id} className="rounded-lg border border-border bg-card px-3 py-2.5">
              <p className="text-sm text-foreground italic">« {quote.quote_text} »</p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {quote.page_number != null && `p. ${quote.page_number} · `}
                {formatDate(quote.created_at)}
              </p>
              <Link
                href={quote.books ? `/books/${quote.books.id}` : "#"}
                className="mt-1 inline-block truncate text-sm font-medium text-primary hover:underline"
              >
                {quote.books?.title ?? "Livre supprimé"}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
