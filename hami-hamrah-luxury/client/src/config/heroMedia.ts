/**
 * Hero media contract.
 *
 * These URLs point at `client/public/manus-storage/`, kept out of the bundle so
 * large video files are served as static assets rather than compiled in.
 *
 * WARNING: none of these three files exist yet — the originals were lost when
 * this app was exported. See `client/public/manus-storage/MISSING-ASSETS.md`.
 * `Home.tsx` imports this contract today, so the hero renders with broken media
 * until they are restored.
 */
export const heroMedia = {
  webm: "/manus-storage/hami-hero_3727dde5.webm",
  mp4: "/manus-storage/hami-hero_f55bb5ef.mp4",
  poster: "/manus-storage/hami-hero-poster_5573451b.webp",
} as const;

export const heroLayerOrder = ["video", "overlay", "webgl", "content"] as const;
