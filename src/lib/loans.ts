// Logique pure autour des prêts (voir CONTEXT.md — "Loan"). Pas d'accès
// réseau ici : src/lib/data/loans.ts reste le seul point d'accès Supabase.

import type { Loan } from "@/lib/types";

// `expected_return_date` est une colonne Postgres `date` (pas d'heure, voir
// le commentaire équivalent dans src/lib/format.ts). On la compare en texte
// ("YYYY-MM-DD") à la date du jour formatée dans le fuseau local du lecteur,
// pour éviter le même piège de décalage UTC qu'avec `new Date(string)`.
function toLocalDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Vrai si la date de retour prévue est passée et que le prêt n'a pas encore
 * été rendu. Un prêt dont le retour est prévu aujourd'hui n'est pas encore
 * "en retard". */
export function isOverdue(
  loan: Pick<Loan, "expected_return_date" | "returned_at">,
  today: Date = new Date(),
): boolean {
  if (loan.returned_at || !loan.expected_return_date) return false;
  return loan.expected_return_date < toLocalDateIso(today);
}
