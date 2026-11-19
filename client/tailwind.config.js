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
          DEFAULT: "#111113",
          900: "#111113",
          800: "#1d1d21",
          700: "#2e2e34",
          600: "#4a4a52",
          500: "#6b6b74",
          400: "#94949c",
          300: "#c4c4ca",
          200: "#e3e2e0",
          100: "#efeeeb",
          50: "#f7f6f3",
        },
        paper: "#faf9f6",
        brand: {
          50: "#fff8eb",
          100: "#fdecc8",
          200: "#fbd98d",
          400: "#f2b84b",
          500: "#e29e24",
          600: "#c07f12",
          700: "#995f0e",
        },
      },
      fontFamily: {
        sans: ['"Inter var"', "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,17,19,0.04), 0 4px 16px rgba(17,17,19,0.05)",
        lift: "0 2px 4px rgba(17,17,19,0.05), 0 16px 40px rgba(17,17,19,0.10)",
        float: "0 12px 40px rgba(0,0,0,0.18)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
}
