import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { adminMessages, defaultLocale, locales, messages, type Locale } from '@samanid/i18n';

const KEY = 'st_admin_lang';
const stored = (() => { try { return localStorage.getItem(KEY); } catch { return null; } })();
const initial: Locale = (locales as readonly string[]).includes(stored ?? '') ? (stored as Locale) : defaultLocale;

void i18n.use(initReactI18next).init({
  lng: initial, fallbackLng: defaultLocale, supportedLngs: [...locales],
  // Админка: свой словарь + общие статусы заказа из словаря сайта (ключи = статусы бэкенда).
  resources: Object.fromEntries(locales.map((l) => [l, { translation: { ...adminMessages[l], status: messages[l].status } }])),
  interpolation: { escapeValue: false },
});
document.documentElement.lang = initial;
i18n.on('languageChanged', (l) => { document.documentElement.lang = l; try { localStorage.setItem(KEY, l); } catch { /* приватный режим */ } });
export default i18n;
