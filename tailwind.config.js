/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        navy: {
          950: "#06111f",
          900: "#0b1b2e",
          800: "#10243c",
          700: "#16324f",
        },
        accent: {
          DEFAULT: "#22c55e",
          dark: "#16a34a",
          soft: "#dcfce7",
        },
      },
      boxShadow: {
        card: "0 10px 40px rgba(6, 17, 31, 0.08)",
        lift: "0 18px 50px rgba(6, 17, 31, 0.14)",
      },
    },
  },
  plugins: [],
};
