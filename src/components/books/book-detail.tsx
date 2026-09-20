"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookText, ChevronLeft, ImagePlus, MoreVertical, Trash2 } from "lucide-react";
import { deleteBook, fetchBookDetail, updateBook } from "@/lib/data/books";
import { markLoanReturned } from "@/lib/data/loans";
import { NotFoundError } from "@/lib/data/errors";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusSelectChips } from "@/components/books/status-select-chips";
import { RatingStars } from "@/components/books/rating-stars";
import { DetailField } from "@/components/books/detail-field";
import { TagEditor } from "@/components/books/tag-editor";
import { LoanBadge } from "@/components/books/loan-badge";
import { LoanDialog } from "@/components/loans/loan-dialog";
import { GoogleBookMatchDialog } from "@/components/books/google-book-match-dialog";
import { formatDate } from "@/lib/format";
import type { GoogleBookResult } from "@/lib/google-books";
import {
  FORMAT_LABELS,
  type Book,
  type BookFormat,
  type BookStatus,
  type Loan,
  type Tag,
} from "@/lib/types";

export function BookDetail({ id }: { id: string }) {
  const router = useRouter();

  const [book, setBook] = useState<Book | null | "not-found">(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loanDialogOpen, setLoanDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [matchDialog, setMatchDialog] = useState<"cover" | "title" | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchBookDetail(id).then((data) => {
      if (cancelled) return;
      if (!data) {
        setBook("not-found");
        return;
      }
      setBook(data.book);
      setLoans(data.loans);
      setTags(data.tags);
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (book === null) {
    return (
      <div className="flex flex-col gap-4 px-4 pt-4">
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
      <div className="flex flex-col items-center gap-3 px-4 pt-16 text-center">
        <p className="text-sm text-muted-foreground">Ce livre est introuvable.</p>
        <Button variant="outline" onClick={() => router.push("/library")}>
          Retour à la bibliothèque
        </Button>
      </div>
    );
  }

  const activeLoan = loans.find((l) => !l.returned_at) ?? null;
  const pastLoans = loans.filter((l) => l.returned_at);

  async function saveFields(patch: Partial<Book>, successMessage?: string) {
    try {
      const updated = await updateBook(id, patch);
      setBook(updated);
      if (successMessage) toast.success(successMessage);
    } catch {
      toast.error("La modification n'a pas pu être enregistrée.");
    }
  }

  async function saveField(
    field: keyof Book,
    value: string | number | null,
    successMessage?: string,
  ) {
    await saveFields({ [field]: value } as Partial<Book>, successMessage);
  }

  async function handleStatusChange(status: BookStatus) {
    if (book === "not-found" || !book) return;
    const previous = book;
    setBook({ ...book, status });
    try {
      const updated = await updateBook(id, { status });
      setBook(updated);
      if (status === "finished" && !updated.rating) {
        toast.success("Livre marqué comme terminé — vous pouvez le noter ci-dessous.");
      }
    } catch {
      toast.error("Le changement de statut a échoué.");
      setBook(previous);
    }
  }

  async function handleRatingChange(rating: number | null) {
    await saveField("rating", rating);
  }

  async function handleFormatChange(format: BookFormat) {
    await saveField("format", format);
  }

  async function handleCoverMatch(result: GoogleBookResult) {
    if (!result.coverUrl) {
      toast.error("Cette édition n'a pas de couverture disponible.");
      return;
    }
    await saveField("cover_url", result.coverUrl, "Couverture mise à jour.");
  }

  async function handleCoverUrlInput(url: string) {
    await saveField("cover_url", url, "Couverture mise à jour.");
  }

  async function handleBookMatch(result: GoogleBookResult) {
    // Recopie tout ce que Google Books a retrouvé sur l'édition choisie —
    // pas seulement le titre — pour corriger d'un coup une fiche mal
    // renseignée, comme le fait l'ajout rapide à la création.
    const patch: Partial<Book> = {
      title: result.title,
      author: result.author,
      genre: result.genre,
      isbn: result.isbn,
      publisher: result.publisher,
      published_year: result.publishedYear,
      language: result.language,
      page_count: result.pageCount,
      google_books_id: result.googleBooksId,
    };
    if (result.coverUrl) patch.cover_url = result.coverUrl;
    await saveFields(patch, "Détails mis à jour depuis Google Books.");
  }

  async function handleReturned(loan: Loan) {
    const previous = loans;
    const optimisticReturnedAt = new Date().toISOString();
    setLoans((prev) =>
      prev.map((l) => (l.id === loan.id ? { ...l, returned_at: optimisticReturnedAt } : l)),
    );
    try {
      const updated = await markLoanReturned(loan.id);
      setLoans((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      toast.success("Marqué comme rendu.");
    } catch {
      toast.error("Impossible de marquer ce prêt comme rendu.");
      setLoans(previous);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteBook(id);
      toast.success("Livre supprimé.");
      router.push("/library");
    } catch (err) {
      // Un rejet réseau/exception ici ne doit jamais laisser le bouton
      // "planté" en silence — on veut toujours un retour visible.
      const message = err instanceof Error ? err.message : "Une erreur inattendue est survenue.";
      toast.error(message);
      // "Introuvable" : pas la peine de réessayer, on ferme. Toute autre
      // erreur (réseau, etc.) laisse la boîte ouverte pour un nouvel essai.
      if (err instanceof NotFoundError) setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 pt-4 pb-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Retour
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Options" />}>
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                // Laisse le menu déroulant terminer sa fermeture avant
                // d'ouvrir la boîte de confirmation : ouvrir les deux en
                // même temps peut laisser la page inerte (pointer-events
                // bloqué par la fermeture du menu), rendant les boutons
                // de la boîte de dialogue non cliquables.
                setTimeout(() => setDeleteOpen(true), 150);
              }}
            >
              <Trash2 className="size-4" />
              Supprimer le livre
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex gap-4">
        <div className="relative shrink-0">
          <span className="flex h-40 w-28 items-center justify-center overflow-hidden rounded-sm border border-border bg-muted">
            {book.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={book.cover_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <BookText className="size-8 text-muted-foreground" strokeWidth={1.5} />
            )}
          </span>
          <button
            type="button"
            onClick={() => setMatchDialog("cover")}
            aria-label="Changer la couverture"
            className="absolute -right-1.5 -bottom-1.5 flex size-7 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm hover:bg-secondary"
          >
            <ImagePlus className="size-3.5" />
          </button>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setMatchDialog("title")}
            aria-label="Corriger les informations du livre depuis Google Books"
            className="w-fit min-w-0 text-left font-heading text-xl leading-snug text-foreground outline-none"
          >
            {book.title}
          </button>
          <input
            defaultValue={book.author ?? ""}
            key={`author-${book.id}`}
            placeholder="Auteur"
            onBlur={(e) =>
              e.target.value !== (book.author ?? "") && saveField("author", e.target.value || null)
            }
            className="text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/60"
            aria-label="Auteur"
          />
          {activeLoan && (
            <div>
              <LoanBadge />
            </div>
          )}
          <div className="mt-1">
            <RatingStars value={book.rating} onChange={handleRatingChange} size="md" />
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-foreground">Statut</h2>
        <StatusSelectChips value={book.status} onChange={handleStatusChange} />
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
          <DetailField
            label="Genre"
            value={book.genre ?? ""}
            onCommit={(v) => saveField("genre", v || null)}
          />
          <DetailField
            label="Éditeur"
            value={book.publisher ?? ""}
            onCommit={(v) => saveField("publisher", v || null)}
          />
          <DetailField
            label="Année"
            type="number"
            value={book.published_year?.toString() ?? ""}
            onCommit={(v) => saveField("published_year", v ? Number(v) : null)}
          />
          <DetailField
            label="Pages"
            type="number"
            value={book.page_count?.toString() ?? ""}
            onCommit={(v) => saveField("page_count", v ? Number(v) : null)}
          />
          <DetailField
            label="ISBN"
            value={book.isbn ?? ""}
            onCommit={(v) => saveField("isbn", v || null)}
          />
          <DetailField
            label="Langue"
            value={book.language ?? ""}
            onCommit={(v) => saveField("language", v || null)}
          />
          <DetailField
            label="Emplacement"
            value={book.location ?? ""}
            placeholder="Étagère salon…"
            onCommit={(v) => saveField("location", v || null)}
          />
          <div className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-sm text-muted-foreground">Format</span>
            <Select value={book.format} onValueChange={(v) => handleFormatChange(v as BookFormat)}>
              <SelectTrigger size="sm" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FORMAT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-foreground">Tags</h2>
        <TagEditor bookId={id} tags={tags} onChange={setTags} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-foreground">Notes</h2>
        <Textarea
          defaultValue={book.notes ?? ""}
          key={`notes-${book.id}`}
          placeholder="Vos impressions, citations à retenir…"
          rows={4}
          onBlur={(e) =>
            e.target.value !== (book.notes ?? "") && saveField("notes", e.target.value || null)
          }
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-foreground">Prêt</h2>
        {activeLoan ? (
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
            <div>
              <p className="text-sm text-foreground">Prêté à {activeLoan.borrower_name}</p>
              <p className="text-xs text-muted-foreground">
                Depuis le {formatDate(activeLoan.loan_date)}
                {activeLoan.expected_return_date &&
                  ` · retour prévu le ${formatDate(activeLoan.expected_return_date)}`}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => handleReturned(activeLoan)}>
              Marquer rendu
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setLoanDialogOpen(true)}>
            Marquer comme prêté
          </Button>
        )}
        {pastLoans.length > 0 && (
          <div className="mt-1 flex flex-col gap-1">
            {pastLoans.map((l) => (
              <p key={l.id} className="text-xs text-muted-foreground">
                Prêté à {l.borrower_name} le {formatDate(l.loan_date)}, rendu le{" "}
                {formatDate(l.returned_at)}
              </p>
            ))}
          </div>
        )}
      </section>

      <LoanDialog
        bookId={id}
        open={loanDialogOpen}
        onOpenChange={setLoanDialogOpen}
        onLoaned={(loan) => setLoans((prev) => [loan, ...prev])}
      />

      <GoogleBookMatchDialog
        open={matchDialog !== null}
        onOpenChange={(next) => !next && setMatchDialog(null)}
        title={matchDialog === "cover" ? "Changer la couverture" : "Corriger via Google Books"}
        description={
          matchDialog === "cover"
            ? "Cherchez une édition pour reprendre sa couverture, ou collez l'URL d'une image."
            : "Choisissez la bonne édition : titre, auteur, genre, éditeur, année, pages, ISBN et langue seront mis à jour."
        }
        initialQuery={matchDialog === "title" ? book.title : undefined}
        onSelect={(result) => {
          if (matchDialog === "cover") handleCoverMatch(result);
          else if (matchDialog === "title") handleBookMatch(result);
        }}
        customImage={matchDialog === "cover" ? { onUse: handleCoverUrlInput } : undefined}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {book.title} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive et supprimera aussi son historique de prêts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction disabled={deleting} onClick={handleDelete} variant="destructive">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
