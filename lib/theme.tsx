import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Appearance } from "react-native";

export const THEME_STORAGE_KEY = "rcleans.theme";

export type ThemeName = "light" | "dark";

export type ThemePreference = ThemeName;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryBright: string;
  primarySoft: string;
  primaryContrast: string;
  accent: string;
  success: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  tabBar: string;
}

const THEMES: Record<ThemeName, ThemeColors> = {
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
};

const schemeOf = (name: ThemeName): "light" | "dark" => name;

interface ThemeContextValue {
  theme: { name: ThemeName; colors: ThemeColors; scheme: "light" | "dark" };
  preference: ThemePreference | "system";
  setTheme: (
    name: ThemePreference | "system",
    options?: { transition?: string; duration?: number },
  ) => void;
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

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

const resolveSystemTheme = (): ThemeName =>
  Appearance.getColorScheme() === "dark" ? "dark" : "light";

export function ThemeTransitionProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme: ThemeName | "system";
}) {
  const [activeTheme, setActiveTheme] = useState<ThemeName>(() =>
    initialTheme === "system" ? resolveSystemTheme() : initialTheme,
  );
  const [preference, setPreference] = useState<ThemePreference | "system">(
    initialTheme === "system" ? "system" : initialTheme,
  );
  const systemModeRef = useRef(preference === "system");

  // Follow the OS appearance while in system mode.
  useEffect(() => {
    const sub = Appearance.addChangeListener(() => {
      if (systemModeRef.current) {
        setActiveTheme(resolveSystemTheme());
      }
    });
    return () => sub.remove();
  }, []);

  const setTheme = useCallback(
    (name: ThemePreference | "system") => {
      const next = name === "system" ? resolveSystemTheme() : name;
      setPreference(name);
      systemModeRef.current = name === "system";
      setActiveTheme(next);
    },
    [],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: {
        name: activeTheme,
        colors: THEMES[activeTheme],
        scheme: schemeOf(activeTheme),
      },
      preference,
      setTheme,
      isTransitioning: false,
    }),
    [activeTheme, preference, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeTransitionProvider");
  }
  return ctx;
}
