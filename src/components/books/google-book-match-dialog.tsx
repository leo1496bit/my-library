"use client";

import { useEffect, useState } from "react";
import { SearchX } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookSearchResultItem } from "@/components/add/book-search-result-item";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { GoogleBookResult } from "@/lib/google-books";

// Dialogue de recherche Google Books réutilisable pour re-matcher un champ
// isolé (couverture, titre…) sur la fiche livre — même recherche que
// l'ajout rapide, mais sans les étapes de confirmation/statut : sélectionner
// un résultat renvoie directement à l'appelant via onSelect.
export function GoogleBookMatchDialog({
  open,
  onOpenChange,
  title,
  description,
  initialQuery,
  onSelect,
  customImage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  // Pré-remplit la recherche à l'ouverture (ex. le titre actuel du livre),
  // pour que la modification parte de là plutôt que d'une recherche vide.
  initialQuery?: string;
  onSelect: (result: GoogleBookResult) => void;
  // N'affiche le champ "coller une URL d'image" que pour le cas couverture —
  // absent, la modale ne propose que la recherche Google Books.
  customImage?: { onUse: (url: string) => void };
}) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const debouncedQuery = useDebouncedValue(query, 350);
  const trimmedQuery = debouncedQuery.trim();
  const [results, setResults] = useState<GoogleBookResult[] | null>(null);
  const [completedQuery, setCompletedQuery] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState("");
  const searching = trimmedQuery.length >= 2 && completedQuery !== trimmedQuery;

  // Réinitialise la recherche à chaque ouverture avec la requête de départ
  // fournie par l'appelant (plutôt qu'à la fermeture, pour que la valeur
  // affichée dépende toujours de CE que l'on est en train de modifier).
  // Ajusté pendant le rendu plutôt que dans un effet, comme dans
  // quick-add-sheet.tsx, pour éviter un rendu en cascade évitable.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setQuery(initialQuery ?? "");
  }

  useEffect(() => {
    if (!open || trimmedQuery.length < 2) return;

    const controller = new AbortController();
    fetch(`/api/books/search?q=${encodeURIComponent(trimmedQuery)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: { results: GoogleBookResult[] }) => setResults(data.results))
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setResults([]);
      })
      .finally(() => setCompletedQuery(trimmedQuery));

    return () => controller.abort();
  }, [trimmedQuery, open]);

  function handleSelect(result: GoogleBookResult) {
    onSelect(result);
    onOpenChange(false);
  }

  function handleUseCustomUrl() {
    const url = customUrl.trim();
    if (!url || !customImage) return;
    customImage.onUse(url);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setResults(null);
          setCompletedQuery(null);
          setCustomUrl("");
        }
      }}
    >
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Titre du livre…"
          aria-label="Rechercher sur Google Books"
        />
        {customImage && (
          <div className="flex flex-col gap-1.5 border-b border-border pb-3">
            <span className="text-xs text-muted-foreground">
              Ou coller l&apos;URL d&apos;une image
            </span>
            <div className="flex gap-2">
              <Input
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://…"
                aria-label="URL de l'image"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleUseCustomUrl}
                disabled={!customUrl.trim()}
              >
                Utiliser
              </Button>
            </div>
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {trimmedQuery.length < 2 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Tapez un titre pour rechercher sur Google Books.
            </p>
          )}
          {trimmedQuery.length >= 2 && searching && (
            <div className="flex flex-col gap-2 py-1">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-1">
                  <Skeleton className="h-16 w-11 rounded-sm" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {trimmedQuery.length >= 2 && !searching && results && results.length > 0 && (
            <ul className="flex flex-col">
              {results.map((r) => (
                <li key={r.googleBooksId}>
                  <BookSearchResultItem result={r} onSelect={handleSelect} />
                </li>
              ))}
            </ul>
          )}
          {trimmedQuery.length >= 2 && !searching && results && results.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <SearchX className="size-6 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">Aucun résultat pour cette recherche.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
