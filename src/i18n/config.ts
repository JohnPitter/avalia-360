/**
 * i18n Configuration
 *
 * Internationalization setup using i18next + react-i18next
 * Supports: Portuguese (pt), English (en), Spanish (es)
 *
 * Language Detection Order:
 * 1. localStorage (i18nextLng key)
 * 2. Browser navigator.language
 * 3. Fallback to Portuguese (pt)
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from '../locales/en/translation.json';
import ptTranslations from '../locales/pt/translation.json';
import esTranslations from '../locales/es/translation.json';

// Initialize i18n
i18n
  .use(LanguageDetector) // Detect user language from browser/localStorage
  .use(initReactI18next) // Bind to React
  .init({
    resources: {
      en: { translation: enTranslations },
      pt: { translation: ptTranslations },
      es: { translation: esTranslations },
    },
    fallbackLng: 'pt', // Portuguese fallback
    supportedLngs: ['en', 'pt', 'es'],
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    react: {
      useSuspense: false, // Disable suspense to prevent loading issues
    },
  });

export default i18n;
