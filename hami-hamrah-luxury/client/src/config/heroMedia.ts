/**
 * Hero media contract — stage one.
 *
 * These URLs intentionally point to the project's persistent media store so
 * large video files are not bundled into the deployable application. No
 * component imports this contract until the video-layer implementation begins.
 */
export const heroMedia = {
  webm: "/manus-storage/hami-hero_3727dde5.webm",
  mp4: "/manus-storage/hami-hero_f55bb5ef.mp4",
  poster: "/manus-storage/hami-hero-poster_5573451b.webp",
} as const;

export const heroLayerOrder = ["video", "overlay", "webgl", "content"] as const;
