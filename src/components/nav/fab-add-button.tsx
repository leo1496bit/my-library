"use client";

import { Plus } from "lucide-react";
import { useAddBookSheet } from "@/components/add/add-book-context";

export function FabAddButton() {
  const { openSheet } = useAddBookSheet();

  return (
    <button
      type="button"
      onClick={openSheet}
      aria-label="Ajouter un livre"
      className="fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-4 ring-background outline-none transition-transform active:scale-95 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Plus className="size-6" strokeWidth={2.25} />
    </button>
  );
}
