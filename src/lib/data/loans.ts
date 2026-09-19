// Accès aux données "Loan" (voir CONTEXT.md). markLoanReturned est le seul
// endroit qui marque un prêt comme rendu — book-detail.tsx et loan-list.tsx
// l'appellent tous les deux, ce qui élimine la divergence qu'il y avait
// entre leurs deux implémentations copiées (l'une revenait en arrière sur
// échec, l'autre non).

import { createClient } from "@/lib/supabase/client";
import type { Loan, LoanInsert } from "@/lib/types";

export interface LoanWithBook extends Loan {
  books: { id: string; title: string; author: string | null; cover_url: string | null } | null;
}

/** Tous les prêts de l'utilisateur courant, avec le livre associé, le plus
 * récent d'abord. */
export async function fetchLoansWithBooks(): Promise<LoanWithBook[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("loans")
    .select("*, books(id, title, author, cover_url)")
    .order("loan_date", { ascending: false });
  return (data ?? []) as unknown as LoanWithBook[];
}

export async function createLoan(input: LoanInsert): Promise<Loan> {
  const supabase = createClient();
  const { data, error } = await supabase.from("loans").insert(input).select().single();
  if (error || !data) {
    console.error("createLoan failed", { input, error });
    throw new Error(error?.message || "Impossible d'enregistrer ce prêt.");
  }
  return data as Loan;
}

export async function markLoanReturned(loanId: string): Promise<Loan> {
  const supabase = createClient();
  const returnedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("loans")
    .update({ returned_at: returnedAt })
    .eq("id", loanId)
    .select()
    .single();
  if (error || !data) {
    console.error("markLoanReturned failed", { loanId, error });
    throw new Error(error?.message || "Impossible de marquer ce prêt comme rendu.");
  }
  return data as Loan;
}
