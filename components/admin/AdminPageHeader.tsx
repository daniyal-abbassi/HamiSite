/** Page header for admin surfaces — numbered editorial label (Operate-mode:
 * flat mono eyebrow, no gradient text/eyebrow-pill marketing devices). */
export function AdminPageHeader({ index, eyebrow, title, actions }: { index: string; eyebrow: string; title: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="section-label">
          <span>{index}</span>
          <i />
          <p>{eyebrow}</p>
        </div>
        <h1 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">{title}</h1>
      </div>
      {actions}
    </header>
  );
}