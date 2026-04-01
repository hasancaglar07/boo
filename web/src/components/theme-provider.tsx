"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";

export type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  attribute?: "class";
};

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "book-generator-theme";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function getResolvedTheme(theme: Theme, enableSystem: boolean) {
  if (theme === "system" && enableSystem && typeof window !== "undefined") {
    return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
  }
  return theme === "dark" ? "dark" : "light";
}

function disableTransitionsTemporarily() {
  const doc = document.documentElement;
  doc.classList.add("theme-transitioning");
  window.getComputedStyle(doc).getPropertyValue("color");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      doc.classList.remove("theme-transitioning");
    });
  });
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  enableSystem = true,
  disableTransitionOnChange = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("dark");

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initialTheme = stored || defaultTheme;
    const resolved = getResolvedTheme(initialTheme, enableSystem);
    document.documentElement.classList.toggle("dark", resolved === "dark");
    setThemeState(initialTheme);
    setResolvedTheme(resolved);
  }, [defaultTheme, enableSystem]);

  React.useEffect(() => {
    if (!enableSystem || theme !== "system") return;

    const media = window.matchMedia(MEDIA_QUERY);
    const handleChange = () => {
      const resolved = media.matches ? "dark" : "light";
      document.documentElement.classList.toggle("dark", resolved === "dark");
      setResolvedTheme(resolved);
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [enableSystem, theme]);

  const setTheme = React.useCallback(
    (nextTheme: Theme) => {
      if (disableTransitionOnChange) {
        disableTransitionsTemporarily();
      }
      const resolved = getResolvedTheme(nextTheme, enableSystem);
      document.documentElement.classList.toggle("dark", resolved === "dark");
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
      setThemeState(nextTheme);
      setResolvedTheme(resolved);
    },
    [disableTransitionOnChange, enableSystem],
  );

  const value = React.useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, setTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
