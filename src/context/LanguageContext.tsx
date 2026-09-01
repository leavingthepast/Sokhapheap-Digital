import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../i18n/translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: typeof TRANSLATIONS.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANG_STORAGE_KEY = 'sokhapheap_digital_preferred_lang_v1';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LANG_STORAGE_KEY) as Language | null;
      if (saved === 'en' || saved === 'km') {
        return saved;
      }
    }
    return 'en';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANG_STORAGE_KEY, newLang);
    }
  };

  const toggleLang = () => {
    setLang(lang === 'en' ? 'km' : 'en');
  };

  useEffect(() => {
    // Set document language attribute for screen readers & font rendering
    document.documentElement.lang = lang;
  }, [lang]);

  const value: LanguageContextType = {
    lang,
    setLang,
    toggleLang,
    t: TRANSLATIONS[lang],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
