import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Brand palette — soft, calm tones suited to a cycle tracker.
        period: "#f43f6e", // 생리일
        fertile: "#34d399", // 가임기
        ovulation: "#10b981", // 배란일
        predicted: "#fb7185", // 예측 생리일
        brand: {
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
          700: "#be185d",
        },
      },
    },
  },
  plugins: [],
};

export default config;
