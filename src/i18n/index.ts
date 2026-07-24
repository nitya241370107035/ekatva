import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationHI from './locales/hi/translation.json';
import translationEN from './locales/en/translation.json';

const resources = {
  hi: { translation: translationHI },
  en: { translation: translationEN },
};

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // Never fall back to Hindi when a user has explicitly selected English.
    // English is the complete fallback catalogue for keys not yet translated.
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already protects against XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18next;
