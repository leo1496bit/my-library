"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Repeat2, BarChart3, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/library", label: "Bibliothèque", icon: BookOpen },
  { href: "/loans", label: "Prêts", icon: Repeat2 },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/recommendations", label: "Idées", icon: Sparkles },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-card/80"
      aria-label="Navigation principale"
    >
      <div className="mx-auto flex max-w-xl items-stretch justify-around">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]"
            >
              <Icon
                className={cn(
                  "size-5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
                strokeWidth={active ? 2.25 : 1.75}
              />
              <span
                className={cn(
                  "transition-colors",
                  active ? "font-medium text-primary" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
              <span
                className={cn(
                  "h-0.5 w-6 rounded-full transition-colors",
                  active ? "bg-accent" : "bg-transparent",
                )}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
