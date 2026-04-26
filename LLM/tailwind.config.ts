import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#261f2d",
        parchment: "#fbf4df",
        moss: "#4f6f52",
        rose: "#b35c71",
        midnight: "#223047",
        gold: "#c9963e"
      },
      boxShadow: {
        glow: "0 18px 60px rgba(89, 64, 38, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
