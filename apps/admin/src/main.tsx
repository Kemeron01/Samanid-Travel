import '@fontsource-variable/manrope';
import i18n from 'i18next';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider, initReactI18next, useTranslation } from 'react-i18next';
import { defaultLocale, locales, messages } from '@samanid/i18n';
import { Button } from '@samanid/ui';
import './styles.css';

void i18n.use(initReactI18next).init({
  lng: defaultLocale, fallbackLng: defaultLocale, supportedLngs: [...locales],
  resources: Object.fromEntries(locales.map((l) => [l, { translation: messages[l] }])),
  interpolation: { escapeValue: false },
});

function App() {
  const { t } = useTranslation();
  return (
    <main className="p-8">
      <h1 className="text-h2">Admin</h1>
      <Button variant="secondary" className="mt-4">{t('common.retry')}</Button>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><I18nextProvider i18n={i18n}><App /></I18nextProvider></StrictMode>,
);
