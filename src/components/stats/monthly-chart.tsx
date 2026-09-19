import { formatMonthYear } from "@/lib/format";
import type { MonthlyCount } from "@/lib/stats";

export function MonthlyChart({ data }: { data: MonthlyCount[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex items-end gap-1.5" style={{ height: 120 }}>
      {data.map((bucket) => (
        <div key={bucket.key} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {bucket.count > 0 ? bucket.count : ""}
          </span>
          <div className="flex h-full w-full items-end">
            <div
              className="w-full rounded-t-sm bg-chart-magnitude"
              style={{ height: `${Math.max(4, (bucket.count / max) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] whitespace-nowrap text-muted-foreground">
            {formatMonthYear(bucket.date)}
          </span>
        </div>
      ))}
    </div>
  );
}
