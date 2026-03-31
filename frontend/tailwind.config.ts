import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Stitch Design System — Deep Precision Editorial
        surface: {
          DEFAULT: "#0b1326",
          dim: "#0b1326",
          bright: "#31394d",
          container: {
            DEFAULT: "#171f33",
            low: "#131b2e",
            high: "#222a3d",
            highest: "#2d3449",
            lowest: "#060e20",
          },
          tint: "#adc6ff",
          variant: "#2d3449",
        },
        primary: {
          DEFAULT: "#adc6ff",
          container: "#4d8eff",
          fixed: "#d8e2ff",
          "fixed-dim": "#adc6ff",
        },
        secondary: {
          DEFAULT: "#b1c6f9",
          container: "#304671",
          fixed: "#d8e2ff",
          "fixed-dim": "#b1c6f9",
        },
        tertiary: {
          DEFAULT: "#ffb786",
          container: "#df7412",
          fixed: "#ffdcc6",
          "fixed-dim": "#ffb786",
        },
        error: {
          DEFAULT: "#ffb4ab",
          container: "#93000a",
        },
        outline: {
          DEFAULT: "#8c909f",
          variant: "#424754",
        },
        on: {
          surface: "#dae2fd",
          "surface-variant": "#c2c6d6",
          background: "#dae2fd",
          primary: "#002e6a",
          "primary-container": "#00285d",
          secondary: "#182f59",
          "secondary-container": "#9fb5e7",
          tertiary: "#502400",
          "tertiary-container": "#461f00",
          error: "#690005",
          "error-container": "#ffdad6",
        },
        inverse: {
          surface: "#dae2fd",
          "on-surface": "#283044",
          primary: "#005ac2",
        },
        background: "#0b1326",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        headline: ["Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        label: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "0.125rem",
        DEFAULT: "0.25rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        glow: "0 8px 32px rgba(173,198,255,0.08)",
        "glow-lg": "0 12px 40px rgba(173,198,255,0.15)",
        "glow-primary": "0 8px 24px rgba(77,142,255,0.2)",
        deep: "0 32px 64px rgba(6,14,32,0.8)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
