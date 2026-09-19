export function StatsSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      {subtitle && <p className="mb-2 text-xs text-muted-foreground">{subtitle}</p>}
      <div className={subtitle ? "mt-1" : "mt-3"}>{children}</div>
    </section>
  );
}
