"use client";

import { useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { JourneyScene } from "./worlds";
import { journey, setWorld, onWorldChange, getQuality, WORLD_BG, type WorldKey } from "./journey-state";

/** Clear the whole canvas once per frame (the View system disables auto render). */
function FrameClear() {
  useFrame(({ gl }) => {
    gl.setScissorTest(false);
    gl.clear(true, true, false);
  }, -100);
  return null;
}

/** Maps scroll position to the active world + progress. */
function useJourneyTracker() {
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const vh = window.innerHeight;
      journey.vh = vh;
      const doc = document.documentElement;
      journey.scroll = doc.scrollTop / Math.max(1, doc.scrollHeight - vh);
      const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-world]"));
      const focus = vh * 0.45;
      let best: { w: WorldKey; p: number; dist: number } | null = null;
      for (const s of sections) {
        const r = s.getBoundingClientRect();
        const inside = r.top <= focus && r.bottom >= focus;
        const dist = inside ? 0 : Math.min(Math.abs(r.top - focus), Math.abs(r.bottom - focus));
        if (!best || dist < best.dist) {
          const p = Math.min(1, Math.max(0, (focus - r.top) / Math.max(1, r.height)));
          best = { w: s.dataset.world as WorldKey, p, dist };
        }
      }
      if (best) setWorld(best.w, best.p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    const onPointer = (e: PointerEvent) => {
      journey.px = (e.clientX / window.innerWidth) * 2 - 1;
      journey.py = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      journey.px = Math.max(-1, Math.min(1, e.gamma / 30));
      journey.py = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("deviceorientation", onOrient);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onOrient);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

/** DOM gradient backdrop that morphs with the active world. */
function WorldBackdrop() {
  const [world, setW] = useState<WorldKey>("hero");
  useEffect(() => onWorldChange(setW), []);
  const c = WORLD_BG[world];
  return (
    <div
      aria-hidden
      className="world-backdrop fixed inset-0 z-0"
      style={{ "--w-a": c.a, "--w-b": c.b, "--w-c": c.c } as React.CSSProperties}
    >
      <div className="world-backdrop-accent absolute inset-0 opacity-70" />
      <div
        className="absolute inset-0 mix-blend-overlay opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='0.8'/></svg>\")",
        }}
      />
    </div>
  );
}

export default function JourneyCanvas() {
  useJourneyTracker();
  const q = getQuality();
  return (
    <>
      <WorldBackdrop />
      {/* Journey world tracked to the full viewport */}
      <View index={1} className="pointer-events-none fixed inset-0 z-0">
        <JourneyScene />
      </View>
      <Canvas
        dpr={q.dpr}
        gl={{ alpha: true, antialias: !q.low, powerPreference: "high-performance", stencil: false }}
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 1, pointerEvents: "none" }}
        camera={{ position: [0, 0, 8], fov: 36 }}
        frameloop="always"
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <FrameClear />
        <View.Port />
      </Canvas>
    </>
  );
}
