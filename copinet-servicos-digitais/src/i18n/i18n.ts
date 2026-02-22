import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { Platform } from 'react-native';
import ptBR from './pt-BR/translation.json';

const isWeb = Platform.OS === 'web';

if (isWeb) {
  i18n.use(LanguageDetector as any);
}

i18n.use(initReactI18next).init({
  resources: { 'pt-BR': { translation: ptBR } },
  supportedLngs: ['pt-BR'],
  fallbackLng: 'pt-BR',
  ...(isWeb
    ? {
        detection: {
          order: ['htmlTag', 'localStorage', 'navigator'],
          caches: ['localStorage']
        }
      }
    : { lng: 'pt-BR' }),
  interpolation: { escapeValue: false }
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = 'pt-BR';
}

export default i18n;
