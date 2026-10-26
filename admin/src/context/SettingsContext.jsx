import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { translations } from '../lib/translations';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  // Theme state: 'light' or 'dark'
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem('aaplagaav_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  // Language state: 'mr' (Marathi) or 'en' (English)
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('aaplagaav_lang') || 'mr';
    } catch {
      return 'mr';
    }
  });

  // Global Settings Modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Apply theme to document
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('aaplagaav_theme', theme);
    } catch (err) {
      console.warn('Failed to persist theme:', err);
    }
  }, [theme]);

  // Apply language persistence
  useEffect(() => {
    try {
      document.documentElement.setAttribute('lang', language);
      localStorage.setItem('aaplagaav_lang', language);
    } catch (err) {
      console.warn('Failed to persist language:', err);
    }
  }, [language]);

  const setTheme = useCallback((newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setThemeState(newTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setLanguage = useCallback((newLang) => {
    if (newLang === 'mr' || newLang === 'en') {
      setLanguageState(newLang);
    }
  }, []);

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  // Translation helper: returns single language string based on active language
  const t = useCallback(
    (key, fallback = '') => {
      const langDict = translations[language];
      if (langDict && langDict[key] !== undefined) {
        return langDict[key];
      }
      const defaultDict = translations.mr;
      if (defaultDict && defaultDict[key] !== undefined) {
        return defaultDict[key];
      }
      return fallback || key;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      language,
      setLanguage,
      t,
      isSettingsOpen,
      openSettings,
      closeSettings,
    }),
    [theme, setTheme, toggleTheme, language, setLanguage, t, isSettingsOpen, openSettings, closeSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    const fallbackLang = typeof localStorage !== 'undefined' ? localStorage.getItem('aaplagaav_lang') || 'mr' : 'mr';
    const fallbackTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('aaplagaav_theme') || 'light' : 'light';
    const tFallback = (key, fallback = '') => {
      const dict = translations[fallbackLang] || translations.mr;
      return dict?.[key] || fallback || key;
    };
    return {
      theme: fallbackTheme,
      setTheme: () => {},
      toggleTheme: () => {},
      language: fallbackLang,
      setLanguage: () => {},
      t: tFallback,
      isSettingsOpen: false,
      openSettings: () => {},
      closeSettings: () => {},
    };
  }
  return context;
}

export default SettingsContext;
