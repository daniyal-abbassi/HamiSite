"use client";

import { motion } from "motion/react";

/**
 * Modern White Wave Architecture:
 * A sculptural, fluid multi-layered white wave pattern placed right after the
 * categories section, creating a luxury modern wave transition with crisp white
 * crest lines, subtle pearl translucency, and soft luminous glows.
 */
export function ModernWhiteWave() {
  return (
    <div
      className="relative -mt-4 mb-8 w-full overflow-hidden select-none pointer-events-none"
      aria-hidden="true"
    >
      {/* Soft ambient white glow radiating from behind the waves */}
      <div className="absolute inset-x-0 -top-10 h-32 bg-gradient-to-b from-white/20 via-white/5 to-transparent blur-2xl" />

      {/* SVG Multi-Layered Modern Wave */}
      <svg
        className="relative block w-full h-24 sm:h-32 md:h-44 lg:h-52 drop-shadow-[0_10px_30px_rgba(255,255,255,0.12)]"
        viewBox="0 0 1440 220"
        fill="none"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Wave 1: Soft translucent mist */}
          <linearGradient id="white-wave-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
            <stop offset="40%" stopColor="#FAF8F5" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#ECE4D6" stopOpacity="0.03" />
          </linearGradient>

          {/* Wave 2: Middle pearl ribbon */}
          <linearGradient id="white-wave-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#F5F0E6" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.08" />
          </linearGradient>

          {/* Wave 3: Foreground luminous white wave */}
          <linearGradient id="white-wave-grad-3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#FAF8F5" stopOpacity="0.85" />
            <stop offset="65%" stopColor="#F0ECE9" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.98" />
          </linearGradient>

          {/* Stroke Crest Gradient */}
          <linearGradient id="white-crest-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="45%" stopColor="#FFFDF9" stopOpacity="0.95" />
            <stop offset="75%" stopColor="#E5D3B3" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="white-wave-glow" x="-10%" y="-10%" width="120%" height="130%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Layer 1: Background flowing wave */}
        <path
          d="M0,150 C320,70 540,210 820,130 C1080,60 1280,180 1440,110 L1440,0 L0,0 Z"
          fill="url(#white-wave-grad-1)"
        />

        {/* Layer 2: Mid-ground undulating wave */}
        <path
          d="M0,110 C260,180 560,50 860,120 C1140,180 1320,80 1440,95 L1440,0 L0,0 Z"
          fill="url(#white-wave-grad-2)"
        />

        {/* Layer 3: Foreground crisp white wave */}
        <path
          d="M0,70 C340,140 640,25 940,85 C1200,140 1350,50 1440,60 L1440,0 L0,0 Z"
          fill="url(#white-wave-grad-3)"
          filter="url(#white-wave-glow)"
        />

        {/* Sharp specular crest lines */}
        <path
          d="M0,70 C340,140 640,25 940,85 C1200,140 1350,50 1440,60"
          stroke="url(#white-crest-stroke)"
          strokeWidth="2.5"
          fill="none"
        />

        <path
          d="M0,110 C260,180 560,50 860,120 C1140,180 1320,80 1440,95"
          stroke="rgba(255, 255, 255, 0.6)"
          strokeWidth="1.2"
          strokeDasharray="8 6"
          fill="none"
        />
      </svg>
    </div>
  );
}

