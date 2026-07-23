import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import cs from './cs';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    cs: { translation: cs },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  initImmediate: false,
});

export default i18n;
