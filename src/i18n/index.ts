import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationHI from './locales/hi/translation.json';
import translationEN from './locales/en/translation.json';
import translationBN from './locales/bn/translation.json';

const resources = {
  hi: { translation: translationHI },
  en: { translation: translationEN },
  bn: { translation: translationBN },
};

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'hi', // default to Hindi
    interpolation: {
      escapeValue: false, // React already protects against XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18next;
