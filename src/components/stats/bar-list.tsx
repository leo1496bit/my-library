import type { CountEntry } from "@/lib/stats";

// Classement à une seule série : la longueur porte la magnitude, une seule
// teinte (le laiton du système), jamais un dégradé arc-en-ciel.
export function BarList({ entries }: { entries: CountEntry[] }) {
  const max = Math.max(1, ...entries.map((e) => e.count));

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Pas encore de données.</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {entries.map((entry) => (
        <li key={entry.key} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-xs text-muted-foreground">
            {entry.label}
          </span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full bg-chart-magnitude"
              style={{ width: `${(entry.count / max) * 100}%` }}
            />
          </span>
          <span className="w-5 shrink-0 text-right text-xs tabular-nums text-foreground">
            {entry.count}
          </span>
        </li>
      ))}
    </ul>
  );
}
