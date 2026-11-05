import { useCallback, useState } from "react";

export type Theme = "light" | "dark";

const THEME_KEY = "recruitment.theme";

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** מחיל את הבחירה השמורה על ה-<html>. בלי בחירה שמורה נשארים עם מצב המערכת (tokens.css) */
export function applyStoredTheme() {
  const stored = readStoredTheme();
  if (stored) document.documentElement.dataset.theme = stored;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme() ?? systemTheme());

  const toggle = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // מצב פרטי או אחסון חסום: המצב עדיין מתחלף, רק לא נשמר
    }
    setTheme(next);
  }, [theme]);

  return { theme, toggle };
}
