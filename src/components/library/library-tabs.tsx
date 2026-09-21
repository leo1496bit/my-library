"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { BookList } from "@/components/books/book-list";
import { AuthorsList } from "@/components/authors/authors-list";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "books", label: "Livres" },
  { value: "authors", label: "Auteurs" },
] as const;

type Tab = (typeof TABS)[number]["value"];

export function LibraryTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: Tab = searchParams.get("tab") === "authors" ? "authors" : "books";

  // `replace` (pas `push`) : basculer d'onglet ne doit pas empiler d'entrées
  // d'historique — un clic sur un auteur depuis l'onglet Auteurs, suivi de
  // "Retour", doit ramener directement ici avec le bon onglet sélectionné.
  function setTab(next: Tab) {
    router.replace(next === "books" ? "/library" : "/library?tab=authors");
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <h1 className="font-heading text-2xl text-foreground">Ma bibliothèque</h1>

      <div
        role="tablist"
        aria-label="Vue de la bibliothèque"
        className="inline-flex w-fit rounded-full border border-border bg-card p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-colors",
              tab === t.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "books" ? <BookList /> : <AuthorsList />}
    </div>
  );
}
