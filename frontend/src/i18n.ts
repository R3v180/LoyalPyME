// filename: frontend/src/i18n.ts
// Version: 1.4.1 (Enable debug mode)

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: ['es', 'en'],
    fallbackLng: 'es',
    defaultNS: 'translation',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    // --- AÑADIR ESTA LÍNEA ---
    debug: true, // Muestra logs detallados de i18next en la consola
    // --- FIN AÑADIR ---
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: true,
    }
  });

export default i18n;

// End of File: frontend/src/i18n.ts