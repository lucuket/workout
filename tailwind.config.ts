import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gym: {
          dark: "#09090b",
          darker: "#030712",
          card: "#121218",
          cardHover: "#1a1a23",
          border: "#27272a",
          primary: "#10b981", // Emerald neon
          accent: "#06b6d4",  // Cyan neon
          warning: "#f59e0b",
          danger: "#ef4444",
          gold: "#eab308",
          muted: "#71717a",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-sm": "bounce 1s infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
