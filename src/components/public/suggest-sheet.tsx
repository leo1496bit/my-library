"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BookText, Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { StatusChips } from "@/components/add/status-chips";
import { addBookAction } from "@/lib/actions/books";
import { STATUS_LABELS, type SharedBook, type SuggestStatus } from "@/lib/types";

const SUGGEST_STATUSES: SuggestStatus[] = ["to_read", "to_buy"];

export function SuggestSheet({
  book,
  open,
  onOpenChange,
}: {
  book: SharedBook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [status, setStatus] = useState<SuggestStatus>("to_read");
  const [pending, setPending] = useState(false);

  // Réinitialise le statut à chaque ouverture — ajustement pendant le
  // rendu plutôt qu'un effet, pour éviter un rendu en cascade évitable
  // (même pattern que quick-add-sheet.tsx).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setStatus("to_read");
  }

  async function handleConfirm() {
    if (!book) return;
    setPending(true);
    const result = await addBookAction({
      title: book.title,
      author: book.author,
      genre: book.genre,
      isbn: book.isbn,
      cover_url: book.cover_url,
      publisher: book.publisher,
      published_year: book.published_year,
      language: book.language,
      page_count: book.page_count,
      format: "physical",
      status,
      google_books_id: book.google_books_id,
      location: null,
    });
    setPending(false);

    if (result.error || !result.book) {
      toast.error(result.error ?? "Impossible d'ajouter ce livre.");
      return;
    }
    toast.success(`« ${result.book.title} » ajouté à votre bibliothèque`);
    onOpenChange(false);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent className="mx-auto w-full max-w-xl">
        <DrawerHeader>
          <DrawerTitle>Suggérer ce livre</DrawerTitle>
          <DrawerDescription>Il sera ajouté à votre propre bibliothèque.</DrawerDescription>
        </DrawerHeader>
        {book && (
          <div className="flex flex-col gap-5 px-4 pb-4">
            <div className="flex gap-3">
              <span className="flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-muted">
                {book.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.cover_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <BookText className="size-6 text-muted-foreground" strokeWidth={1.5} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-heading text-lg leading-snug text-foreground">{book.title}</h3>
                <p className="text-sm text-muted-foreground">{book.author ?? "Auteur inconnu"}</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Statut</span>
              <StatusChips
                value={status}
                onChange={setStatus}
                options={SUGGEST_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
              />
            </div>

            <Button onClick={handleConfirm} disabled={pending} size="lg">
              {pending && <Loader2 className="size-4 animate-spin" />}
              Ajouter à ma bibliothèque
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
