'use client';
import { CookieBanner } from '@samanid/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

const KEY = 'st_cookie_consent';
/** Баннер cookie. Хранение выбора — только в localStorage (с try/catch), аналитика включается лишь при «Принять все». */
export function CookieConsent() {
  const t = useTranslations('cookie');
  const [visible, setVisible] = useState(false);
  useEffect(() => { try { if (!localStorage.getItem(KEY)) setVisible(true); } catch { setVisible(true); } }, []);
  const choose = (v: 'necessary' | 'all') => { try { localStorage.setItem(KEY, v); } catch { /* ignore */ } setVisible(false); };
  if (!visible) return null;
  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-[1040px] pb-[env(safe-area-inset-bottom)]">
      <CookieBanner title={t('title')} text={t('text')} necessaryLabel={t('necessary')} acceptLabel={t('acceptAll')} onNecessary={() => choose('necessary')} onAccept={() => choose('all')} />
    </div>
  );
}
