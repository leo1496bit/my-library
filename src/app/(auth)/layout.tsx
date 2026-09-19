import { BookMarked } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <span className="flex size-11 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent">
          <BookMarked className="size-5" strokeWidth={1.75} />
        </span>
        <h1 className="font-heading text-2xl text-foreground">Ma bibliothèque</h1>
        <p className="max-w-[26ch] text-sm text-muted-foreground">
          Votre collection, vos prêts et vos statistiques de lecture, au même endroit.
        </p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
