import { createContext, useState, useEffect, useContext } from 'react';

const PreferencesContext = createContext();

export const PreferencesProvider = ({ children }) => {
  // 1. LocalStorage'dan oku, yoksa varsayılanı kullan
  const [currency, setCurrency] = useState(() => localStorage.getItem('app_currency') || 'TRY');
  const [language, setLanguage] = useState(() => localStorage.getItem('app_language') || 'tr');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('app_theme') === 'dark');

  // 2. Değişiklik olunca LocalStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('app_currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('app_theme', darkMode ? 'dark' : 'light');
    // Dark mode class eklemesi (İleride lazım olacak)
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const toggleCurrency = () => {
    setCurrency(prev => prev === 'TRY' ? 'USD' : 'TRY');
  };

  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <PreferencesContext.Provider value={{ 
      currency, 
      setCurrency, 
      toggleCurrency, 
      language, 
      setLanguage, 
      darkMode, 
      toggleTheme 
    }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => useContext(PreferencesContext);