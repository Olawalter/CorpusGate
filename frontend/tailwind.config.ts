import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B0D10",
        bone: "#F4EFE7",
        plum: "#2B183F",
        gold: "#D6A84F",
        graphite: "#2E3338",
        "blue-grey": "#9BA7B4",
        verdict: "#4CAF7D",
        reject: "#D65A5A",
        amber: "#E0A33A",
      },
      fontFamily: {
        heading: ["Space Grotesk", "Avenir Next", "Trebuchet MS", "sans-serif"],
        body: ["IBM Plex Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(214,168,79,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(214,168,79,0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
    },
  },
  plugins: [],
};

export default config;
