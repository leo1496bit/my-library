"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createLoan } from "@/lib/data/loans";
import { todayIso } from "@/lib/format";
import type { Loan } from "@/lib/types";

export function LoanDialog({
  bookId,
  open,
  onOpenChange,
  onLoaned,
}: {
  bookId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoaned: (loan: Loan) => void;
}) {
  const [borrowerName, setBorrowerName] = useState("");
  const [loanDate, setLoanDate] = useState(todayIso());
  const [expectedReturn, setExpectedReturn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!borrowerName.trim()) {
      setError("Indiquez le nom de l'emprunteur.");
      return;
    }
    setPending(true);
    setError(null);

    let loan: Loan;
    try {
      loan = await createLoan({
        book_id: bookId,
        borrower_name: borrowerName.trim(),
        loan_date: loanDate,
        expected_return_date: expectedReturn || null,
      });
    } catch {
      setPending(false);
      setError("Impossible d'enregistrer ce prêt.");
      return;
    }

    setPending(false);
    setBorrowerName("");
    setExpectedReturn("");
    setLoanDate(todayIso());
    onLoaned(loan);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Marquer comme prêté</DialogTitle>
            <DialogDescription>L&apos;emprunteur n&apos;a pas besoin de compte.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="borrower">Emprunteur</Label>
              <Input
                id="borrower"
                autoFocus
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                placeholder="Nom de la personne"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="loan-date">Date du prêt</Label>
                <Input
                  id="loan-date"
                  type="date"
                  value={loanDate}
                  onChange={(e) => setLoanDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="return-date">Retour prévu</Label>
                <Input
                  id="return-date"
                  type="date"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(e.target.value)}
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending} className="w-full">
              {pending && <Loader2 className="size-4 animate-spin" />}
              Enregistrer le prêt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
