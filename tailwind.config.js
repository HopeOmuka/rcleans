/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./app.tsx",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],

  presets: [require("nativewind/preset")],

  darkMode: "class",

  theme: {
    extend: {
      fontFamily: {
        Jakarta: ["Jakarta", "sans-serif"],
        JakartaBold: ["Jakarta-Bold", "sans-serif"],
        JakartaExtraBold: ["Jakarta-ExtraBold", "sans-serif"],
        JakartaExtraLight: ["Jakarta-ExtraLight", "sans-serif"],
        JakartaLight: ["Jakarta-Light", "sans-serif"],
        JakartaMedium: ["Jakarta-Medium", "sans-serif"],
        JakartaSemiBold: ["Jakarta-SemiBold", "sans-serif"],
      },

      colors: {
        // Primary green (logo)
        primary: {
          100: "#E6FFF4",
          200: "#C6F7E2",
          300: "#9AE6B4",
          400: "#5EEAD4",
          500: "#4ADE80", // main brand green
          600: "#22C55E",
          700: "#16A34A",
          800: "#166534",
          900: "#052E16",
        },

        // Blue accent (logo)
        accent: {
          100: "#E0F2FE",
          200: "#BAE6FD",
          300: "#7DD3FC",
          400: "#38BDF8",
          500: "#3B82F6", // main brand blue
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#172554",
        },

        // Dark background (logo background)
        dark: {
          100: "#1F1F1F",
          200: "#181818",
          300: "#141414",
          400: "#111111",
          500: "#0D0D0D", // main dark
          600: "#0A0A0A",
          700: "#080808",
          800: "#050505",
          900: "#030303",
        },

        // Neutral grays
        secondary: {
          100: "#F8FAFC",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },

        success: {
          500: "#4ADE80",
        },

        warning: {
          500: "#FACC15",
        },

        danger: {
          500: "#F87171",
        },
      },

      backgroundImage: {
        "primary-gradient":
          "linear-gradient(135deg, #4ADE80 0%, #5EEAD4 50%, #3B82F6 100%)",
      },
    },
  },

  plugins: [],
};
