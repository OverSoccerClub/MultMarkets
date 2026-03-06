// tailwind.config.js — MultMarkets Design System
// Prediction Market Platform — Dark-First Fintech/Web3 Design System

const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      // ── COLORS ─────────────────────────────────────────────────
      colors: {
        bg: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
          elevated: "var(--bg-elevated)",
          overlay: "var(--bg-overlay)",
          subtle: "var(--bg-subtle)",
          invert: "var(--bg-invert)",
        },
        border: {
          DEFAULT: "var(--border-default)",
          muted: "var(--border-muted)",
          strong: "var(--border-strong)",
          accent: "var(--border-accent)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          disabled: "var(--text-disabled)",
          inverse: "var(--text-inverse)",
          accent: "var(--text-accent)",
        },
        accent: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10B981", // Emerald Elite
          600: "#059669",
          700: "#047857",
          800: "#065F46", // Deep Forest
          900: "#064E3B",
          DEFAULT: "#10B981",
          chumbo: "#1a1a1a", // Lead Gray
        },
        yes: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          neon: "#00e87a",
          DEFAULT: "#10b981",
        },
        no: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          coral: "#ff6b7a",
          DEFAULT: "#f43f5e",
        },
        warn: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          gold: "#ffca28",
          DEFAULT: "#f59e0b",
        },
        neutral: {
          0: "#ffffff",
          50: "#f8fafc",
          100: "#f1f5f9",
          150: "#e9eef6",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          750: "#283446",
          800: "#1e293b",
          850: "#172032",
          900: "#0f172a",
          925: "#0b1222",
          950: "#07090f",
        },
        chart: {
          blue: "#0099ff",
          green: "#00e87a",
          red: "#f43f5e",
          amber: "#f59e0b",
          purple: "#a855f7",
          teal: "#14b8a6",
          pink: "#ec4899",
          indigo: "#6366f1",
        },
      },

      // ── TYPOGRAPHY ──────────────────────────────────────────────
      fontFamily: {
        sans: ["var(--font-sans)", "Manrope", ...fontFamily.sans],
        display: ["var(--font-display)", "Manrope", ...fontFamily.sans],
        mono: ["var(--font-mono)", "JetBrains Mono", ...fontFamily.mono],
      },

      fontSize: {
        // Headings (using Manrope with refined tracking)
        h1: ["2.25rem", { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "800" }],
        h2: ["1.875rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" }],
        h3: ["1.5rem", { lineHeight: "1.2", letterSpacing: "-0.015em", fontWeight: "700" }],
        h4: ["1.25rem", { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "600" }],
        h5: ["1.125rem", { lineHeight: "1.3", letterSpacing: "0", fontWeight: "600" }],
        h6: ["1rem", { lineHeight: "1.4", letterSpacing: "0", fontWeight: "600" }],
        // Body
        "body-lg": ["1rem", { lineHeight: "1.75", fontWeight: "400" }],
        "body-md": ["0.9375rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["0.875rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-xs": ["0.8125rem", { lineHeight: "1.5", fontWeight: "400" }],
        // Labels
        label: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.04em", fontWeight: "500" }],
        tiny: ["0.6875rem", { lineHeight: "1.4", letterSpacing: "0.06em", fontWeight: "500" }],
        micro: ["0.625rem", { lineHeight: "1.4", letterSpacing: "0.08em", fontWeight: "600" }],
        // Numeric / Odds (tabular)
        "num-xl": ["2rem", { lineHeight: "1", fontWeight: "700" }],
        "num-lg": ["1.5rem", { lineHeight: "1", fontWeight: "700" }],
        "num-md": ["1.25rem", { lineHeight: "1.2", fontWeight: "600" }],
        "num-sm": ["1rem", { lineHeight: "1.2", fontWeight: "600" }],
      },

      // ── SPACING (4px grid) ──────────────────────────────────────
      spacing: {
        px: "1px",
        0: "0px", 0.5: "2px",
        1: "4px", 1.5: "6px",
        2: "8px", 2.5: "10px",
        3: "12px", 3.5: "14px",
        4: "16px", 5: "20px",
        6: "24px", 7: "28px",
        8: "32px", 9: "36px",
        10: "40px", 11: "44px",
        12: "48px", 14: "56px",
        16: "64px", 18: "72px",
        20: "80px", 24: "96px",
        28: "112px", 32: "128px",
        36: "144px", 40: "160px",
        48: "192px", 56: "224px",
        64: "256px",
      },

      // ── BORDER RADIUS ───────────────────────────────────────────
      borderRadius: {
        none: "0px",
        xs: "2px",
        sm: "4px",
        md: "6px",
        DEFAULT: "8px",
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "24px",
        full: "9999px",
      },

      // ── SHADOWS ─────────────────────────────────────────────────
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.3)",
        sm: "0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.4)",
        md: "0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.4)",
        lg: "0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -4px rgba(0,0,0,0.4)",
        xl: "0 20px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.4)",
        "2xl": "0 25px 50px -12px rgba(0,0,0,0.65)",
        "glow-accent": "0 0 25px 0 rgba(16, 185, 129, 0.3), 0 0 50px -10px rgba(6, 95, 70, 0.2)",
        "glow-yes": "0 0 25px 0 rgba(16, 185, 129, 0.35), 0 0 50px -10px rgba(0, 232, 122, 0.25)",
        "glow-no": "0 0 25px 0 rgba(244, 63, 94, 0.35), 0 0 50px -10px rgba(255, 107, 122, 0.25)",
        "glow-warn": "0 0 25px 0 rgba(245, 158, 11, 0.3)",
        "glow-elite": "0 0 60px -15px rgba(16, 185, 129, 0.4), 0 0 100px -30px rgba(6, 78, 59, 0.2)",
        "inner-surface": "inset 0 1px 0 0 rgba(255,255,255,0.08)",
        none: "none",
      },

      // ── ANIMATIONS ──────────────────────────────────────────────
      keyframes: {
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "slide-up": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "scale-in": { "0%": { opacity: "0", transform: "scale(0.95)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        "shimmer": { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        "pulse-glow": { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.5" } },
        "ticker-up": { "0%": { opacity: "0", transform: "translateY(6px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "orb-loop": { "0%, 100%": { transform: "translate(0, 0) scale(1)" }, "33%": { transform: "translate(30px, -50px) scale(1.1)" }, "66%": { transform: "translate(-20px, 20px) scale(0.9)" } },
      },
      animation: {
        "fade-in": "fade-in 400ms cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-up": "slide-up 500ms cubic-bezier(0.4, 0, 0.2, 1)",
        "scale-in": "scale-in 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        "shimmer": "shimmer 3s linear infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "ticker-up": "ticker-up 200ms ease-out",
        "orb-float": "orb-loop 12s ease-in-out infinite",
      },

      // ── Z-INDEX ─────────────────────────────────────────────────
      zIndex: {
        base: "0",
        docked: "10",
        dropdown: "1000",
        sticky: "1100",
        overlay: "1300",
        modal: "1400",
        popover: "1500",
        toast: "1700",
        tooltip: "1800",
      },

      // ── SCREENS ─────────────────────────────────────────────────
      screens: {
        xs: "375px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1440px",
        "3xl": "1920px",
      },
    },
  },

  plugins: [
    function ({ addComponents, addUtilities, theme }) {
      addComponents({
        ".market-card": {
          backgroundColor: "rgba(10,10,10,0.4)",
          backdropFilter: "blur(16px)",
          borderRadius: theme("borderRadius.2xl"),
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
          transition: "all 400ms cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: "0",
            background: "linear-gradient(135deg, rgba(255,255,255,0.05), transparent)",
            opacity: "0",
            transition: "opacity 400ms ease",
          },
          "&:hover": {
            boxShadow: theme("boxShadow.xl"),
            borderColor: "rgba(255,255,255,0.12)",
            transform: "translateY(-4px) scale(1.01)",
            "&::before": { opacity: "1" },
          },
        },
        ".btn-yes": {
          backgroundColor: "rgba(16,185,129,0.08)",
          color: theme("colors.yes.400"),
          border: "1px solid rgba(16,185,129,0.2)",
          fontWeight: "600",
          borderRadius: theme("borderRadius.xl"),
          transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          overflow: "hidden",
          "&:hover": {
            backgroundColor: "rgba(16,185,129,0.15)",
            borderColor: theme("colors.yes.400"),
            boxShadow: theme("boxShadow.glow-yes"),
            color: "#ffffff",
          },
          "&:active": { transform: "scale(0.96)" },
        },
        ".btn-no": {
          backgroundColor: "rgba(244,63,94,0.08)",
          color: theme("colors.no.400"),
          border: "1px solid rgba(244,63,94,0.2)",
          fontWeight: "600",
          borderRadius: theme("borderRadius.xl"),
          transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            backgroundColor: "rgba(244,63,94,0.15)",
            borderColor: theme("colors.no.400"),
            boxShadow: theme("boxShadow.glow-no"),
            color: "#ffffff",
          },
          "&:active": { transform: "scale(0.96)" },
        },
        ".btn-primary": {
          background: "linear-gradient(135deg, #10B981, #065F46)",
          color: "#ffffff",
          fontWeight: "800",
          borderRadius: theme("borderRadius.xl"),
          border: "none",
          transition: "all 500ms cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: "0 10px 20px -5px rgba(16, 185, 129, 0.3)",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: theme("boxShadow.glow-elite"),
            filter: "brightness(1.05) saturate(1.1)",
          },
          "&:active": { transform: "scale(0.96)" },
        },
        ".glass-2": {
          backdropFilter: "blur(24px) saturate(200%)",
          backgroundColor: "rgba(10,10,10,0.6)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "inset 0 1px 1px 0 rgba(255,255,255,0.05)",
        },
      });

      addUtilities({
        ".tabular-nums": { fontVariantNumeric: "tabular-nums" },
        ".glass-refraction": {
          background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 32px 0 rgba(0,0,0,0.37)",
        },
        ".text-glow-accent": {
          textShadow: "0 0 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(6, 95, 70, 0.2)",
        },
        ".shimmer-slow": {
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
          backgroundSize: "200% 100%",
          animation: "shimmer 5s linear infinite",
        },
      });
    },
  ],
};
