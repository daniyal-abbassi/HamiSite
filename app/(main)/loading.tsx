export default function MainLoading() {
  return (
    <div className="w-full min-h-[70vh] px-4 py-8 max-w-7xl mx-auto space-y-8 animate-pulse">
      {/* Hero skeleton */}
      <div className="h-64 sm:h-96 rounded-3xl bg-surface/40 border border-foreground/5 relative overflow-hidden flex flex-col justify-end p-6 sm:p-10 space-y-4">
        <div className="h-4 w-32 rounded-full bg-foreground/10" />
        <div className="h-8 sm:h-12 w-2/3 rounded-xl bg-foreground/15" />
        <div className="h-4 w-1/2 rounded-lg bg-foreground/10" />
        <div className="flex gap-3 pt-2">
          <div className="h-10 w-28 rounded-full bg-primary/30" />
          <div className="h-10 w-28 rounded-full bg-foreground/10" />
        </div>
      </div>

      {/* Product rail skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-6 w-40 rounded-lg bg-foreground/15" />
          <div className="h-4 w-20 rounded-md bg-foreground/10" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-2xl bg-surface/30 border border-foreground/5 p-4 flex flex-col justify-between space-y-3"
            >
              <div className="h-40 rounded-xl bg-foreground/10 w-full" />
              <div className="space-y-2">
                <div className="h-4 w-3/4 rounded bg-foreground/15" />
                <div className="h-3 w-1/2 rounded bg-foreground/10" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 w-16 rounded bg-primary/30" />
                <div className="h-8 w-8 rounded-full bg-foreground/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

