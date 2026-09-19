"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookText, ChevronLeft, MoreVertical, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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
import { formatDate } from "@/lib/format";
import { FORMAT_LABELS, type Book, type BookFormat, type BookStatus, type Loan, type Tag } from "@/lib/types";

export function BookDetail({ id }: { id: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [book, setBook] = useState<Book | null | "not-found">(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loanDialogOpen, setLoanDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [{ data: b, error }, { data: l }, { data: bt }] = await Promise.all([
        supabase.from("books").select("*").eq("id", id).single(),
        supabase.from("loans").select("*").eq("book_id", id).order("loan_date", { ascending: false }),
        supabase.from("book_tags").select("tags(*)").eq("book_id", id),
      ]);

      if (cancelled) return;
      if (error || !b) {
        setBook("not-found");
        return;
      }

      setBook(b as Book);
      setLoans((l ?? []) as Loan[]);
      setTags(((bt ?? []) as unknown as { tags: Tag }[]).map((row) => row.tags).filter(Boolean));
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function saveField(field: keyof Book, value: string | number | null) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("books")
      .update({ [field]: value })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) {
      toast.error("La modification n'a pas pu être enregistrée.");
      return;
    }
    setBook(data as Book);
  }

  async function handleStatusChange(status: BookStatus) {
    if (book === "not-found" || !book) return;
    const previousStatus = book.status;
    setBook({ ...book, status });
    const supabase = createClient();
    const { data, error } = await supabase
      .from("books")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) {
      toast.error("Le changement de statut a échoué.");
      setBook({ ...book, status: previousStatus });
      return;
    }
    setBook(data as Book);
    if (status === "finished" && !data.rating) {
      toast.success("Livre marqué comme terminé — vous pouvez le noter ci-dessous.");
    }
  }

  async function handleRatingChange(rating: number | null) {
    await saveField("rating", rating);
  }

  async function handleFormatChange(format: BookFormat) {
    await saveField("format", format);
  }

  async function handleReturned(loan: Loan) {
    const supabase = createClient();
    const returnedAt = new Date().toISOString();
    const { error } = await supabase.from("loans").update({ returned_at: returnedAt }).eq("id", loan.id);
    if (error) {
      toast.error("Impossible de marquer ce prêt comme rendu.");
      return;
    }
    setLoans((prev) => prev.map((l) => (l.id === loan.id ? { ...l, returned_at: returnedAt } : l)));
    toast.success("Marqué comme rendu.");
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    // .select("id") permet de distinguer "aucune ligne trouvée/autorisée"
    // (RLS ou id invalide) d'une vraie erreur réseau — sans ça, delete()
    // renvoie un succès silencieux même quand rien n'a été supprimé.
    const { data, error } = await supabase.from("books").delete().eq("id", id).select("id");
    setDeleting(false);

    if (error) {
      toast.error("Suppression impossible. Réessayez.");
      return;
    }
    if (!data || data.length === 0) {
      toast.error("Ce livre est introuvable ou a déjà été supprimé.");
      setDeleteOpen(false);
      return;
    }
    toast.success("Livre supprimé.");
    router.push("/library");
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
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" />
              Supprimer le livre
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
          <input
            defaultValue={book.title}
            key={`title-${book.id}`}
            onBlur={(e) => e.target.value.trim() && e.target.value !== book.title && saveField("title", e.target.value.trim())}
            className="font-heading text-xl leading-snug text-foreground outline-none"
            aria-label="Titre"
          />
          <input
            defaultValue={book.author ?? ""}
            key={`author-${book.id}`}
            placeholder="Auteur"
            onBlur={(e) => e.target.value !== (book.author ?? "") && saveField("author", e.target.value || null)}
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
          <DetailField label="Genre" value={book.genre ?? ""} onCommit={(v) => saveField("genre", v || null)} />
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
          <DetailField label="ISBN" value={book.isbn ?? ""} onCommit={(v) => saveField("isbn", v || null)} />
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
          onBlur={(e) => e.target.value !== (book.notes ?? "") && saveField("notes", e.target.value || null)}
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
