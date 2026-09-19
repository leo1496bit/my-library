"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusChips } from "@/components/add/status-chips";
import { addBookAction } from "@/lib/actions/books";
import {
  FORMAT_LABELS,
  STATUS_LABELS,
  type Book,
  type BookFormat,
  type QuickAddStatus,
} from "@/lib/types";

const QUICK_STATUSES: QuickAddStatus[] = ["to_read", "to_buy", "reading"];

export function ManualAddForm({
  initialTitle = "",
  onAdded,
  onCancel,
}: {
  initialTitle?: string;
  onAdded: (book: Book) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [isbn, setIsbn] = useState("");
  const [publisher, setPublisher] = useState("");
  const [year, setYear] = useState("");
  const [pages, setPages] = useState("");
  const [format, setFormat] = useState<BookFormat>("physical");
  const [status, setStatus] = useState<QuickAddStatus>("to_read");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addBookAction({
        title,
        author: author || null,
        genre: genre || null,
        isbn: isbn || null,
        publisher: publisher || null,
        published_year: year ? Number(year) : null,
        page_count: pages ? Number(pages) : null,
        format,
        status,
        cover_url: null,
        language: null,
        google_books_id: null,
        location: null,
      });
      if (result.error || !result.book) {
        setError(result.error ?? "Impossible d'ajouter ce livre.");
        return;
      }
      onAdded(result.book);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="manual-title">Titre</Label>
        <Input
          id="manual-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Le titre du livre"
          autoFocus
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="manual-author">Auteur</Label>
          <Input id="manual-author" value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="manual-genre">Genre</Label>
          <Input id="manual-genre" value={genre} onChange={(e) => setGenre(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="manual-year">Année</Label>
          <Input
            id="manual-year"
            inputMode="numeric"
            value={year}
            onChange={(e) => setYear(e.target.value.replace(/[^\d]/g, ""))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="manual-pages">Pages</Label>
          <Input
            id="manual-pages"
            inputMode="numeric"
            value={pages}
            onChange={(e) => setPages(e.target.value.replace(/[^\d]/g, ""))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="manual-publisher">Éditeur</Label>
          <Input
            id="manual-publisher"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="manual-isbn">ISBN</Label>
          <Input id="manual-isbn" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="manual-format">Format</Label>
        <Select value={format} onValueChange={(v) => setFormat(v as BookFormat)}>
          <SelectTrigger id="manual-format" className="w-full">
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
      <div className="flex flex-col gap-1.5">
        <Label>Statut</Label>
        <StatusChips
          value={status}
          onChange={setStatus}
          options={QUICK_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
        />
      </div>
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      <div className="flex gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={pending} className="flex-1">
          {pending && <Loader2 className="size-4 animate-spin" />}
          Ajouter à ma bibliothèque
        </Button>
      </div>
    </form>
  );
}
