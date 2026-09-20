import { BookText } from "lucide-react";

// Démo en boucle, en CSS pur, de l'auto-remplissage : chaque champ apparaît
// l'un après l'autre après la recherche, pour montrer concrètement ce que
// fait l'ajout rapide plutôt que de se contenter de l'écrire. Purement
// illustratif (aria-hidden) : le texte qui compte est dans le texte à côté.
const FIELDS: { label: string; value: string; delayMs: number }[] = [
  { label: "Auteur", value: "George Orwell", delayMs: 1900 },
  { label: "Éditeur", value: "Secker & Warburg", delayMs: 2550 },
  { label: "Année", value: "1949", delayMs: 3200 },
  { label: "ISBN", value: "978-2-07-036822-8", delayMs: 3850 },
];

export function LandingAutofillDemo() {
  return (
    <div
      className="flex w-full flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"
      aria-hidden="true"
    >
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2.5">
        <svg viewBox="0 0 20 20" fill="none" className="size-4 shrink-0 text-muted-foreground">
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
          <path d="m17 17-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span className="relative font-mono text-sm text-foreground">
          <span className="landing-autofill-query whitespace-nowrap">1984</span>
          <span className="landing-autofill-cursor ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-foreground align-middle" />
        </span>
      </div>

      <div className="flex gap-3 border-t border-border pt-4">
        <span
          className="landing-autofill-row flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-muted"
          style={{ animationDelay: "1250ms" }}
        >
          <BookText className="size-5 text-muted-foreground" strokeWidth={1.5} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="truncate font-heading text-base text-foreground">1984</p>
          <dl className="flex flex-col gap-1">
            {FIELDS.map((field) => (
              <div
                key={field.label}
                className="landing-autofill-row flex items-baseline justify-between gap-3 text-sm"
                style={{ animationDelay: `${field.delayMs}ms` }}
              >
                <dt className="text-muted-foreground">{field.label}</dt>
                <dd className="truncate text-foreground">{field.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
