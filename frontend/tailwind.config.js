/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
            DEFAULT: "#0F766E", // Teal 700
            foreground: "#FFFFFF",
        },
        secondary: {
            DEFAULT: "#0EA5E9", // Sky 500
            foreground: "#FFFFFF",
        },
        accent: {
            DEFAULT: "#F59E0B", // Amber 500
            foreground: "#FFFFFF",
        },
        background: "#F8FAFC", // Slate 50
        surface: "#FFFFFF",
        muted: "#94A3B8",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
