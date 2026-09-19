"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { BookText, ChevronLeft, Loader2, SearchX } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChips } from "@/components/add/status-chips";
import { BookSearchResultItem } from "@/components/add/book-search-result-item";
import { ManualAddForm } from "@/components/add/manual-add-form";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAddBookSheet } from "@/components/add/add-book-context";
import { addBookAction } from "@/lib/actions/books";
import { STATUS_LABELS, type QuickAddStatus } from "@/lib/types";
import type { GoogleBookResult } from "@/lib/google-books";

type Step = "search" | "confirm" | "manual";

const QUICK_STATUSES: QuickAddStatus[] = ["to_read", "to_buy", "reading"];

export function QuickAddSheet() {
  const { open, closeSheet, notifyAdded } = useAddBookSheet();

  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 350);
  const [results, setResults] = useState<GoogleBookResult[] | null>(null);
  const [completedQuery, setCompletedQuery] = useState<string | null>(null);
  const [searchFailed, setSearchFailed] = useState(false);

  const [selected, setSelected] = useState<GoogleBookResult | null>(null);
  const [status, setStatus] = useState<QuickAddStatus>("to_read");
  const [pending, startTransition] = useTransition();

  // Réinitialise le flux à chaque ouverture (pattern "ajuster l'état pendant
  // le rendu" plutôt qu'un effet, pour éviter un rendu en cascade évitable).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setStep("search");
      setQuery("");
      setResults(null);
      setCompletedQuery(null);
      setSelected(null);
      setStatus("to_read");
      setSearchFailed(false);
    }
  }

  const trimmedQuery = debouncedQuery.trim();
  // "En recherche" se déduit de la requête en cours vs la dernière requête
  // pour laquelle on a une réponse — jamais un booléen posé directement
  // dans l'effet (voir la note plus bas sur les mises à jour d'état).
  const searching = trimmedQuery.length >= 2 && completedQuery !== trimmedQuery;

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      // Rien à synchroniser : le rendu masque déjà les résultats tant que
      // la requête est trop courte (voir trimmedQuery plus haut).
      return;
    }

    const controller = new AbortController();

    fetch(`/api/books/search?q=${encodeURIComponent(trimmedQuery)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: { results: GoogleBookResult[]; error?: string }) => {
        setResults(data.results);
        setSearchFailed(Boolean(data.error) && data.results.length === 0);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setResults([]);
        setSearchFailed(true);
      })
      .finally(() => setCompletedQuery(trimmedQuery));

    return () => controller.abort();
  }, [trimmedQuery]);

  function handleSelect(result: GoogleBookResult) {
    setSelected(result);
    setStatus("to_read");
    setStep("confirm");
  }

  function handleConfirmAdd() {
    if (!selected) return;
    startTransition(async () => {
      const result = await addBookAction({
        title: selected.title,
        author: selected.author,
        genre: selected.genre,
        isbn: selected.isbn,
        cover_url: selected.coverUrl,
        publisher: selected.publisher,
        published_year: selected.publishedYear,
        language: selected.language,
        page_count: selected.pageCount,
        format: "physical",
        status,
        google_books_id: selected.googleBooksId,
        location: null,
      });
      if (result.error || !result.book) {
        toast.error(result.error ?? "Impossible d'ajouter ce livre.");
        return;
      }
      toast.success(`« ${result.book.title} » ajouté à votre bibliothèque`);
      notifyAdded();
      closeSheet();
    });
  }

  function handleManualAdded(book: { title: string }) {
    toast.success(`« ${book.title} » ajouté à votre bibliothèque`);
    notifyAdded();
    closeSheet();
  }

  return (
    <Drawer open={open} onOpenChange={(next) => !next && closeSheet()} showSwipeHandle>
      <DrawerContent className="mx-auto w-full max-w-xl">
        {step === "search" && (
          <>
            <DrawerHeader>
              <DrawerTitle>Ajouter un livre</DrawerTitle>
              <DrawerDescription>
                Tapez un titre, sélectionnez l&apos;édition — le reste se remplit tout seul.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Titre du livre…"
                aria-label="Rechercher un titre"
              />

              <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
                {trimmedQuery.length < 2 && (
                  <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                    <BookText className="size-6" strokeWidth={1.5} />
                    <p className="text-sm">Commencez à taper le titre du livre à ajouter.</p>
                  </div>
                )}

                {trimmedQuery.length >= 2 && searching && (
                  <div className="flex flex-col gap-2 py-1">
                    {[0, 1, 2].map((i) => (
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
                    <p className="text-sm text-muted-foreground">
                      {searchFailed
                        ? "Recherche indisponible pour le moment."
                        : "Aucun résultat pour cette recherche."}
                    </p>
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("manual")}
                className="mt-1"
              >
                Saisir manuellement
              </Button>
            </div>
          </>
        )}

        {step === "confirm" && selected && (
          <>
            <DrawerHeader className="flex-row items-center gap-2 space-y-0 text-left">
              <button
                type="button"
                onClick={() => setStep("search")}
                aria-label="Retour à la recherche"
                className="-ml-1.5 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
              >
                <ChevronLeft className="size-5" />
              </button>
              <DrawerTitle>Confirmer l&apos;ajout</DrawerTitle>
            </DrawerHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
              <div className="flex gap-3">
                <span className="flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-muted">
                  {selected.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selected.coverUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <BookText className="size-6 text-muted-foreground" strokeWidth={1.5} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-lg leading-snug text-foreground">
                    {selected.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selected.author ?? "Auteur inconnu"}
                  </p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    {selected.publisher && (
                      <div className="flex justify-between gap-2 border-b border-dashed border-border/70 py-0.5">
                        <dt className="text-muted-foreground">Éditeur</dt>
                        <dd className="truncate text-foreground">{selected.publisher}</dd>
                      </div>
                    )}
                    {selected.publishedYear && (
                      <div className="flex justify-between gap-2 border-b border-dashed border-border/70 py-0.5">
                        <dt className="text-muted-foreground">Année</dt>
                        <dd className="text-foreground">{selected.publishedYear}</dd>
                      </div>
                    )}
                    {selected.pageCount && (
                      <div className="flex justify-between gap-2 border-b border-dashed border-border/70 py-0.5">
                        <dt className="text-muted-foreground">Pages</dt>
                        <dd className="text-foreground">{selected.pageCount}</dd>
                      </div>
                    )}
                    {selected.language && (
                      <div className="flex justify-between gap-2 border-b border-dashed border-border/70 py-0.5">
                        <dt className="text-muted-foreground">Langue</dt>
                        <dd className="text-foreground uppercase">{selected.language}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Statut</span>
                <StatusChips
                  value={status}
                  onChange={setStatus}
                  options={QUICK_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
                />
              </div>

              <Button onClick={handleConfirmAdd} disabled={pending} size="lg" className="mt-1">
                {pending && <Loader2 className="size-4 animate-spin" />}
                Ajouter à ma bibliothèque
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Notes, note et emplacement se renseignent depuis la fiche du livre.
              </p>
            </div>
          </>
        )}

        {step === "manual" && (
          <>
            <DrawerHeader className="flex-row items-center gap-2 space-y-0 text-left">
              <button
                type="button"
                onClick={() => setStep("search")}
                aria-label="Retour à la recherche"
                className="-ml-1.5 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
              >
                <ChevronLeft className="size-5" />
              </button>
              <DrawerTitle>Ajout manuel</DrawerTitle>
            </DrawerHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              <ManualAddForm initialTitle={query} onAdded={handleManualAdded} />
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
