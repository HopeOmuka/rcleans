import * as SecureStore from "expo-secure-store";

import { createThemeTransition } from "react-native-theme-transition";

export const THEME_STORAGE_KEY = "rcleans.theme";

export const { ThemeTransitionProvider, useTheme } = createThemeTransition({
  themes: {
    light: {
      background: "#F9FAFB",
      surface: "#FFFFFF",
      surfaceMuted: "#F3F4F6",
      text: "#111827",
      textSecondary: "#6B7280",
      textMuted: "#9CA3AF",
      border: "#E5E7EB",
      primary: "#16A34A",
      primaryBright: "#4ADE80",
      primarySoft: "#E6FFF4",
      primaryContrast: "#052E16",
      accent: "#3B82F6",
      success: "#22C55E",
      warning: "#F59E0B",
      warningSoft: "#FEF3C7",
      danger: "#EF4444",
      dangerSoft: "#FEF2F2",
      tabBar: "#FFFFFF",
    },
    dark: {
      background: "#0B1120",
      surface: "#131C2E",
      surfaceMuted: "#1B2740",
      text: "#F8FAFC",
      textSecondary: "#94A3B8",
      textMuted: "#64748B",
      border: "#24334D",
      primary: "#4ADE80",
      primaryBright: "#22C55E",
      primarySoft: "#0E2A1C",
      primaryContrast: "#052E16",
      accent: "#60A5FA",
      success: "#4ADE80",
      warning: "#FBBF24",
      warningSoft: "#3A2A12",
      danger: "#F87171",
      dangerSoft: "#3B1520",
      tabBar: "#0E1120",
    },
  },
  systemThemeMap: { light: "light", dark: "dark" },
});

export type ThemeName = "light" | "dark";

export type ThemePreference = ThemeName;

export const loadThemePreference = (): ThemePreference | "system" => {
  try {
    const stored = SecureStore.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // SecureStore unavailable; fall back to following the system.
  }
  return "system";
};

export const persistThemePreference = (
  preference: ThemePreference | "system",
) => {
  const promise = SecureStore.setItemAsync(THEME_STORAGE_KEY, preference);
  promise.catch(() => {
    // Best-effort persistence; failures never block the toggle.
  });
};