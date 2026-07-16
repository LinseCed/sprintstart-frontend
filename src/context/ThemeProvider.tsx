import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import type { Theme } from './ThemeContext';
import { ThemeContext } from './ThemeContext';

const STORAGE_KEY = 'theme';

/**
 * Reads the user's stored theme preference, falling back to the OS
 * `prefers-color-scheme` setting (resolved to a concrete light/dark value)
 * when no preference has been persisted. 'system' is only used when explicitly
 * chosen by the user and stored.
 */
function getInitialTheme(): Theme {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
        return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Resolves a (possibly 'system') theme to the concrete light/dark mode in effect. */
function resolveDark(theme: Theme): boolean {
    if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return theme === 'dark';
}

/** Applies the resolved light/dark class to <html> and persists the preference. */
function applyTheme(theme: Theme) {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolveDark(theme) ? 'dark' : 'light');
    window.localStorage.setItem(STORAGE_KEY, theme);
}

/**
 * Provider component that manages the application's visual theme.
 *
 * Supports an explicit 'system' preference that follows the OS
 * `prefers-color-scheme` media query and re-applies when the OS
 * preference changes. The selection is persisted to localStorage.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    // When the user picks 'system', keep the applied mode in sync with the OS.
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => applyTheme('system');
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    const setTheme = (next: Theme) => {
        setThemeState(next);
    };

    // Sidebar quick toggle: cycle light <-> dark. 'system' is treated as the
    // resolved mode so toggling from 'system' flips to the opposite concrete mode.
    const toggleTheme = () => {
        setThemeState((prev) => (resolveDark(prev) ? 'light' : 'dark'));
    };

    const isDarkMode = resolveDark(theme);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
}
