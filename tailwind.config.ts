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
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Helvetica Neue",
          "Helvetica",
          "Segoe UI",
          "Arial",
          "Roboto",
          "PingFang SC",
          "miui",
          "Hiragino Sans GB",
          "Microsoft Yahei",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
