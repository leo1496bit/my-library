import Link from "next/link";
import { BookMarked } from "lucide-react";
import { UserMenu } from "@/components/nav/user-menu";

export function TopBar({ email }: { email: string | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
        <Link href="/library" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <BookMarked className="size-4" strokeWidth={1.75} />
          </span>
          <span className="font-heading text-lg leading-none text-foreground">Ma bibliothèque</span>
        </Link>
        <UserMenu email={email} />
      </div>
    </header>
  );
}
