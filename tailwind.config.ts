import type { Config } from "tailwindcss";

/**
 * HAMI brand design system v2 — "Two Chapters" (flat wine + paper) retired.
 * Current world, pinned by the user from a supplied reference
 * (aura-landingSample.html): near-black canvas, atmospheric oxblood-ramp
 * glow, muted antique gold, fully rounded glass surfaces. See the direction
 * contract at the top of app/layout.tsx before touching this file.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        border: "rgb(var(--border) / 0.15)",
        input: "rgb(var(--input) / 0.22)",
        ring: "rgb(var(--ring))",
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        // Brand DNA v2 — literal hex so opacity modifiers (bg-oxblood/10) just
        // work. RAL 3004 (oxblood DEFAULT) is preserved as the real brand hue;
        // everything around it (canvas, gold, radius, glass) changed.
        oxblood: {
          DEFAULT: "#640211", // RAL 3004 — unchanged, the one preserved constant
          lite: "#9C0A22",
          mid: "#7D0417",
          deep: "#3A010A",
        },
        gold: {
          DEFAULT: "#C9A227", // muted antique gold — replaces champagne #d4af6a
          lite: "#F0DCA0",
          deep: "#8A6A15",
        },
        ink: {
          DEFAULT: "#0D0406", // near-black canvas
          2: "#160709",
          3: "#1F0A0E",
        },
        success: "#3FBF7F",
        // Matches --line in globals.css — the world's default hairline.
        line: "rgba(242, 244, 237, 0.10)",
      },
      borderRadius: {
        sm: "12px",
        md: "16px",
        lg: "var(--radius)", // 22px, see globals.css
        xl: "28px",
        "2xl": "34px",
      },
      fontFamily: {
        sans: ["var(--font-vazirmatn)", "Tahoma", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      boxShadow: {
        // Ambient shadow for glass/card surfaces on the near-black canvas —
        // replaces the old flat-wine "card"/"seal" pair, which were tuned to
        // a light-maroon background this world no longer has.
        card: "0 8px 30px rgba(0, 0, 0, 0.45)",
        deep: "0 40px 90px rgba(0, 0, 0, 0.6)",
        "glow-oxblood": "0 10px 30px rgba(100, 2, 17, 0.5)",
        "glow-gold": "0 10px 30px rgba(201, 162, 39, 0.32)",
      },
      /* Motion duration tokens — design-system scale (instant/fast/normal/slow).
         Arbitrary durations outside this scale are not allowed. */
      transitionDuration: {
        DEFAULT: "220ms",
        instant: "100ms",
        fast: "150ms",
        normal: "220ms",
        slow: "300ms",
      },
      // Signature motion curve v2 — pinned from the reference world (a fast
      // -out curve with a touch more energy than the old pure ease-out-expo),
      // still the default for every unqualified transition-* utility.
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.2, 0.7, 0.3, 1)",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(26px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        // Slides from the logical end edge to rest — correct for a start-0
        // positioned drawer under RTL (the panel sits at the physical right
        // edge; +100% pushes it further right, fully off-screen).
        "slide-in-end": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        // Floating stat cards — the hero's signature idle motion.
        bob: {
          "50%": { transform: "translateY(-14px)" },
        },
        // Gold gradient sweep for the single-word text-shimmer emphasis.
        shiny: {
          to: { backgroundPosition: "-220% center" },
        },
        // Marquee — content rendered twice in the DOM, translated by exactly
        // half its own (doubled) width for a seamless loop, no JS measuring.
        slide: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(50%)" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "fade-up": "fade-up 0.85s cubic-bezier(0.2, 0.7, 0.3, 1) both",
        "fade-in": "fade-in 300ms cubic-bezier(0.2, 0.7, 0.3, 1) both",
        "slide-in-end": "slide-in-end 300ms cubic-bezier(0.2, 0.7, 0.3, 1) both",
        bob: "bob 7s ease-in-out infinite",
        shiny: "shiny 6s linear infinite",
        slide: "slide 34s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
