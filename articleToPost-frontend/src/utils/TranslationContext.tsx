import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { translate, setCurrentLanguage, getCurrentLanguage } from './i18n';

type Placeholders = { [key: string]: string | number };

interface TranslationContextType {
  t: (key: string, placeholders?: Placeholders) => string;
  setLanguage: (lang: string) => void;
  currentLanguage: string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

  const t = (key: string, placeholders?: Placeholders): string => {
    let translatedText = translate(key);

    if (placeholders) {
      Object.keys(placeholders).forEach((placeholder) => {
        const value = placeholders[placeholder];
        const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
        translatedText = translatedText.replace(regex, String(value));
      });
    }

    return translatedText;
  };

  const contextValue = {
    t,
    setLanguage: (lang: string) => {
      setCurrentLanguage(lang);
      setCurrentLang(lang);
    },
    currentLanguage: currentLang,
  };

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}; 