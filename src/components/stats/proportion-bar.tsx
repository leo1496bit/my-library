import type { CountEntry } from "@/lib/stats";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// Répartition catégorielle : barre proportionnelle segmentée + légende avec
// étiquettes directes (jamais la couleur seule pour distinguer les séries).
export function ProportionBar({ entries }: { entries: CountEntry[] }) {
  const total = entries.reduce((sum, e) => sum + e.count, 0);

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">Pas encore de données.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-muted">
        {entries
          .filter((e) => e.count > 0)
          .map((entry, i) => (
            <div
              key={entry.key}
              style={{
                width: `${(entry.count / total) * 100}%`,
                backgroundColor: PALETTE[i % PALETTE.length],
              }}
              title={`${entry.label} : ${entry.count}`}
            />
          ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {entries.map((entry, i) => (
          <li key={entry.key} className="flex items-center gap-1.5 text-xs">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
              aria-hidden
            />
            <span className="truncate text-foreground">{entry.label}</span>
            <span className="ml-auto text-muted-foreground">{entry.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
