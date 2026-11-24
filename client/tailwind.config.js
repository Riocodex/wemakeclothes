/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0c1117",
          900: "#0c1117",
          800: "#171c24",
          700: "#2a313c",
          600: "#4a5361",
          500: "#6b7382",
          400: "#959cac",
          300: "#c4c9d4",
          200: "#dde1e8",
          100: "#eceef3",
          50: "#f6f7f9",
        },
        paper: "#f3f4f6",
        bone: "#e7e9ee",
        brand: {
          50: "#f3f4f6",
          100: "#e6e8ec",
          200: "#c5c9d1",
          400: "#3a4150",
          500: "#0c1117",
          600: "#171c24",
          700: "#0c1117",
        },
      },
      fontFamily: {
        sans: ['"Manrope"', "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Syne"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(12,17,23,0.04), 0 6px 20px rgba(12,17,23,0.05)",
        lift: "0 2px 6px rgba(12,17,23,0.06), 0 20px 48px rgba(12,17,23,0.12)",
        float: "0 14px 40px rgba(0,0,0,0.22)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
}
