import type { BookStatus } from "@/lib/types";

// Classes Tailwind par statut — pastilles "fiche de catalogue", jamais la
// seule porteuse de sens (toujours accompagnées du libellé en texte).
export const STATUS_BADGE_CLASSES: Record<BookStatus, string> = {
  to_buy: "bg-muted text-muted-foreground border-border",
  to_read: "bg-accent/15 text-accent-foreground border-accent/30 dark:text-accent",
  reading: "bg-primary/12 text-primary border-primary/30",
  finished: "bg-success/15 text-success border-success/30",
  abandoned: "bg-muted text-muted-foreground border-border line-through decoration-1",
};
