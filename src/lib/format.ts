// `date_started`/`date_finished`/`loan_date`/`expected_return_date` sont des
// colonnes Postgres `date` (pas d'heure) : "2024-12-01" doit s'afficher comme
// le 1er décembre partout, quel que soit le fuseau du lecteur. `new
// Date("2024-12-01")` parse pourtant la chaîne comme minuit UTC, puis
// Intl.DateTimeFormat l'affiche dans le fuseau local — à l'ouest de l'UTC
// (Amérique), ça affichait la veille. `returned_at` est en revanche un vrai
// timestamptz (l'instant où le prêt a été rendu) : pour celui-là, l'affichage
// en heure locale du lecteur est le comportement voulu, pas un bug.
function parseDateValue(value: string): Date {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.exec(value);
  if (dateOnly) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = parseDateValue(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = parseDateValue(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(date);
}

const SHORT_MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

// Abrégés à largeur fixe (3 lettres) — plus lisibles que les abréviations
// Intl (longueur variable) dans une grille de 12 colonnes étroites.
export function formatMonthYear(value: Date): string {
  return SHORT_MONTHS[value.getMonth()];
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
