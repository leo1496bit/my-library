"use client";

import { useEffect, useState } from "react";
import { Check, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ReadingGoalCard({ year, finished }: { year: number; finished: number }) {
  const [target, setTarget] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("12");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("reading_goals")
      .select("target_books")
      .eq("year", year)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setTarget(data.target_books);
          setDraft(String(data.target_books));
        } else {
          setEditing(true);
        }
      });
  }, [year]);

  async function save() {
    const value = Math.max(1, Number(draft) || 1);
    const supabase = createClient();
    const { error } = await supabase
      .from("reading_goals")
      .upsert({ year, target_books: value }, { onConflict: "user_id,year" });
    if (!error) {
      setTarget(value);
      setEditing(false);
    }
  }

  if (target === null && !editing) {
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
        <div className="mt-2 flex items-center gap-2">
          <Input
            type="number"
            min={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-8 w-20"
          />
          <span className="text-sm text-muted-foreground">livres cette année</span>
          <Button size="icon" className="ml-auto size-8" onClick={save} aria-label="Enregistrer">
            <Check className="size-4" />
          </Button>
        </div>
      ) : (
        <>
          <p className="mt-1 font-heading text-2xl text-foreground">
            {finished} <span className="text-base text-muted-foreground">/ {target}</span>
          </p>
          <Progress value={Math.min(100, (finished / (target ?? 1)) * 100)} className="mt-2" />
        </>
      )}
    </div>
  );
}
