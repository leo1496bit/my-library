"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ReadingGoalCard } from "@/components/stats/reading-goal-card";
import { MonthlyChart } from "@/components/stats/monthly-chart";
import { ProportionBar } from "@/components/stats/proportion-bar";
import { BarList } from "@/components/stats/bar-list";
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
  const [books, setBooks] = useState<Book[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("books")
      .select("*")
      .then(({ data }) => setBooks((data ?? []) as Book[]));
  }, []);

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

      <Section title="Rythme de lecture" subtitle="Livres terminés par mois">
        <MonthlyChart data={finishedPerMonth(books)} />
      </Section>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-medium text-foreground">Pages lues (estimation)</p>
        <p className="mt-1 font-heading text-3xl text-foreground">
          {pages.toLocaleString("fr-FR")}
        </p>
        <p className="text-xs text-muted-foreground">Somme des pages des livres terminés</p>
      </div>

      <Section title="Répartition par statut">
        <ProportionBar entries={countByStatus(books)} />
      </Section>

      <Section title="Répartition par format">
        <ProportionBar entries={countByFormat(books)} />
      </Section>

      <Section title="Auteurs les plus lus">
        <BarList entries={topAuthors(books)} />
      </Section>

      <Section title="Genres les plus lus">
        <BarList entries={topGenres(books)} />
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      {subtitle && <p className="mb-2 text-xs text-muted-foreground">{subtitle}</p>}
      <div className={subtitle ? "mt-1" : "mt-3"}>{children}</div>
    </section>
  );
}
