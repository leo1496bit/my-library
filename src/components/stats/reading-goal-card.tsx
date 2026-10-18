"use client";

import { useEffect, useState } from "react";
import { Check, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ReadingGoalCard({
  year,
  finished,
  pagesRead,
}: {
  year: number;
  finished: number;
  pagesRead: number;
}) {
  const [targetBooks, setTargetBooks] = useState<number | null>(null);
  // Objectif facultatif (contrairement à targetBooks) : null = non suivi,
  // la section pages reste alors masquée plutôt que d'afficher une barre à 0.
  const [targetPages, setTargetPages] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftBooks, setDraftBooks] = useState("12");
  const [draftPages, setDraftPages] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("reading_goals")
      .select("target_books, target_pages")
      .eq("year", year)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setTargetBooks(data.target_books);
          setDraftBooks(String(data.target_books));
          setTargetPages(data.target_pages);
          setDraftPages(data.target_pages ? String(data.target_pages) : "");
        } else {
          setEditing(true);
        }
      });
  }, [year]);

  async function save() {
    const books = Math.max(1, Number(draftBooks) || 1);
    const pages = draftPages.trim() === "" ? null : Math.max(1, Number(draftPages) || 1);
    const supabase = createClient();
    const { error } = await supabase
      .from("reading_goals")
      .upsert({ year, target_books: books, target_pages: pages }, { onConflict: "user_id,year" });
    if (!error) {
      setTargetBooks(books);
      setTargetPages(pages);
      setEditing(false);
    }
  }

  if (targetBooks === null && !editing) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Objectif {year}</h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Modifier l'objectif"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              value={draftBooks}
              onChange={(e) => setDraftBooks(e.target.value)}
              className="h-8 w-20"
            />
            <span className="text-sm text-muted-foreground">livres cette année</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              placeholder="facultatif"
              value={draftPages}
              onChange={(e) => setDraftPages(e.target.value)}
              className="h-8 w-20"
            />
            <span className="text-sm text-muted-foreground">pages cette année</span>
            <Button size="icon" className="ml-auto size-8" onClick={save} aria-label="Enregistrer">
              <Check className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-1 font-heading text-2xl text-foreground">
            {finished} <span className="text-base text-muted-foreground">/ {targetBooks}</span>
          </p>
          <Progress value={Math.min(100, (finished / (targetBooks ?? 1)) * 100)} className="mt-2" />

          {targetPages !== null && (
            <>
              <p className="mt-3 text-sm text-foreground">
                {pagesRead.toLocaleString("fr-FR")}{" "}
                <span className="text-muted-foreground">
                  / {targetPages.toLocaleString("fr-FR")} pages
                </span>
              </p>
              <Progress value={Math.min(100, (pagesRead / targetPages) * 100)} className="mt-2" />
            </>
          )}
        </>
      )}
    </div>
  );
}
