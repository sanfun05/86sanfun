import React, { createContext, useContext, useState, useEffect } from 'react';

export type AccentColor = 'blue' | 'purple' | 'emerald' | 'amber' | 'rose';

interface ThemeContextType {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  toggleDarkMode: () => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  accentClasses: {
    bg: string;
    text: string;
    border: string;
    ring: string;
    gradient: string;
    badgeBg: string;
  };
}

const accentMap: Record<AccentColor, ThemeContextType['accentClasses']> = {
  blue: {
    bg: 'bg-blue-600 dark:bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
    ring: 'focus:ring-blue-500',
    gradient: 'from-blue-600 to-indigo-600',
    badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  purple: {
    bg: 'bg-purple-600 dark:bg-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
    ring: 'focus:ring-purple-500',
    gradient: 'from-purple-600 to-pink-600',
    badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  emerald: {
    bg: 'bg-emerald-600 dark:bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    ring: 'focus:ring-emerald-500',
    gradient: 'from-emerald-600 to-teal-600',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  amber: {
    bg: 'bg-amber-600 dark:bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
    ring: 'focus:ring-amber-500',
    gradient: 'from-amber-600 to-orange-600',
    badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  rose: {
    bg: 'bg-rose-600 dark:bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/30',
    ring: 'focus:ring-rose-500',
    gradient: 'from-rose-600 to-red-600',
    badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sanfun_theme') === 'dark' || localStorage.getItem('zhheo_theme') === 'dark' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [accentColor, setAccentColor] = useState<AccentColor>('blue');

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('sanfun_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('sanfun_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{
      darkMode,
      setDarkMode,
      toggleDarkMode,
      accentColor,
      setAccentColor,
      accentClasses: accentMap[accentColor]
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
