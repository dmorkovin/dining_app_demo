import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import es from './es.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { common: en.common, home: en.home, order: en.order, discover: en.discover, profile: en.profile, rewards: en.rewards, profileDrawer: en.profileDrawer, sidebar: en.sidebar, allergens: en.allergens, feedback: en.feedback },
    es: { common: es.common, home: es.home, order: es.order, discover: es.discover, profile: es.profile, rewards: es.rewards, profileDrawer: es.profileDrawer, sidebar: es.sidebar, allergens: es.allergens, feedback: es.feedback },
  },
  lng: localStorage.getItem('app-language') || 'en',
  fallbackLng: 'en',
  ns: ['common', 'home', 'order', 'discover', 'profile', 'rewards', 'profileDrawer', 'sidebar', 'allergens', 'feedback'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

export default i18n;
