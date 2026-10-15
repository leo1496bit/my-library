"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAddBookSheet } from "@/components/add/add-book-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ReadingGoalCard } from "@/components/stats/reading-goal-card";
import { MonthlyChart } from "@/components/stats/monthly-chart";
import { ProportionBar } from "@/components/stats/proportion-bar";
import { BarList } from "@/components/stats/bar-list";
import { StatsSection } from "@/components/stats/stats-section";
import {
  countByFormat,
  countByStatus,
  estimatedPagesRead,
  finishedPerMonth,
  finishedThisYear,
  topAuthors,
  topGenres,
} from "@/lib/stats";
import type { Book } from "@/lib/types";

export function StatsPage() {
  const { addedTick, openSheet } = useAddBookSheet();
  const [books, setBooks] = useState<Book[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("books")
      .select("*")
      .then(({ data }) => setBooks((data ?? []) as Book[]));
  }, [addedTick]);

  if (!books) {
    return (
      <div className="flex flex-col gap-4 px-4 pt-4">
        <Skeleton className="h-7 w-40" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex flex-col gap-4 px-4 pt-4">
        <h1 className="font-heading text-2xl text-foreground">Statistiques</h1>
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <BarChart3 className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <p className="max-w-[28ch] text-sm text-muted-foreground">
            Vos statistiques de lecture apparaîtront ici dès que vous aurez ajouté des livres.
          </p>
          <Button onClick={openSheet}>Ajouter un livre</Button>
        </div>
      </div>
    );
  }

  const year = new Date().getFullYear();
  const pages = estimatedPagesRead(books);

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-6">
      <div>
        <h1 className="font-heading text-2xl text-foreground">Statistiques</h1>
        <p className="text-sm text-muted-foreground">
          {books.length} livre{books.length > 1 ? "s" : ""} au total
        </p>
      </div>

      <ReadingGoalCard year={year} finished={finishedThisYear(books, year)} />

      <StatsSection title="Rythme de lecture" subtitle="Livres terminés par mois">
        <MonthlyChart data={finishedPerMonth(books)} />
      </StatsSection>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-medium text-foreground">Pages lues (estimation)</p>
        <p className="mt-1 font-heading text-3xl text-foreground">
          {pages.toLocaleString("fr-FR")}
        </p>
        <p className="text-xs text-muted-foreground">Somme des pages des livres terminés</p>
      </div>

      <StatsSection title="Répartition par statut">
        <ProportionBar entries={countByStatus(books)} />
      </StatsSection>

      <StatsSection title="Répartition par format">
        <ProportionBar entries={countByFormat(books)} />
      </StatsSection>

      <StatsSection title="Auteurs les plus lus">
        <BarList entries={topAuthors(books)} />
      </StatsSection>

      <StatsSection title="Genres les plus lus">
        <BarList entries={topGenres(books)} />
      </StatsSection>
    </div>
  );
}
