"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface AddBookContextValue {
  open: boolean;
  openSheet: () => void;
  closeSheet: () => void;
  /** Incrémenté à chaque livre ajouté : les pages qui affichent la
   * bibliothèque s'y abonnent pour se rafraîchir. */
  addedTick: number;
  notifyAdded: () => void;
}

const AddBookContext = createContext<AddBookContextValue | null>(null);

export function AddBookProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [addedTick, setAddedTick] = useState(0);

  const openSheet = useCallback(() => setOpen(true), []);
  const closeSheet = useCallback(() => setOpen(false), []);
  const notifyAdded = useCallback(() => setAddedTick((t) => t + 1), []);

  const value = useMemo(
    () => ({ open, openSheet, closeSheet, addedTick, notifyAdded }),
    [open, openSheet, closeSheet, addedTick, notifyAdded],
  );

  return <AddBookContext.Provider value={value}>{children}</AddBookContext.Provider>;
}

export function useAddBookSheet() {
  const ctx = useContext(AddBookContext);
  if (!ctx) throw new Error("useAddBookSheet must be used within AddBookProvider");
  return ctx;
}
