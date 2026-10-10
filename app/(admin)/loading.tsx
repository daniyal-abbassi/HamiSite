export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-foreground/10" />
        <div className="h-7 w-48 rounded bg-foreground/15" />
      </div>

      {/* Action bar / filters skeleton */}
      <div className="flex justify-between items-center gap-3">
        <div className="h-9 w-64 rounded-xl bg-foreground/10" />
        <div className="h-9 w-32 rounded-xl bg-primary/20" />
      </div>

      {/* Content list or table skeleton */}
      <div className="rounded-2xl border border-foreground/10 bg-surface/30 p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-foreground/5 border border-foreground/5 flex items-center justify-between px-4"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-foreground/10" />
              <div className="space-y-1.5">
                <div className="h-4 w-36 rounded bg-foreground/15" />
                <div className="h-3 w-24 rounded bg-foreground/10" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-16 rounded-lg bg-foreground/10" />
              <div className="h-8 w-8 rounded-lg bg-foreground/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

