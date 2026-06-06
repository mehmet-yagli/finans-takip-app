// context/ThemeContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = {
  theme: 'light' | 'dark';
  language: 'tr' | 'en';
  currency: 'TRY' | 'USD';
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'tr' | 'en') => void;
  setCurrency: (curr: 'TRY' | 'USD') => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark');
  const [language, setLanguageState] = useState<'tr' | 'en'>('tr');
  const [currency, setCurrencyState] = useState<'TRY' | 'USD'>('TRY');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        const savedLang = await AsyncStorage.getItem('language');
        const savedCurr = await AsyncStorage.getItem('currency');
        if (savedTheme) setThemeState(savedTheme as 'light' | 'dark');
        if (savedLang) setLanguageState(savedLang as 'tr' | 'en');
        if (savedCurr) setCurrencyState(savedCurr as 'TRY' | 'USD');
      } catch (error) {
        console.log("Ayarlar yüklenemedi:", error);
      }
    };
    loadSettings();
  }, []);

  const setTheme = async (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const setLanguage = async (newLang: 'tr' | 'en') => {
    setLanguageState(newLang);
    await AsyncStorage.setItem('language', newLang);
  };

  const setCurrency = async (newCurr: 'TRY' | 'USD') => {
    setCurrencyState(newCurr);
    await AsyncStorage.setItem('currency', newCurr);
  };

  return (
    <ThemeContext.Provider value={{ theme, language, currency, setTheme, setLanguage, setCurrency }}>
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