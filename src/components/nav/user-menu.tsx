"use client";

import Link from "next/link";
import { Download, LogOut, Sparkles, Upload, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";
import { fetchBooksWithRelations } from "@/lib/data/books";
import { booksToCsv } from "@/lib/csv";
import { todayIso } from "@/lib/format";

// Génération + téléchargement du CSV entièrement côté client : pas de route
// API dédiée, fetchBooksWithRelations() est déjà appelable depuis le
// navigateur. Le BOM UTF-8 évite qu'Excel n'affiche mal les caractères
// accentués (Éditeur, Terminé...) à l'ouverture du fichier.
async function handleExport() {
  try {
    const books = await fetchBooksWithRelations();
    const csv = booksToCsv(books);
    const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ma-bibliotheque-${todayIso()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("CSV export failed", error);
    toast.error("L'export a échoué. Réessayez.");
  }
}

export function UserMenu({ email }: { email: string | null }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border border-border bg-card text-foreground"
            aria-label="Compte"
          />
        }
      >
        <UserIcon className="size-4" strokeWidth={1.75} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {email && (
          <>
            {/* Base UI exige un <Menu.Group> autour de GroupLabel, même
                sans radio group / regroupement fonctionnel derrière. */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                {email}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem render={<Link href="/import" />}>
          <Upload className="size-4" />
          Importer un CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExport}>
          <Download className="size-4" />
          Exporter en CSV
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/recommendations" />}>
          <Sparkles className="size-4" />
          Idées
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem
            render={<button type="submit" className="w-full cursor-pointer text-left" />}
          >
            <LogOut className="size-4" />
            Se déconnecter
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
