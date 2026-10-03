import type { ReactNode } from "react";

/**
 * Partner brand marks for the trust ticker.
 *
 * The four global marks are the official geometry, vendored from
 * `simple-icons` (CC0-1.0, public domain) rather than redrawn by hand — a
 * traced-from-memory Samsung wordmark or Apple silhouette is the kind of detail
 * that reads as counterfeit at exactly the moment a trust bar is meant to be
 * doing the opposite. Each fills with `currentColor`, so the ticker tints them
 * all to one wine with no per-brand overrides.
 *
 * REALME and TCH have no mark here. There is no licensed asset for either in
 * this repo, so instead of inventing a glyph they are set as wordmarks in the
 * site's own type — honest, and visibly the same family as the real marks
 * beside them. Drop a real SVG in and swap the entry when one exists.
 *
 * ## Two things make a row of logos look designed rather than pasted
 *
 * **Tight viewBoxes.** simple-icons ships every mark in a 0 0 24 24 box, but
 * the glyphs do not fill it: Samsung's wordmark occupies y 10.17-13.84 of those
 * 24 units, so rendering that box at 24px tall draws a 3.7px wordmark. Each
 * mark below therefore carries its own measured bounding box as the viewBox,
 * and then height is the only size control needed. The numbers came from
 * `getBBox()` in a browser, not from reading the path by eye.
 *
 * **Optical, not uniform, sizing.** Setting one height for everything is what
 * makes logo strips look broken — a square mark and a 6.5:1 wordmark at the
 * same height have wildly different visual mass. Symbols run ~25px tall,
 * wordmarks ~14-16px, which puts their ink on roughly equal footing. Change one
 * and check it against the row, never on its own.
 */

type Mark = {
  name: string;
  /** Persian name, exposed to assistive tech in place of the silent glyph. */
  label: string;
  node: ReactNode;
};

/** `heightPx` is optical, chosen against the row — see the note above. */
function Glyph({ d, viewBox, heightPx }: { d: string; viewBox: string; heightPx: number }) {
  return (
    <svg
      viewBox={viewBox}
      role="presentation"
      focusable="false"
      fill="currentColor"
      style={{ height: heightPx, width: "auto" }}
    >
      <path d={d} />
    </svg>
  );
}

/** A brand with no licensed mark: its name, set as a wordmark. */
function Wordmark({ children }: { children: string }) {
  return (
    <span className="font-mono text-[0.95rem] font-semibold leading-none tracking-[0.2em]">
      {children}
    </span>
  );
}

const APPLE = "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701";
const SAMSUNG = "M19.8166 10.2808l.0459 2.6934h-.023l-.7793-2.6934h-1.2837v3.3925h.8481l-.0458-2.785h.023l.8366 2.785h1.2264v-3.3925zm-16.149 0l-.6418 3.427h.9284l.4699-3.1175h.0229l.4585 3.1174h.9169l-.6304-3.4269zm5.1805 0l-.424 2.6132h-.023l-.424-2.6132H6.5788l-.0688 3.427h.8596l.023-3.0832h.0114l.573 3.0831h.8711l.5731-3.083h.023l.0228 3.083h.8596l-.0802-3.4269zm-7.2664 2.4527c.0343.0802.0229.1949.0114.2522-.0229.1146-.1031.2292-.3324.2292-.2177 0-.3438-.126-.3438-.3095v-.3323H0v.2636c0 .7679.6074.9971 1.2493.9971.6189 0 1.1346-.2178 1.2149-.7794.0458-.298.0114-.4928 0-.5616-.1605-.722-1.467-.9283-1.5588-1.3295-.0114-.0688-.0114-.1375 0-.1834.023-.1146.1032-.2292.3095-.2292.2063 0 .321.126.321.3095v.2063h.8595v-.2407c0-.745-.6762-.8596-1.1576-.8596-.6074 0-1.1117.2063-1.2034.7564-.023.149-.0344.2866.0114.4585.1376.7106 1.364.9169 1.5358 1.3524m11.152 0c.0343.0803.0228.1834.0114.2522-.023.1146-.1032.2292-.3324.2292-.2178 0-.3438-.126-.3438-.3095v-.3323h-.917v.2636c0 .7564.596.9857 1.2379.9857.6189 0 1.1232-.2063 1.2034-.7794.0459-.298.0115-.4814 0-.5616-.1375-.7106-1.4327-.9284-1.5243-1.318-.0115-.0688-.0115-.1376 0-.1835.0229-.1146.1031-.2292.3094-.2292.1948 0 .321.126.321.3095v.2063h.848v-.2407c0-.745-.6647-.8596-1.146-.8596-.6075 0-1.1004.1948-1.192.7564-.023.149-.023.2866.0114.4585.1376.7106 1.341.9054 1.513 1.3524m2.8882.4585c.2407 0 .3094-.1605.3323-.2522.0115-.0343.0115-.0917.0115-.126v-2.533h.871v2.4642c0 .0688 0 .1948-.0114.2292-.0573.6419-.5616.8482-1.192.8482-.6303 0-1.1346-.2063-1.192-.8482 0-.0344-.0114-.1604-.0114-.2292v-2.4642h.871v2.533c0 .0458 0 .0916.0115.126 0 .0917.0688.2522.3095.2522m7.1518-.0344c.2522 0 .3324-.1605.3553-.2522.0115-.0343.0115-.0917.0115-.126v-.4929h-.3553v-.5043H24v.917c0 .0687 0 .1145-.0115.2292-.0573.6303-.596.8481-1.2034.8481-.6075 0-1.1461-.2178-1.2034-.8481-.0115-.1147-.0115-.1605-.0115-.2293v-1.444c0-.0574.0115-.172.0115-.2293.0802-.6419.596-.8482 1.2034-.8482s1.1347.2063 1.2034.8482c.0115.1031.0115.2292.0115.2292v.1146h-.8596v-.1948s0-.0803-.0115-.1261c-.0114-.0802-.0802-.2521-.3438-.2521-.2521 0-.321.1604-.3438.2521-.0115.0458-.0115.1032-.0115.1605v1.5702c0 .0458 0 .0916.0115.126 0 .0917.0917.2522.3323.2522";
const XIAOMI = "M12 0C8.016 0 4.756.255 2.493 2.516.23 4.776 0 8.033 0 12.012c0 3.98.23 7.235 2.494 9.497C4.757 23.77 8.017 24 12 24c3.983 0 7.243-.23 9.506-2.491C23.77 19.247 24 15.99 24 12.012c0-3.984-.233-7.243-2.502-9.504C19.234.252 15.978 0 12 0zM4.906 7.405h5.624c1.47 0 3.007.068 3.764.827.746.746.827 2.233.83 3.676v4.54a.15.15 0 0 1-.152.147h-1.947a.15.15 0 0 1-.152-.148V11.83c-.002-.806-.048-1.634-.464-2.051-.358-.36-1.026-.441-1.72-.458H7.158a.15.15 0 0 0-.151.147v6.98a.15.15 0 0 1-.152.148H4.906a.15.15 0 0 1-.15-.148V7.554a.15.15 0 0 1 .15-.149zm12.131 0h1.949a.15.15 0 0 1 .15.15v8.892a.15.15 0 0 1-.15.148h-1.949a.15.15 0 0 1-.151-.148V7.554a.15.15 0 0 1 .151-.149zM8.92 10.948h2.046c.083 0 .15.066.15.147v5.352a.15.15 0 0 1-.15.148H8.92a.15.15 0 0 1-.152-.148v-5.352a.15.15 0 0 1 .152-.147Z";
const NOKIA = "M16.59 9.348v5.304h.796V9.348Zm-8.497-.09c-1.55 0-2.752 1.127-2.752 2.742 0 1.687 1.202 2.742 2.752 2.742 1.55 0 2.754-1.055 2.751-2.742a2.72 2.72 0 0 0-2.751-2.742ZM10.05 12c0 1.195-.876 1.987-1.957 1.987-1.082 0-1.958-.792-1.958-1.987 0-1.174.876-1.987 1.958-1.987 1.08 0 1.957.813 1.957 1.987zM0 9.176v5.476h.812v-3.619l4.218 3.79v-1.135zM11.442 12l2.952 2.652h1.184L12.622 12l2.956-2.652h-1.184ZM24 14.652h-.875l-.64-1.175h-2.898l-.64 1.175h-.875l1.06-1.958h2.937l-1.465-2.72.432-.798Z";

/** Order is the reading order of the ticker, repeated to make the loop. */
export const partnerMarks: readonly Mark[] = [
  {
    name: "APPLE",
    label: "اپل",
    node: <Glyph d={APPLE} viewBox="2.22 0 19.55 24" heightPx={26} />,
  },
  {
    name: "SAMSUNG",
    label: "سامسونگ",
    node: <Glyph d={SAMSUNG} viewBox="0 10.17 24 3.67" heightPx={14} />,
  },
  {
    name: "XIAOMI",
    label: "شیائومی",
    node: <Glyph d={XIAOMI} viewBox="0 0 24 24" heightPx={25} />,
  },
  {
    name: "NOKIA",
    label: "نوکیا",
    node: <Glyph d={NOKIA} viewBox="0 9.18 24 5.65" heightPx={16} />,
  },
  { name: "REALME", label: "ریلمی", node: <Wordmark>realme</Wordmark> },
  { name: "TCH", label: "تی‌سی‌اچ", node: <Wordmark>TCH</Wordmark> },
];
