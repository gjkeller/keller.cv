"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import type { Theme } from "@/lib/themes";
import { THEMES, THEME_NAMES, resolveAutoTheme } from "@/lib/themes";

const STORAGE_KEY = "keller-theme";

interface ThemeCtx {
  theme: Theme;
  themeMode: string;
  setThemeMode: (mode: string) => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/** Read persisted theme mode from localStorage (client only) */
function readStored(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Apply CSS custom properties to <html> for the resolved theme */
function applyCssVars(t: Theme) {
  if (typeof document === "undefined") return;
  const s = document.documentElement.style;
  s.setProperty("--theme-bg", t.bg);
  s.setProperty("--theme-text", t.text);
  s.setProperty("--theme-text-dim", t.textDim);
  s.setProperty("--theme-text-muted", t.textMuted);
  s.setProperty("--theme-border", t.border);
  s.setProperty("--theme-card-hover-bg", t.cardHoverBg);
  s.setProperty("--theme-card-hover-border", t.cardHoverBorder);
  s.setProperty("--theme-is-dark", t.isDark ? "1" : "0");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeRaw] = useState<string>("auto");
  const [systemDark, setSystemDark] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage + detect system preference
  useEffect(() => {
    const stored = readStored();
    if (stored && (stored === "auto" || THEME_NAMES.includes(stored))) {
      setThemeModeRaw(stored);
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    setHydrated(true);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const setThemeMode = useCallback((mode: string) => {
    if (mode === "auto" || THEME_NAMES.includes(mode)) {
      setThemeModeRaw(mode);
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch {}
    }
  }, []);

  const theme: Theme = useMemo(() => {
    if (themeMode === "auto") return resolveAutoTheme(systemDark);
    return THEMES.find((t) => t.name === themeMode) || THEMES[0];
  }, [themeMode, systemDark]);

  // Push CSS vars whenever theme changes
  useEffect(() => {
    applyCssVars(theme);
  }, [theme]);

  const ctx = useMemo(
    () => ({ theme, themeMode, setThemeMode }),
    [theme, themeMode, setThemeMode],
  );

  // Avoid flash: render children only after hydrating stored preference
  if (!hydrated) {
    return (
      <ThemeContext.Provider value={ctx}>
        <div style={{ visibility: "hidden" }}>{children}</div>
      </ThemeContext.Provider>
    );
  }

  return <ThemeContext.Provider value={ctx}>{children}</ThemeContext.Provider>;
}
