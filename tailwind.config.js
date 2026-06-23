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
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          300: "#86EFAC",
          400: "#4ADE80",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
          800: "#166534",
          900: "#14532D",
        },

        warning: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },

        danger: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
        },

        general: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
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
