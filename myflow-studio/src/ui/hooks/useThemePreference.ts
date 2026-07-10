import { useCallback, useState } from "react";

export type ThemePreference = "system" | "light" | "dark";

/**
 * Session-only theme override. Persisting the choice across restarts is a
 * Settings-module concern (M4) once the storage layer (M2) exists — this
 * hook just applies the override to the DOM for the current session.
 */
export function useThemePreference(): {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
} {
  const [theme, setThemeState] = useState<ThemePreference>("system");

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    if (next === "system") {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = next;
    }
  }, []);

  return { theme, setTheme };
}
