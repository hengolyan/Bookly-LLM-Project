import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--ink) / <alpha-value>)",
        parchment: "rgb(var(--parchment) / <alpha-value>)",
        moss: "rgb(var(--moss) / <alpha-value>)",
        rose: "rgb(var(--rose) / <alpha-value>)",
        midnight: "rgb(var(--midnight) / <alpha-value>)",
        gold: "rgb(var(--gold) / <alpha-value>)"
      },
      boxShadow: {
        glow: "0 18px 60px rgb(var(--shadow) / 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
