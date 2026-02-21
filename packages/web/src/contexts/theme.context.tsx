import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  /** The user's preference (dark, light, or system) */
  mode: ThemeMode;
  /** The resolved theme (dark or light) after applying system preference */
  resolved: 'dark' | 'light';
  /** Set the theme mode */
  setMode: (mode: ThemeMode) => void;
  /** Toggle between dark and light (ignores system) */
  toggle: () => void;
}

const STORAGE_KEY = 'northstar-theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemPreference(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'system') return getSystemPreference();
  return mode;
}

function applyTheme(resolved: 'dark' | 'light') {
  const root = document.documentElement;
  if (resolved === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
    return 'dark'; // Default to dark
  });

  const resolved = resolveTheme(mode);

  // Apply theme to DOM
  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  // Listen for system preference changes when in 'system' mode
  useEffect(() => {
    if (mode !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => applyTheme(getSystemPreference());
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const toggle = useCallback(() => {
    const next = resolved === 'dark' ? 'light' : 'dark';
    setMode(next);
  }, [resolved, setMode]);

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
