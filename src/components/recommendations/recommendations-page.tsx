"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RecommendationCard } from "@/components/recommendations/recommendation-card";
import type { GoogleBookResult } from "@/lib/google-books";

type Recommendation = GoogleBookResult & { reason: string };

export function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);

  useEffect(() => {
    fetch("/api/recommendations")
      .then((res) => res.json())
      .then((data: { recommendations: Recommendation[] }) => setRecommendations(data.recommendations))
      .catch(() => setRecommendations([]));
  }, []);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-6">
      <div>
        <h1 className="font-heading text-2xl text-foreground">Idées de lecture</h1>
        <p className="text-sm text-muted-foreground">
          D&apos;après vos auteurs et genres préférés dans votre bibliothèque.
        </p>
      </div>

      {!recommendations && (
        <div className="flex gap-3 overflow-x-auto">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56 w-40 shrink-0 rounded-sm" />
          ))}
        </div>
      )}

      {recommendations && recommendations.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Sparkles className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <p className="max-w-[30ch] text-sm text-muted-foreground">
            Ajoutez et notez quelques livres pour recevoir des suggestions personnalisées.
          </p>
        </div>
      )}

      {recommendations && recommendations.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {recommendations.map((r) => (
            <RecommendationCard key={r.googleBooksId} recommendation={r} />
          ))}
        </div>
      )}
    </div>
  );
}
