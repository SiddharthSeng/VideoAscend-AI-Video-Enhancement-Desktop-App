import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({ theme: 'dark', setTheme: () => {} });
const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('va-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {}
    return 'dark';
  });

  const setTheme = (t) => {
    setThemeState(t);
    try { localStorage.setItem('va-theme', t); } catch {}
    if (isElectron && window.electronAPI.setTheme) {
      window.electronAPI.setTheme(t).catch(() => {});
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark',  theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    root.setAttribute('data-theme', theme);
  }, [theme]);

  // On mount, sync from electron-store if available
  useEffect(() => {
    if (!isElectron || !window.electronAPI.getTheme) return;
    window.electronAPI.getTheme().then(t => {
      if (t && (t === 'dark' || t === 'light')) setThemeState(t);
    }).catch(() => {});
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
