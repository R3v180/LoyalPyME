// filename: frontend/src/i18n.ts
// Configuración inicial de i18next

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend'; // Para cargar traducciones desde archivos/servidor
import LanguageDetector from 'i18next-browser-languagedetector'; // Para detectar idioma del navegador/localStorage

i18n
  // Cargar traducciones usando http backend (lee archivos json de /public/locales)
  .use(HttpApi)
  // Detectar idioma del usuario (localStorage, navegador)
  .use(LanguageDetector)
  // Pasar la instancia de i18n a react-i18next
  .use(initReactI18next)
  // Inicializar i18next
  .init({
    // Idiomas soportados
    supportedLngs: ['es', 'en'],
    // Idioma por defecto si la detección falla o el idioma no está soportado
    fallbackLng: 'es',
    // Namespace por defecto (nombre del archivo json de traducción)
    defaultNS: 'translation',
    // Opciones para el backend HTTP
    backend: {
      // Ruta donde buscar los archivos json -> /public/locales/{lng}/{ns}.json
      // ej: /public/locales/es/translation.json
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // Opciones para el detector de idioma
    detection: {
      // Orden de detección: localStorage -> navegador
      order: ['localStorage', 'navigator'],
      // Qué buscar en localStorage
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng', // Clave en localStorage
    },
    // --- Opciones Adicionales (Opcional) ---
    // debug: import.meta.env.DEV, // Activar logs de i18next en desarrollo
    interpolation: {
      escapeValue: false, // React ya se encarga del escaping (XSS)
    },
    react: {
      useSuspense: true, // Usar Suspense mientras cargan las traducciones (recomendado)
    }
  });

export default i18n;

// End of File: frontend/src/i18n.ts