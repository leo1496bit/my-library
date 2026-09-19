"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Repeat2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import type { Loan } from "@/lib/types";

type LoanWithBook = Loan & {
  books: { id: string; title: string; author: string | null; cover_url: string | null } | null;
};

export function LoanList() {
  const [loans, setLoans] = useState<LoanWithBook[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("loans")
        .select("*, books(id, title, author, cover_url)")
        .order("loan_date", { ascending: false });
      if (!cancelled) setLoans((data ?? []) as LoanWithBook[]);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function markReturned(loan: LoanWithBook) {
    const supabase = createClient();
    const returnedAt = new Date().toISOString();
    setLoans((prev) =>
      prev ? prev.map((l) => (l.id === loan.id ? { ...l, returned_at: returnedAt } : l)) : prev,
    );
    const { error } = await supabase.from("loans").update({ returned_at: returnedAt }).eq("id", loan.id);
    if (error) {
      toast.error("Impossible de marquer ce prêt comme rendu.");
      setLoans((prev) =>
        prev ? prev.map((l) => (l.id === loan.id ? { ...l, returned_at: null } : l)) : prev,
      );
      return;
    }
    toast.success(`« ${loan.books?.title} » marqué comme rendu`);
  }

  const active = loans?.filter((l) => !l.returned_at) ?? [];
  const history = loans?.filter((l) => l.returned_at) ?? [];

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <div>
        <h1 className="font-heading text-2xl text-foreground">Mes prêts</h1>
        <p className="text-sm text-muted-foreground">
          {loans ? `${active.length} prêt${active.length > 1 ? "s" : ""} en cours` : "Chargement…"}
        </p>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1">
            En cours
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1">
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="flex flex-col gap-3 pt-3">
          {!loans && <LoanSkeletons />}
          {loans && active.length === 0 && (
            <EmptyState message="Aucun prêt en cours. Depuis la fiche d'un livre, marquez-le comme prêté." />
          )}
          {active.map((loan) => (
            <LoanRow key={loan.id} loan={loan} onReturn={() => markReturned(loan)} />
          ))}
        </TabsContent>

        <TabsContent value="history" className="flex flex-col gap-3 pt-3">
          {!loans && <LoanSkeletons />}
          {loans && history.length === 0 && <EmptyState message="Aucun prêt rendu pour l'instant." />}
          {history.map((loan) => (
            <LoanRow key={loan.id} loan={loan} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoanRow({ loan, onReturn }: { loan: LoanWithBook; onReturn?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      <Link href={loan.books ? `/books/${loan.books.id}` : "#"} className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {loan.books?.title ?? "Livre supprimé"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          Emprunté par {loan.borrower_name} · {formatDate(loan.loan_date)}
        </p>
        {loan.expected_return_date && !loan.returned_at && (
          <p className="text-xs text-loan">Retour prévu le {formatDate(loan.expected_return_date)}</p>
        )}
        {loan.returned_at && (
          <p className="text-xs text-muted-foreground">Rendu le {formatDate(loan.returned_at)}</p>
        )}
      </Link>
      {onReturn && (
        <Button size="sm" variant="outline" onClick={onReturn}>
          Marquer rendu
        </Button>
      )}
    </div>
  );
}

function LoanSkeletons() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1].map((i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <Repeat2 className="size-7 text-muted-foreground" strokeWidth={1.5} />
      <p className="max-w-[30ch] text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
