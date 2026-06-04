import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172023",
        muted: "#647176",
        line: "#dfe7e8",
        panel: "#ffffff",
        wash: "#f5f8f8",
        teal: "#087f7a",
        amber: "#b7791f",
        danger: "#b42318"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(23, 32, 35, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;

