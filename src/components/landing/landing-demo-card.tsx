import { BookText } from "lucide-react";
import { StatusBadge } from "@/components/books/status-badge";

// Démonstration en boucle de l'ajout rapide (recherche → fiche remplie),
// en CSS pur (voir .landing-demo-* dans globals.css) : pas de survol ni de
// clic requis, la page démontre elle-même la fonctionnalité la plus
// caractéristique du produit. Purement illustratif (aria-hidden) : le
// texte qui compte est déjà dans le héros à côté.
export function LandingDemoCard() {
  return (
    <div
      className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"
      aria-hidden="true"
    >
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2.5">
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        >
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
          <path d="m17 17-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span className="relative font-mono text-sm text-foreground">
          <span className="landing-demo-query whitespace-nowrap">1984</span>
          <span className="landing-demo-cursor ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-foreground align-middle" />
        </span>
      </div>

      <div className="landing-demo-result mt-4 flex gap-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3.5">
        <span className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-muted">
          <BookText className="size-5 text-muted-foreground" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-base text-foreground">1984</p>
          <p className="truncate text-sm text-muted-foreground">George Orwell — 1949</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusBadge status="to_read" />
            <span className="rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-[11px] text-accent-foreground dark:text-accent">
              Dystopie
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
