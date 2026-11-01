"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

/* Two cuts of the same film. The wide one scales a 1920px-wide composition down
   to roughly a phone's width, which leaves the tagline under about 11px; the
   stacked cut carries the same copy at twice that size. */
const WIDE = {
  src: "/videos/banner.mp4",
  poster: "/videos/banner-poster.webp",
  width: 1920,
  height: 1080,
};

const STACKED = {
  src: "/videos/banner-portrait.mp4",
  poster: "/videos/banner-portrait-poster.webp",
  width: 1080,
  height: 1350,
};

/* Matches the breakpoint the frame's aspect-ratio flips on in home.css. */
const NARROW = "(max-width: 767px)";
const CALM = "(prefers-reduced-motion: reduce)";

/* The film runs only while it is on screen. That keeps the homepage's byte and
   CPU budget intact for a section that sits below the fold, and it leaves every
   capture taken further up the page on a still poster instead of a frame that
   lands differently on each run. */
export function BrandFilm() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const heldByReader = useRef(false);
  const onScreen = useRef(false);
  const [clip, setClip] = useState(WIDE);
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    const narrow = window.matchMedia(NARROW);
    const pick = () => setClip(narrow.matches ? STACKED : WIDE);
    pick();
    narrow.addEventListener("change", pick);
    return () => narrow.removeEventListener("change", pick);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // React does not always land `muted` on the element itself, and an unmuted
    // video is not allowed to start on its own.
    video.muted = true;

    // WCAG 2.2.2: moving content that outlasts five seconds must not start by
    // itself for a reader who asked for less motion. The poster stands in.
    if (window.matchMedia(CALM).matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen.current = entry.isIntersecting;
        if (entry.isIntersecting && !heldByReader.current) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  // Crossing the breakpoint swaps the file, which resets the element. Pick the
  // film back up if the reader is still looking at it — a rotated phone would
  // otherwise be left on a still frame.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onScreen.current || heldByReader.current) return;
    if (window.matchMedia(CALM).matches) return;
    void video.play().catch(() => {});
  }, [clip]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      heldByReader.current = false;
      void video.play().catch(() => {});
    } else {
      heldByReader.current = true;
      video.pause();
    }
  };

  return (
    <section
      id="brand-film"
      className="brand-film home-section-ground home-section-ground--dark"
      aria-labelledby="brand-film-title"
    >
      <h2 id="brand-film-title" className="sr-only">
        معرفی حامی همراه
      </h2>

      <div className="brand-film__frame">
        <video
          ref={videoRef}
          className="brand-film__video"
          src={clip.src}
          poster={clip.poster}
          width={clip.width}
          height={clip.height}
          muted
          loop
          playsInline
          preload="none"
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
        />

        <button type="button" className="brand-film__toggle" onClick={toggle}>
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          <span className="sr-only">{paused ? "پخش ویدیوی معرفی" : "توقف ویدیوی معرفی"}</span>
        </button>
      </div>
    </section>
  );
}
