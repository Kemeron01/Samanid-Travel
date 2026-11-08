'use client';
import { Button, IconButton } from '@samanid/ui';
import { api, type WaitlistOffer } from '@samanid/api';
import { type Locale } from '@samanid/i18n';
import { Bell, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { dayMonth } from '@/lib/format';
import { hms, useCountdown } from './useCountdown';

/** Баннер «Место освободилось» поверх любой страницы. В проде оффер приходит из /me; в моке включается localStorage.st_demo_offer = "1". */
export function WaitlistBanner() {
  const [offer, setOffer] = useState<WaitlistOffer | null>(null);
  useEffect(() => { try { if (localStorage.getItem('st_demo_offer') === '1') api.waitlistOffer('demo').then(setOffer); } catch { /* ignore */ } }, []);
  return offer ? <Inner offer={offer} onClose={() => setOffer(null)} /> : null;
}

function Inner({ offer, onClose }: { offer: WaitlistOffer; onClose: () => void }) {
  const t = useTranslations('waitlistOffer');
  const locale = useLocale() as Locale; const router = useRouter(); const left = useCountdown(offer.expires_at);
  if (left === 0) return null;
  return (
    <div role="status" className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-3 bg-success-600 px-4 py-2 text-body-s-medium text-white">
      <Bell className="size-5 shrink-0" aria-hidden="true" />
      <span>{t('banner', { title: offer.tour.title, date: dayMonth(offer.from, locale), seats: t('seats', { count: offer.seats }).replace(/ \(.*\)/, ''), time: hms(left) })}</span>
      <Button size="M" variant="primary" onClick={() => router.push(`/waitlist/offer/${offer.id}` as never)}>{t('bannerBook')}</Button>
      <IconButton label={t('bannerClose')} onClick={onClose} className="text-white hover:bg-white/15"><X className="size-5" aria-hidden="true" /></IconButton>
    </div>
  );
}
