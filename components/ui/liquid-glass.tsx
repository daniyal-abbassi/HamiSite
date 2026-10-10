"use client";

import * as React from "react";
import {
  animate,
  frame,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
  type Transition,
} from "motion/react";
import { cn } from "cn";
import { useReducedMotionPreference } from "devignerui/hooks";
import { useControllableState } from "devignerui/hooks";
import {
  EASE_OUT,
  SPRING_GOO,
  SPRING_SWAP,
  TWEEN_MAGNET,
  TWEEN_MAGNET_RELEASE,
} from "devignerui/motion";

/** Height of the closed pill in px. */
const H = 48;
const R = H / 2;
/** Width of the curved bevel along the rim, in px: the band that bends what
 *  is behind the glass. Inside it the glass is flat and clear. */
const BEZEL = R * 0.5;
/** Peak lens shift at the very edge, in px: the rim shows what sits this far
 *  inward, so content bends along the curve. Kept under BEZEL / 1.5 so the
 *  bend squeezes content toward the edge without folding it back, which
 *  tears into jagged blobs. */
const SHIFT = BEZEL * 0.6;
/** How much less green and blue bend than red: the thin rainbow fringe real
 *  glass leaves along its rim. */
const DISPERSION = [1, 0.97, 0.94];
const GLOW =
  "radial-gradient(closest-side, rgb(255 255 255 / 0.55), rgb(255 255 255 / 0.18))";
/** Color matrices keeping only red, only green, only blue. */
const CHANNELS = [
  "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0",
  "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0",
  "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0",
];

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const n = (v: number) => +v.toFixed(2);

/** Corner curves, in CSS's terms: `corner-shape: superellipse(c)` draws
 *  |x|ⁿ + |y|ⁿ = rⁿ with n = 2^c, so 1 is round and 2 is `squircle`. A full
 *  squircle on a pill reads as a rounded box, so the closed pill keeps a
 *  gentle one and the open panel firms up as it swells. */
const PILL_CURVE = 1.1;
const PANEL_CURVE = 1.3;
/** PILL_CURVE on the CSS-drawn parts, round where it is unsupported. */
const PILL_CSS =
  "supports-[corner-shape:superellipse(1.1)]:[corner-shape:superellipse(1.1)]";

/** How far a corner's cubic handles reach toward the corner, as a share of
 *  the radius, so the cubic passes through the curve's midpoint. It strays
 *  under 1% of the radius anywhere else. */
const handle = (c: number) => (0.5 ** (1 / 2 ** c) - 0.5) / 0.375;

/** A rectangle from (0, 0) with superellipse corners of curve c. With the
 *  radius at half the height it is a pill. */
function roundRect(w: number, h: number, r: number, c: number) {
  const k = Math.min(r, w / 2, h / 2);
  const s = k * handle(c);
  const pt = (x: number, y: number) => `${n(x)} ${n(y)}`;
  return (
    `M${pt(k, h)}L${pt(w - k, h)}` +
    `C${pt(w - k + s, h)} ${pt(w, h - k + s)} ${pt(w, h - k)}L${pt(w, k)}` +
    `C${pt(w, k - s)} ${pt(w - k + s, 0)} ${pt(w - k, 0)}L${pt(k, 0)}` +
    `C${pt(k - s, 0)} ${pt(0, k - s)} ${pt(0, k)}L${pt(0, h - k)}` +
    `C${pt(0, h - k + s)} ${pt(k - s, h)} ${pt(k, h)}Z`
  );
}

/** A signed distance field, negative inside. `inner` is a box (x0, x1, y0,
 *  y1 in CSS px) where every point is known to lie deeper than the bevel,
 *  so the lens map can skip it. */
type Field = ((u: number, v: number) => number) & {
  inner?: [number, number, number, number];
};

/** Signed distance to that shape. The corners measure with the n-norm
 *  instead of the round one, so their level lines share the corner's curve
 *  and the lens bends along the real corner. Built once per map: the shape's
 *  constants are worked out up front, and each branch below returns exactly
 *  what the full formula would, just without the powers it doesn't need. */
function rectField(w: number, h: number, r: number, c: number): Field {
  const k = Math.min(r, w / 2, h / 2);
  const e = 2 ** c;
  const ie = 1 / e;
  const hw = w / 2;
  const hh = h / 2;
  const ax = hw - k;
  const ay = hh - k;
  const xs = new Map<number, number>();
  const ys = new Map<number, number>();
  const sd: Field = (px, py) => {
    const qx = Math.abs(px - hw) - ax;
    const qy = Math.abs(py - hh) - ay;
    // Within both straight spans the norm term is exactly 0, so d is just
    // minus the distance to the nearest side.
    if (qx <= 0 && qy <= 0) return Math.max(qx, qy) - k;
    // Along a straight side only one span pokes out, so d depends on that
    // coordinate alone and the same few values recur row after row.
    if (qy <= 0) {
      let d = xs.get(px);
      if (d === undefined) xs.set(px, (d = (qx ** e + 0) ** ie + 0 - k));
      return d;
    }
    if (qx <= 0) {
      let d = ys.get(py);
      if (d === undefined) ys.set(py, (d = (0 + qy ** e) ** ie + 0 - k));
      return d;
    }
    return (qx ** e + qy ** e) ** ie + 0 - k;
  };
  // Where both spans are straight and the sides are more than the bevel
  // away, no pixel can bend. The extra px keeps rounding at its border out.
  const B = BEZEL + 1;
  sd.inner = [
    Math.max(k, B),
    Math.min(w - k, w - B),
    Math.max(k, B),
    Math.min(h - k, h - B),
  ];
  return sd;
}

/** The superellipse-cornered rectangle's shape: the menu's pill and panel. */
function useRectShape(
  w: MotionValue<number>,
  h: MotionValue<number>,
  r: MotionValue<number>,
  c: MotionValue<number>,
): GlassShape {
  const d = useTransform([w, h, r, c], ([a, b, k, e]: number[]) =>
    roundRect(a, b, k, e),
  );
  const field = React.useCallback(
    () => rectField(w.get(), h.get(), r.get(), c.get()),
    [w, h, r, c],
  );
  return React.useMemo(
    () => ({ d, width: w, height: h, field }),
    [d, w, h, field],
  );
}

/** A shape the glass can take: its outline, its size, and a signed distance
 *  field for the lens map, read at paint time. */
interface GlassShape {
  d: MotionValue<string>;
  width: MotionValue<number>;
  height: MotionValue<number>;
  field: () => Field;
}

/** One pixel at rest: r 128 (no x shift), g 0, b 128 (no y shift), a 255,
 *  packed in the platform's byte order for a whole-buffer fill. */
const STILL = new Uint32Array(new Uint8Array([128, 0, 128, 255]).buffer)[0];

/** The canvas a lens map is drawn on, with its context and pixel buffer,
 *  kept from one map to the next: a fresh buffer every frame is over 100 KB
 *  of garbage for a panel. The fill below resets every byte of it. */
interface MapCanvas {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
  img: ImageData | null;
}

/** Displacement map for the lens: red carries the x shift and blue the y
 *  shift, 50% is still. Across the bevel the shift points inward and grows
 *  toward the edge on a convex curve, so the rim bends what is behind it and
 *  the middle stays clear. s is pixels per CSS px. The map starts still,
 *  and the field's inner box, which can't bend, is never visited.
 *  It is drawn in slices: the returned step draws rows until `late()` says
 *  its time is up, and returns true once the map is on the canvas. A sharp
 *  map of a big panel is several frames of work, and in one piece it
 *  blocked the page. Null when there is no canvas context. */
function lensMap(
  target: MapCanvas,
  width: number,
  height: number,
  sd: Field,
  s: number,
): ((late: () => boolean) => boolean) | null {
  const cw = Math.ceil(width * s);
  const ch = Math.ceil(height * s);
  const { canvas } = target;
  // putImageData replaces every pixel, so an unchanged size needs no reset.
  if (canvas.width !== cw) canvas.width = cw;
  if (canvas.height !== ch) canvas.height = ch;
  // Kept in memory, not on the GPU: the map is read back to encode it every
  // frame, and a GPU canvas stalls the main thread on each read.
  target.ctx ??= canvas.getContext("2d", { willReadFrequently: true });
  const ctx = target.ctx;
  if (!ctx) return null;
  if (target.img?.width !== cw || target.img.height !== ch)
    target.img = ctx.createImageData(cw, ch);
  const img = target.img;
  const px = img.data;
  new Uint32Array(px.buffer, px.byteOffset, cw * ch).fill(STILL);
  const [x0, x1, y0, y1] = sd.inner ?? [0, -1, 0, -1];
  const i0 = Math.ceil(x0 * s - 0.5);
  const i1 = Math.floor(x1 * s - 0.5);
  const j0 = Math.ceil(y0 * s - 0.5);
  const j1 = Math.floor(y1 * s - 0.5);
  let j = 0;
  return (late) => {
    for (; j < ch; j++) {
      if (late()) return false;
      row(j);
    }
    ctx.putImageData(img, 0, 0);
    return true;
  };

  function row(j: number) {
    const v = (j + 0.5) / s;
    const skip = j >= j0 && j <= j1 && i1 >= i0;
    for (let i = 0; i < cw; i++) {
      if (skip && i === i0) {
        i = i1;
        continue;
      }
      const u = (i + 0.5) / s;
      const d = sd(u, v);
      if (d < 0 && d > -BEZEL) {
        const gx = sd(u + 0.5, v) - sd(u - 0.5, v);
        const gy = sd(u, v + 0.5) - sd(u, v - 0.5);
        const len = Math.hypot(gx, gy) || 1;
        // Steep at the edge, flat by the inner edge of the bevel: the slope
        // of a rounded glass rim.
        const k = (1 + d / BEZEL) ** 1.5 / 2;
        const o = (j * cw + i) * 4;
        px[o] = 128 - (gx / len) * k * 255;
        px[o + 2] = 128 - (gy / len) * k * 255;
      }
    }
  }
}

/** Runs `work` in slices of idle time until it returns true, handing it a
 *  `late()` that says the slice is used up. A slice is at least 4 ms, so the
 *  map lands even when the page is never idle. */
function inSlices(work: (late: () => boolean) => boolean, then: () => void) {
  const slice = (budget: number) => {
    const end = performance.now() + Math.max(budget, 4);
    if (work(() => performance.now() > end)) then();
    else next();
  };
  const next = () => {
    if (typeof requestIdleCallback === "function")
      requestIdleCallback((idle) => slice(idle.timeRemaining()), {
        timeout: 50,
      });
    else setTimeout(() => slice(8), 0);
  };
  next();
}

/** The lens handing over to the frost as the shape starts to move, and back
 *  once the new map has landed. Short, so the bend is gone before the shape
 *  has moved far from the map it was drawn for. */
const LENS_FADE = { duration: 0.15, ease: EASE_OUT } as const;

/** How far the glass swells under a finger. The release overshoots a
 *  fraction of this, so the wobble stays around a percent. */
const SWELL = 1.04;

/** Elastic press feedback: the glass swells on press, and on release it
 *  springs back past rest once and settles, the way liquid does. kick is the
 *  same release without a press, for keyboard clicks and opening. Bind scale
 *  to the element's style. */
function useJelly(off: boolean) {
  const scale = useMotionValue(1);
  const held = React.useRef(false);

  // Turning off mid-wobble (disabled, reduced motion) drops it at rest.
  React.useEffect(() => {
    if (!off) return;
    held.current = false;
    scale.jump(1);
  }, [off, scale]);

  return React.useMemo(
    () => ({
      scale,
      press() {
        if (off) return;
        held.current = true;
        animate(scale, SWELL, TWEEN_MAGNET);
      },
      release() {
        if (off || !held.current) return;
        held.current = false;
        animate(scale, 1, TWEEN_MAGNET_RELEASE);
      },
      kick() {
        if (off) return;
        held.current = false;
        animate(scale, [SWELL, 1], TWEEN_MAGNET_RELEASE);
      },
    }),
    [off, scale],
  );
}

/** Only Chromium renders an SVG filter inside backdrop-filter. Safari and
 *  Firefox parse it and draw nothing, so they get the frosted glass alone. */
function canRefract() {
  const brands = (
    navigator as Navigator & {
      userAgentData?: { brands?: { brand: string }[] };
    }
  ).userAgentData?.brands;
  return !!brands?.some((b) => b.brand === "Chromium");
}

/** Text arriving on the glass: it starts zoomed in and a little blurred, as
 *  if still under the lens, then settles to size and sharpens. Leaving, it
 *  runs back out the same way. */
function zoomIn(show: boolean, reduced: boolean) {
  return {
    opacity: show ? 1 : 0,
    filter: show || reduced ? "blur(0px)" : "blur(4px)",
    scale: show || reduced ? 1 : 1.55,
  };
}

/** The glass itself, drawn to a shape's outline: the lens that bends the
 *  page behind it, the tint, the rim light and the shadow. children render
 *  inside the glass, clipped to it. It fills its parent, which sets the
 *  height. */
function GlassSurface({
  shape: { d, width, height, field },
  transparency,
  hidden = false,
  children,
}: {
  shape: GlassShape;
  transparency: number;
  /** Hides the glass while its shape still holds a guessed size. */
  hidden?: boolean;
  children?: React.ReactNode;
}) {
  const uid = React.useId().replace(/:/g, "");
  const glass = React.useRef<HTMLDivElement>(null);
  const lenses = React.useRef<(SVGFilterElement | null)[]>([]);
  /** The twin filter the glass shows. */
  const active = React.useRef(0);
  /** A map is between drawing and showing, and another was asked for
   *  meanwhile, drawn from the shape as it is once the first lands. */
  const busy = React.useRef(false);
  const queued = React.useRef(false);
  /** The outline is changing: the lens is faded out for the frost. */
  const moving = React.useRef(false);
  /** The lens layer's opacity, and whether the frost layer shows. */
  const lensFade = useMotionValue(1);
  const lensShown = useTransform(lensFade, (v) =>
    v > 0 ? "visible" : "hidden",
  );
  const frostShown = useMotionValue<"visible" | "hidden">("hidden");
  const map = React.useRef<MapCanvas | null>(null);
  /** Each twin's map, freed once replaced. */
  const urls = React.useRef<string[]>([]);
  const settle = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const [refract, setRefract] = React.useState(false);
  const [solid, setSolid] = React.useState(false);

  React.useEffect(() => {
    setRefract(canRefract());
    // iOS swaps glass for a solid tint under Reduce Transparency; so do we.
    const query = matchMedia("(prefers-reduced-transparency: reduce)");
    const sync = () => setSolid(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const clip = useTransform(d, (v) => `path("${v}")`);

  // Even clear glass softens what is behind it a little; the tint and blur
  // build up toward the fully tinted end.
  const t = solid ? 1 : clamp(transparency, 0, 1);
  const blur = n(lerp(1.6, 10, t * t));
  const tint = `color-mix(in oklab, rgb(var(--background)) ${n(lerp(3, 85, t))}%, transparent)`;
  const lensOn = refract && !solid;

  // The lens is drawn for the shape at rest only. Rebuilding its map every
  // frame of a morph (draw, encode, decode, then the whole filter chain over
  // the glass) cost more than a frame, so while the outline moves the lens
  // fades out over a plain frosted layer, and once it has settled a map is
  // drawn for the new shape and the lens fades back in.
  // The map is written straight to the DOM so a frame never waits on a React
  // render. Chromium decodes a new map after the frame that set it and never
  // repaints the backdrop when it lands, so the glass would keep an old map.
  // Instead the map goes into whichever of two twin filters is idle, and the
  // lens switches to it once the image has decoded. The PNG encodes off the
  // main thread (toBlob), at 2 pixels per CSS px, since the rim squeezes
  // content hard and a coarse map shows its steps.
  // Only one map is ever on its way. A request while one is drawing, encoding
  // or decoding is held and drawn from the shape as it stands when the first
  // lands, so a map that would be replaced before it could show is never
  // drawn at all.
  const paint = React.useCallback(
    function paint() {
      const el = glass.current;
      if (!el) return;
      if (busy.current) {
        queued.current = true;
        return;
      }
      busy.current = true;
      const done = () => {
        busy.current = false;
        if (!queued.current) return;
        queued.current = false;
        paint();
      };
      map.current ??= {
        canvas: document.createElement("canvas"),
        ctx: null,
        img: null,
      };
      const w = Math.max(width.get(), 1);
      const h = Math.max(height.get(), 1);
      const draw = lensMap(map.current, w, h, field(), 2);
      if (!draw) return done();
      const { canvas } = map.current;
      const encode = () =>
        canvas.toBlob((blob) => {
          const i = 1 - active.current;
          const f = lenses.current[i];
          const img = f?.querySelector("feImage");
          // Unmounted meanwhile: nothing to show it on.
          if (!blob || !f || !img || !glass.current) return done();
          const url = URL.createObjectURL(blob);
          const old = urls.current[i];
          urls.current[i] = url;
          f.setAttribute("width", `${w}`);
          f.setAttribute("height", `${h}`);
          img.setAttribute("width", `${w}`);
          img.setAttribute("height", `${h}`);
          img.setAttribute("href", url);
          if (old) URL.revokeObjectURL(old);
          const probe = new Image();
          probe.src = url;
          probe
            .decode()
            .catch(() => undefined)
            .then(() => {
              active.current = i;
              el.style.backdropFilter = `url(#${f.id})`;
              el.style.setProperty("-webkit-backdrop-filter", `url(#${f.id})`);
              // Settled, with no newer map on its way: this one fits, so the
              // lens comes back and the frost goes once it is covered.
              if (!moving.current && !queued.current)
                animate(lensFade, 1, LENS_FADE).then(() => {
                  if (!moving.current) frostShown.set("hidden");
                });
              done();
            });
        });
      // The shape starting to move again makes this map stale before it can
      // show, so it is dropped; the next rest draws a fresh one.
      let dropped = false;
      inSlices(
        (late) => (dropped = moving.current) || draw(late),
        () => (dropped || !glass.current ? done() : encode()),
      );
    },
    [width, height, field, lensFade, frostShown],
  );
  // Every input of the outline fires its own change, several a frame; the
  // scheduler keeps one callback per step, so this runs once per frame.
  const moved = React.useCallback(() => {
    if (!moving.current) {
      moving.current = true;
      frostShown.set("visible");
      animate(lensFade, 0, LENS_FADE);
    }
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      moving.current = false;
      paint();
    }, 120);
  }, [paint, lensFade, frostShown]);
  useMotionValueEvent(d, "change", () => {
    if (lensOn) frame.postRender(moved);
  });
  React.useLayoutEffect(() => {
    if (lensOn) paint();
  }, [lensOn, blur, paint]);
  React.useEffect(
    () => () => {
      clearTimeout(settle.current);
      urls.current.forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );
  // The rim and shadow filters re-render with every frame the outline moves,
  // over their whole filter region, so each region is kept as small as its
  // effect. They used to be a share of the shape (10% round the rims, 50%
  // round the shadow), which on the open panel is mostly empty pixels. Each
  // pad is now the smaller of that share and what the effect reaches: the
  // rims reach at most 1px past the outline (the dilate), the shadow's blur
  // about 3 sigma (27px). On the small closed pill the share is already the
  // smaller one, so it is kept exactly; where it was bigger, it only ever
  // held transparent pixels.
  const rimFilters = React.useRef<(SVGFilterElement | null)[]>([]);
  const shadowFilter = React.useRef<SVGFilterElement | null>(null);
  const region = (pad: (side: number) => number) => {
    const w = width.get();
    const h = height.get();
    const px = pad(w);
    const py = pad(h);
    return { x: -px, y: -py, width: w + 2 * px, height: h + 2 * py };
  };
  const rimPad = (side: number) => Math.min(side * 0.1, 4);
  const shadowPad = (side: number) => Math.min(side * 0.5, 36);
  const fit = (el: SVGFilterElement | null, pad: (side: number) => number) => {
    if (!el) return;
    const r = region(pad);
    el.setAttribute("x", `${r.x}`);
    el.setAttribute("y", `${r.y}`);
    el.setAttribute("width", `${r.width}`);
    el.setAttribute("height", `${r.height}`);
  };
  // Straight to the DOM, in the same frame as the outline they surround.
  const refit = () => {
    rimFilters.current.forEach((el) => fit(el, rimPad));
    fit(shadowFilter.current, shadowPad);
  };
  useMotionValueEvent(width, "change", refit);
  useMotionValueEvent(height, "change", refit);
  const rimRegion = (slot: number) => ({
    ref: (el: SVGFilterElement | null) => {
      rimFilters.current[slot] = el;
    },
    filterUnits: "userSpaceOnUse",
    ...region(rimPad),
  });
  const shadowRegion = {
    ref: shadowFilter,
    filterUnits: "userSpaceOnUse",
    ...region(shadowPad),
  };

  // Frosted glass: the whole look where there is no lens, and what shows
  // through while the lens is faded out.
  const frost = `blur(${blur}px) saturate(1.2)`;

  return (
    <>
      <svg aria-hidden className="pointer-events-none absolute size-0">
        {/* Chromium's lens, twice (see paint): soften the backdrop as the
            tint builds, bend it along the rim by the map, red a little
            further than green and blue so the rim picks up a thin rainbow,
            then recombine the channels. */}
        {[0, 1].map((slot) => (
          <filter
            key={slot}
            ref={(el) => {
              lenses.current[slot] = el;
            }}
            id={`${uid}-lens-${slot}`}
            x="0"
            y="0"
            width={H}
            height={H}
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={blur / 2}
              result="soft"
            />
            <feImage
              x="0"
              y="0"
              width={H}
              height={H}
              preserveAspectRatio="none"
              result="map"
            />
            {DISPERSION.map((k, i) => (
              <React.Fragment key={i}>
                <feDisplacementMap
                  in="soft"
                  in2="map"
                  scale={SHIFT * 2 * k}
                  xChannelSelector="R"
                  yChannelSelector="B"
                />
                <feColorMatrix
                  type="matrix"
                  values={CHANNELS[i]}
                  result={`c${i}`}
                />
              </React.Fragment>
            ))}
            <feBlend in="c0" in2="c1" mode="screen" result="rg" />
            <feBlend in="rg" in2="c2" mode="screen" result="rgb" />
            <feColorMatrix in="rgb" type="saturate" values="1.2" />
            {/* The bend samples the nearest pixel, so a squeezed rim steps
                on 1x screens; a hair of blur melts the steps into a
                smooth curve. */}
            <feGaussianBlur stdDeviation="0.5" />
          </filter>
        ))}
      </svg>

      {/* Every layer is as wide as the drawn shape, which can run past the
          layout box: a backdrop filter only reaches as far as its own
          element. Chromium aliases the prefixed backdrop property, so both
          carry one value. */}
      {lensOn && (
        <>
          {/* The frost the lens fades over while the shape moves; hidden at
              rest, so it costs nothing then. */}
          <motion.div
            aria-hidden
            className="absolute top-0 left-0 h-full"
            style={{
              width,
              clipPath: clip,
              WebkitClipPath: clip,
              backdropFilter: frost,
              WebkitBackdropFilter: frost,
              visibility: hidden ? "hidden" : frostShown,
            }}
          />
          {/* The lens; paint owns its backdrop filter. */}
          <motion.div
            ref={glass}
            aria-hidden
            className="absolute top-0 left-0 h-full"
            style={{
              width,
              clipPath: clip,
              WebkitClipPath: clip,
              opacity: lensFade,
              visibility: hidden ? "hidden" : lensShown,
            }}
          />
        </>
      )}
      <motion.div
        aria-hidden
        className={cn("absolute top-0 left-0 h-full", hidden && "invisible")}
        style={{
          width,
          clipPath: clip,
          WebkitClipPath: clip,
          background: tint,
          backdropFilter: lensOn ? undefined : frost,
          WebkitBackdropFilter: lensOn ? undefined : frost,
        }}
      >
        {children}
      </motion.div>

      <motion.svg
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-0 left-0 h-full overflow-visible",
          hidden && "invisible",
        )}
        style={{ width }}
      >
        <defs>
          <mask
            id={`${uid}-out`}
            maskUnits="userSpaceOnUse"
            x={-40}
            y={-40}
            width={4000}
            height={4000}
          >
            <rect x={-40} y={-40} width={4000} height={4000} fill="white" />
            <motion.path d={d} fill="black" />
          </mask>
          {/* Rims cut from the filled outline with morphology, so they
              follow the shape exactly as it morphs. */}
          <filter id={`${uid}-rim-in`} {...rimRegion(0)}>
            <feMorphology
              in="SourceAlpha"
              operator="erode"
              radius="1.25"
              result="core"
            />
            <feComposite in="SourceGraphic" in2="core" operator="out" />
          </filter>
          <filter id={`${uid}-rim-out`} {...rimRegion(1)}>
            <feMorphology
              in="SourceGraphic"
              operator="dilate"
              radius="1"
              result="grown"
            />
            <feComposite in="grown" in2="SourceGraphic" operator="out" />
          </filter>
          {/* Soft glow just inside the edge: the thickness of the rim
              catching light. */}
          <filter id={`${uid}-rim-glow`} {...rimRegion(2)}>
            <feMorphology
              in="SourceAlpha"
              operator="erode"
              radius="3"
              result="core"
            />
            <feGaussianBlur in="core" stdDeviation="3" result="soft" />
            <feComposite in="SourceGraphic" in2="soft" operator="out" />
          </filter>
          {/* Light from the top left: bright there, a second glint at the
              bottom right where it leaves the glass, dim between. */}
          <linearGradient id={`${uid}-spec`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="white" stopOpacity="1" />
            <stop offset="0.32" stopColor="white" stopOpacity="0.28" />
            <stop offset="0.68" stopColor="white" stopOpacity="0.28" />
            <stop offset="1" stopColor="white" stopOpacity="0.85" />
          </linearGradient>
          <mask
            id={`${uid}-spec-mask`}
            maskContentUnits="objectBoundingBox"
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
          >
            <rect width="1" height="1" fill={`url(#${uid}-spec)`} />
          </mask>
          <filter id={`${uid}-soft`} {...shadowRegion}>
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>
        {/* Shadow, kept outside the glass so it never muddies it. Black and
            white are light, not theme: a shadow is dark and a glint is
            bright in either theme. The mask sits on a group around the
            offset: a mask on the moved path would move with it and cut a
            shifted hole, leaking shadow into the glass. */}
        <g mask={`url(#${uid}-out)`}>
          <motion.path
            d={d}
            fill="black"
            opacity={0.12}
            transform="translate(0 6)"
            filter={`url(#${uid}-soft)`}
          />
        </g>
        {/* A faint dark line just outside the rim, so the edge holds on
            light backgrounds. Filled opaque so the cut is clean; the
            element's opacity sets the strength. */}
        <motion.path
          d={d}
          fill="rgb(var(--foreground))"
          opacity={0.08}
          filter={`url(#${uid}-rim-out)`}
        />
        <motion.path
          d={d}
          fill="white"
          opacity={0.35}
          filter={`url(#${uid}-rim-glow)`}
          mask={`url(#${uid}-spec-mask)`}
        />
        {/* The crisp specular line along the edge. */}
        <motion.path
          d={d}
          fill="white"
          filter={`url(#${uid}-rim-in)`}
          mask={`url(#${uid}-spec-mask)`}
        />
      </motion.svg>
    </>
  );
}

/** React's drag and animation handlers collide with Motion's own. */
type DivProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
>;

/** Height of one menu row, the panel's inset around the rows, and the
 *  corner radius the pill opens up to. */
const ROW = 44;
const INSET = 8;
const PANEL_R = 40;

export interface GlassMenuItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface GlassMenuProps extends Omit<DivProps, "onSelect"> {
  items: GlassMenuItem[];
  /** Fires with the picked item's id, then the panel melts back. */
  onSelect?: (id: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Text on the closed pill, and the menu's accessible name. */
  label?: string;
  /** Optional icon in place of the closed pill's visible text. */
  triggerIcon?: React.ReactNode;
  /** Grow below the trigger when it sits near the top edge of the page. */
  expandDirection?: "center" | "down";
  /** 0 is ultra clear glass, 1 fully tinted, like the iOS 27 setting. */
  transparency?: number;
  disabled?: boolean;
}

/** A Liquid Glass pill that swells into a squircle panel of menu rows. The
 *  pill's text zooms out of the way and the rows zoom in behind it. */
export function GlassMenu({
  items,
  onSelect,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  label = "Menu",
  triggerIcon,
  expandDirection = "center",
  transparency = 0.05,
  disabled = false,
  className,
  style,
  onKeyDown,
  ...rest
}: GlassMenuProps) {
  const [openState, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onValueChange: onOpenChange,
  });
  const open = openState && !disabled;
  const reduced = useReducedMotionPreference();
  const menuId = React.useId();
  const root = React.useRef<HTMLDivElement>(null);
  const jelly = useJelly(disabled || reduced);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const text = React.useRef<HTMLSpanElement>(null);
  const list = React.useRef<HTMLDivElement>(null);
  const rows = React.useRef<(HTMLButtonElement | null)[]>([]);
  /** Where focus goes once the next open or close has rendered. */
  const focusNext = React.useRef<"first" | "trigger" | null>(null);
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const iconOnly = triggerIcon != null;
  // A guess until the first measurement. The server can't measure, so the
  // glass stays hidden until then instead of drawing the guess.
  const [size, setSize] = React.useState({
    pill: iconOnly ? H : 112,
    w: 180,
    h: 200,
    measured: false,
  });

  // The pill fits its text and the panel fits its rows, re-measured when
  // fonts land or the content changes.
  React.useLayoutEffect(() => {
    const t = text.current;
    const l = list.current;
    if (!t || !l) return;
    const measure = () => {
      const pill = iconOnly ? H : Math.max(H, Math.ceil(t.offsetWidth) + 56);
      setSize({
        pill,
        w: Math.max(pill, Math.ceil(l.offsetWidth)),
        h: Math.max(H, Math.ceil(l.offsetHeight)),
        measured: true,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(t);
    ro.observe(l);
    return () => ro.disconnect();
  }, [iconOnly]);

  const w = useMotionValue(open ? size.w : size.pill);
  const h = useMotionValue(open ? size.h : H);
  const r = useMotionValue(open ? PANEL_R : R);
  // The panel swells out from the pill's center, as far each way, so the
  // pill's text and the rows stay put while the glass grows around them.
  const left = useTransform(w, (v) => (size.pill - v) / 2);
  const top = useTransform(h, (v) =>
    expandDirection === "down" ? 0 : (H - v) / 2,
  );
  const rowsLeft = useTransform(w, (v) => (v - size.w) / 2);
  const rowsTop = useTransform(h, (v) => (v - size.h) / 2);
  // The corners firm up from pill to squircle as the radius opens.
  const curve = useTransform(r, [R, PANEL_R], [PILL_CURVE, PANEL_CURVE]);
  const shape = useRectShape(w, h, r, curve);
  const clip = useTransform(shape.d, (v) => `path("${v}")`);

  // Only opening and closing spring. A new measurement (the first one on
  // mount, fonts landing, a new label) snaps into place before the frame is
  // painted; springing it, the pill would visibly shrink from the size
  // guessed before measuring.
  const wasOpen = React.useRef(open);
  React.useLayoutEffect(() => {
    const toggled = wasOpen.current !== open;
    wasOpen.current = open;
    const go = (mv: MotionValue<number>, target: number, t: Transition) => {
      if (reduced || !toggled) mv.jump(target);
      else animate(mv, target, t);
    };
    if (open) {
      if (toggled) jelly.kick();
      go(w, size.w, SPRING_GOO);
      go(h, size.h, { ...SPRING_GOO, delay: 0.03 });
      go(r, PANEL_R, SPRING_GOO);
    } else {
      go(h, H, SPRING_GOO);
      go(w, size.pill, { ...SPRING_GOO, delay: 0.04 });
      go(r, R, SPRING_GOO);
    }
  }, [open, size, reduced, w, h, r, jelly]);

  // Otherwise re-enabling reopens a panel the user never asked for.
  React.useEffect(() => {
    if (disabled && openState) setOpen(false);
  }, [disabled]);

  React.useEffect(() => {
    const next = focusNext.current;
    focusNext.current = null;
    if (next === "first" && open)
      rows.current.find((el) => el && !el.disabled)?.focus();
    if (next === "trigger" && !open) trigger.current?.focus();
    setHovered(false);
  }, [open]);

  // A press anywhere outside closes the panel, like any menu.
  React.useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const close = () => {
    focusNext.current = "trigger";
    setOpen(false);
  };

  // Arrow keys walk the rows, wrapping at the ends; Escape and Tab close.
  const onMenuKey = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key === "Tab") {
      setOpen(false);
      return;
    }
    const live = rows.current.filter(
      (el): el is HTMLButtonElement => !!el && !el.disabled,
    );
    const at = live.indexOf(document.activeElement as HTMLButtonElement);
    const move: Record<string, number> = {
      ArrowDown: at + 1,
      ArrowUp: at - 1,
      Home: 0,
      End: live.length - 1,
    };
    if (!(e.key in move) || !live.length) return;
    e.preventDefault();
    live[(move[e.key] + live.length) % live.length]?.focus();
  };

  return (
    <motion.div
      {...rest}
      ref={root}
      onPointerDown={(e) => {
        rest.onPointerDown?.(e);
        if (disabled || open) return;
        setPressed(true);
        jelly.press();
      }}
      onPointerUp={(e) => {
        rest.onPointerUp?.(e);
        setPressed(false);
        jelly.release();
      }}
      onPointerCancel={(e) => {
        rest.onPointerCancel?.(e);
        setPressed(false);
        jelly.release();
      }}
      onPointerLeave={(e) => {
        rest.onPointerLeave?.(e);
        setPressed(false);
        jelly.release();
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        onMenuKey(e);
      }}
      className={cn(
        "relative z-10 inline-block h-12 shrink-0 align-middle text-[15px] whitespace-nowrap select-none",
        className,
      )}
      style={{ ...style, width: size.pill, scale: jelly.scale }}
    >
      <motion.div
        className="absolute"
        style={{ left, top, width: w, height: h }}
      >
        <GlassSurface
          shape={shape}
          transparency={transparency}
          hidden={!size.measured}
        >
          {/* Pressed, the glass lights up from inside. White is light, not
              a theme color. */}
          <motion.div
            className="absolute inset-0"
            style={{ background: GLOW }}
            initial={false}
            animate={{
              opacity: !hovered || open || disabled ? 0 : pressed ? 1 : 0.35,
            }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
          />
        </GlassSurface>

        {/* The rows, clipped to the glass so they surface inside it as it
            grows. */}
        <motion.div
          className="absolute inset-0"
          style={{ clipPath: clip, WebkitClipPath: clip }}
        >
          <motion.div
            ref={list}
            id={menuId}
            role="menu"
            aria-label={label}
            inert={!open}
            className="absolute flex w-max flex-col"
            style={{
              left: rowsLeft,
              top: rowsTop,
              minWidth: size.pill,
              padding: INSET,
            }}
          >
            {items.map((item, i) => (
              <motion.button
                key={item.id}
                ref={(el) => {
                  rows.current[i] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                disabled={item.disabled}
                onClick={() => {
                  onSelect?.(item.id);
                  close();
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-3.5 rounded-[22px] pr-6 pl-4 font-medium text-foreground outline-none hover:bg-foreground/6 focus-visible:bg-foreground/8 disabled:cursor-not-allowed disabled:opacity-50",
                  PILL_CSS,
                )}
                style={{ height: ROW }}
                initial={false}
                animate={zoomIn(open, reduced)}
                transition={{
                  ...SPRING_SWAP,
                  delay: open ? 0.06 + i * 0.035 : 0,
                }}
              >
                {item.icon && (
                  <span aria-hidden className="grid size-6 place-items-center">
                    {item.icon}
                  </span>
                )}
                {item.label}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.span
        ref={text}
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 left-1/2 -translate-1/2 font-semibold text-foreground",
          disabled && "opacity-50",
        )}
        initial={false}
        animate={zoomIn(!open, reduced)}
        transition={{ ...SPRING_SWAP, delay: open ? 0 : 0.08 }}
      >
        {triggerIcon ?? label}
      </motion.span>

      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        tabIndex={open ? -1 : undefined}
        disabled={disabled}
        onClick={() => {
          focusNext.current = "first";
          setOpen(true);
        }}
        onPointerEnter={() => !disabled && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        className={cn(
          "absolute inset-0 cursor-pointer rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed",
          PILL_CSS,
          open && "pointer-events-none",
        )}
      />
    </motion.div>
  );
}
