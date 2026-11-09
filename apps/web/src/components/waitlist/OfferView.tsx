'use client';
import { Button, Media } from '@samanid/ui';
import { api, type WaitlistOffer } from '@samanid/api';
import { intlLocale, type Locale } from '@samanid/i18n';
import { Bell, Calendar, Info, Ticket, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { dayMonth, money } from '@/lib/format';
import { hms, useCountdown } from './useCountdown';

export function OfferView({ offer }: { offer: WaitlistOffer }) {
  const t = useTranslations('waitlistOffer');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const left = useCountdown(offer.expires_at);
  const [declined, setDeclined] = useState(false);
  const expired = left === 0;
  const exp = new Date(offer.expires_at);
  const time = new Intl.DateTimeFormat(intlLocale[locale], { hour: '2-digit', minute: '2-digit' }).format(exp);
  const date = dayMonth(exp.toISOString().slice(0, 10), locale);
  const year = offer.to.slice(0, 4);
  const decline = async () => { await api.declineOffer(offer.id); setDeclined(true); };
  const icon = (I: typeof Bell) => <I className="size-4 shrink-0 text-dark-500" aria-hidden="true" />;

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-5 rounded-2xl border border-dark-200 bg-white px-5 py-6 text-center shadow-md md:gap-6 md:p-10">
      <span aria-hidden="true" className="flex size-[72px] items-center justify-center rounded-full bg-success-100 text-success-700"><Bell className="size-8" /></span>
      {declined ? <p role="status" className="text-body-l text-dark-700">{t('declined')}</p> : expired ? (
        <>
          <h1 className="text-h3 text-dark-900 md:text-h2">{t('expired')}</h1><p className="text-body-m text-dark-600">{t('expiredText')}</p>
          <Button variant="secondary" size="L" onClick={() => router.push(`/tours/${offer.tour.slug}` as never)}>{t('pickDate')}</Button>
        </>
      ) : (
        <>
          <h1 className="-mt-1 text-h3 text-dark-900 md:mt-0 md:text-h2">{t('title')}</h1>
          <p className="max-w-[520px] text-body-m text-dark-600">{offer.was_first ? t('textFirst') : t('text')}</p>
          <div className="w-full rounded-xl bg-warning-100 px-6 py-5 text-warning-700">
            <p className="text-body-s-medium">{t('validFor')}</p>
            <p aria-hidden="true" className="my-1 text-[44px] leading-[52px] font-extrabold tabular-nums md:text-[56px] md:leading-[64px]">{hms(left)}</p>
            {/* Скринридеру объявляем раз в минуту (aria-live=polite) */}
            <span className="sr-only" role="timer" aria-live="polite" aria-atomic="true" key={Math.ceil(left / 60)}>{t('validFor')}: {Math.ceil(left / 60)} min</span>
            <p className="text-caption text-dark-700">{t('until', { time, date })}</p>
          </div>
          <div className="flex w-full flex-col gap-3 rounded-xl border border-dark-200 p-4 text-left md:flex-row md:items-center md:gap-4">
            <Media tone={offer.tour.image.tone} src={offer.tour.image.src} caption={offer.tour.region} className="relative h-[140px] w-full shrink-0 rounded-md md:h-[100px] md:w-[120px]" />
            <div className="flex min-w-0 flex-col gap-1.5">
              <h2 className="text-h5 text-dark-900 md:text-h6">{offer.tour.title}</h2>
              <p className="flex items-center gap-2 text-body-s text-dark-600">{icon(Calendar)}{t('dates', { from: dayMonth(offer.from, locale), to: dayMonth(offer.to, locale), year })}</p>
              <p className="flex items-center gap-2 text-body-s text-dark-600">{icon(Users)}{t('seats', { count: offer.seats })}</p>
              <p className="flex items-center gap-2 text-body-s text-dark-600">{icon(Ticket)}{t('priceLine', { unit: money(offer.unit_price, locale), count: offer.seats, total: money(offer.total, locale) })}</p>
            </div>
          </div>
          <div className="flex w-full flex-col items-center gap-3 md:flex-row md:gap-6">
            <Button variant="primary" size="L" className="w-full md:flex-1" onClick={() => router.push({ pathname: '/checkout', query: { offer: offer.id, tour: offer.tour.slug, departure: offer.departure, adults: String(offer.seats), children: '0' } } as never)}>{t('book')}</Button>
            <Button variant="ghost" size="L" onClick={decline}>{t('decline')}</Button>
          </div>
          <p className="flex items-start gap-2 text-left text-caption text-dark-500 md:items-center"><Info className="size-4 shrink-0 max-md:mt-px" aria-hidden="true" />{t('declineNote')}</p>
        </>
      )}
    </div>
  );
}
