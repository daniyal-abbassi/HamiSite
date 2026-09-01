import type { TrustFeatureKey } from "@/lib/content/home";

/** Numbered editorial section label: «۰۰۲ — عنوان بخش» */
export function SectionLabel({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <div className="section-label">
      <span>{index}</span>
      <i />
      <p>{children}</p>
    </div>
  );
}

/** Custom 32×32 stroke glyphs — ported verbatim from the reference TrustGlyph. */
export function TrustGlyph({ name }: { name: TrustFeatureKey }) {
  const shared = { fill: "none", stroke: "currentColor", strokeWidth: 1.45, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "store") return <svg viewBox="0 0 32 32" aria-hidden="true"><path {...shared} d="M5 14.5h22v12H5zM4 9l2-4h20l2 4v4.5H4zM11 26.5v-7h10v7" /><path {...shared} d="M4 9c0 2 1.7 3.5 3.7 3.5S11.5 11 11.5 9c0 2 1.6 3.5 4.5 3.5S20.5 11 20.5 9c0 2 1.8 3.5 3.8 3.5S28 11 28 9" /></svg>;
  if (name === "wholesale") return <svg viewBox="0 0 32 32" aria-hidden="true"><path {...shared} d="m6 10 10-5 10 5-10 5zM6 10v9l10 5 10-5v-9M16 15v9M7 23l5-2.5M25 23l-5-2.5" /></svg>;
  if (name === "assortment") return <svg viewBox="0 0 32 32" aria-hidden="true"><rect {...shared} x="5" y="6" width="9" height="9" rx="1.5" /><rect {...shared} x="18" y="6" width="9" height="9" rx="1.5" /><rect {...shared} x="5" y="19" width="9" height="8" rx="1.5" /><rect {...shared} x="18" y="19" width="9" height="8" rx="1.5" /></svg>;
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path {...shared} d="M16 4.5 25 8v7.2c0 5.7-3.7 10-9 12.3-5.3-2.3-9-6.6-9-12.3V8z" /><path {...shared} d="m11.7 15.8 2.8 2.9 5.9-6" /></svg>;
}
