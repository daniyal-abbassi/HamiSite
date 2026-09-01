import type { Config } from "tailwindcss";

/**
 * HAMI brand design system — ported from
 * docs/inspires/HamiHamrah-DNA-Brand-Color/hami-hamrah-luxury/client/src/index.css
 * («آرشیو بورگوندی شبانه»: بورگوندی RAL 3004 + شامپاینی مات + تایپوگرافی ویرایشی)
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
        // Brand DNA — literal hex so opacity modifiers (bg-wine/10) just work
        wine: {
          DEFAULT: "#640211", // RAL 3004
          dark: "#42040d",
          ink: "#280107",
        },
        champagne: {
          DEFAULT: "#d4af6a",
          light: "#f0d9ab",
        },
        paper: {
          DEFAULT: "#f2f4ed",
          deep: "#e9e2d8",
        },
        "ink-dark": "#281c1d",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-vazirmatn)", "Tahoma", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      boxShadow: {
        seal: "0 18px 36px rgba(48, 29, 19, 0.14)",
        card: "0 1px 2px rgba(40, 1, 7, 0.4), 0 8px 24px rgba(40, 1, 7, 0.25)",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "fade-up": "fade-up 0.5s cubic-bezier(0.23, 1, 0.32, 1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
