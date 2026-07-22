import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FFF9F4",
        plum: "#3D3557",
        coral: {
          light: "#FFD6DE",
          DEFAULT: "#FF6F91",
          dark: "#E4547A",
        },
        mint: {
          light: "#D4F5EE",
          DEFAULT: "#5FD6C4",
          dark: "#3CBBA8",
        },
        honey: {
          light: "#FFECC2",
          DEFAULT: "#FFC857",
          dark: "#F0AC2E",
        },
        lavender: {
          light: "#EAE2FF",
          DEFAULT: "#A78BFA",
          dark: "#8B6FE0",
        },
      },
      fontFamily: {
        display: ["var(--font-baloo)", "sans-serif"],
        body: ["var(--font-nunito)", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
