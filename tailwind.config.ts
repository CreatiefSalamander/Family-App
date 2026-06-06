import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0179FE",
        "primary-dark": "#0056CC",
        sidebar: "#111827",
        content: "#F8FAFC",
        border: "#E5E7EB",
        success: "#22C55E",
        danger: "#EF4444",
        warning: "#F59E0B",
        // Horizon design tokens
        bankGradient: "#0179FE",
        sky: { 1: "#F3F9FF" },
        black: { 1: "#00214F", 2: "#344054" },
        blue: {
          25: "#F5FAFF",
          100: "#D1E9FF",
          500: "#2E90FA",
          600: "#1570EF",
          700: "#175CD3",
          900: "#194185",
        },
        gray: {
          25: "#FCFCFD",
          200: "#EAECF0",
          300: "#D0D5DD",
          500: "#667085",
          600: "#475467",
          700: "#344054",
          900: "#101828",
        },
      },
      backgroundImage: {
        // Horizon gradients — ook bruikbaar als Tailwind klassen
        "bank-gradient": "linear-gradient(90deg, #0179FE 0%, #4893FF 100%)",
        "bank-green-gradient": "linear-gradient(90deg, #01797A 0%, #489399 100%)",
        "gradient-mesh": "url('/icons/gradient-mesh.svg')",
      },
      boxShadow: {
        // Horizon shadow tokens — exact overgenomen uit origineel
        form:       "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
        chart:      "0px 1px 3px 0px rgba(16, 24, 40, 0.10), 0px 1px 2px 0px rgba(16, 24, 40, 0.06)",
        profile:    "0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)",
        creditCard: "8px 10px 16px 0px rgba(0, 0, 0, 0.05)",
      },
      fontFamily: {
        display: ["IBM Plex Serif", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        "ibm-plex-serif": ["IBM Plex Serif", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
