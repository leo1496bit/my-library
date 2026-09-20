"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthlyChart } from "@/components/stats/monthly-chart";
import { ProportionBar } from "@/components/stats/proportion-bar";
import { BarList } from "@/components/stats/bar-list";
import { StatsSection } from "@/components/stats/stats-section";
import {
  countByFormat,
  countByStatus,
  estimatedPagesRead,
  finishedPerMonth,
  topAuthors,
  topGenres,
  type StatsSourceBook,
} from "@/lib/stats";

export function PublicStats({
  ownerId,
  displayName,
  slug,
}: {
  ownerId: string;
  displayName: string | null;
  slug: string;
}) {
  const [books, setBooks] = useState<StatsSourceBook[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    supabase.rpc("get_shared_books", { owner_id: ownerId }).then(({ data }) => {
      if (!cancelled) setBooks((data ?? []) as StatsSourceBook[]);
    });
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 pt-4 pb-6">
      <div>
        <Link
          href={`/u/${slug}`}
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Retour à la bibliothèque
        </Link>
        <h1 className="mt-2 font-heading text-2xl text-foreground">
          Statistiques {displayName ? `— ${displayName}` : ""}
        </h1>
      </div>

      {!books && (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      )}

      {books && (
        <>
          <StatsSection title="Rythme de lecture" subtitle="Livres terminés par mois">
            <MonthlyChart data={finishedPerMonth(books)} />
          </StatsSection>

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground">Pages lues (estimation)</p>
            <p className="mt-1 font-heading text-3xl text-foreground">
              {estimatedPagesRead(books).toLocaleString("fr-FR")}
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
        </>
      )}
    </div>
  );
}
