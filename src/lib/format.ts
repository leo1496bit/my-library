export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(date);
}

const SHORT_MONTHS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

// Abrégés à largeur fixe (3 lettres) — plus lisibles que les abréviations
// Intl (longueur variable) dans une grille de 12 colonnes étroites.
export function formatMonthYear(value: Date): string {
  return SHORT_MONTHS[value.getMonth()];
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
