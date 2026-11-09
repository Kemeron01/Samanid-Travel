'use client';
import { Breadcrumbs, Button, IconButton, Rating, Tag, ToastView } from '@samanid/ui';
import type { TourDetail } from '@samanid/api';
import { ArrowLeft, Clock, Globe, Heart, MapPin, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@samanid/i18n';
import { dayMonth } from '@/lib/format';
import { useBooking } from './BookingContext';
import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { AppLink } from '@/lib/ui-link';

const FAV_KEY = 'st_favorites';
const read = (): string[] => { try { return JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]') as string[]; } catch { return []; } };

export function TourHeader({ tour }: { tour: TourDetail }) {
  const t = useTranslations('tourPage');
  const tt = useTranslations('tour');
  const tc = useTranslations('catalog');
  const router = useRouter();
  const [fav, setFav] = useState(false);
  const [toast, setToast] = useState<string>();
  useEffect(() => setFav(read().includes(tour.slug)), [tour.slug]);
  const toggle = () => { const cur = read(); const next = cur.includes(tour.slug) ? cur.filter((s) => s !== tour.slug) : [...cur, tour.slug]; try { localStorage.setItem(FAV_KEY, JSON.stringify(next)); } catch { /* ignore */ } setFav(next.includes(tour.slug)); };
  const share = async () => {
    const url = window.location.href;
    try { if (navigator.share) await navigator.share({ title: tour.title, url }); else { await navigator.clipboard.writeText(url); setToast(t('share')); setTimeout(() => setToast(undefined), 3000); } } catch { /* user cancelled */ }
  };
  const tags = [tour.type === 'individual' ? { k: 'individual' as const } : { k: 'group' as const }, ...tour.tags.filter((x) => x === 'hit' || x === 'new').map((k) => ({ k }))].slice(0, 2);
  const locale = useLocale() as Locale;
  const { departureId } = useBooking();
  const dep = tour.departures.find((d) => d.id === departureId);
  // Mobile (22:3457): «5 дней», «до 16 чел.», регион второй строкой; desktop (21:2624): полные формулировки + гид.
  const meta = (I: typeof Clock, text: string, short?: string, cls?: string) => <li className={`flex items-center gap-2.5 text-body-s text-dark-700 ${cls ?? ''}`}><I className="size-5 shrink-0 text-dark-500" aria-hidden="true" />{short ? <><span className="md:hidden">{short}</span><span className="hidden md:inline">{text}</span></> : text}</li>;
  return (
    <header className="flex flex-col gap-4 md:gap-8">
      <div className="absolute inset-x-0 top-4 z-10 flex items-center justify-between px-4 md:hidden">
        <IconButton label={t('back')} onClick={() => router.back()} className="border border-dark-200 bg-white"><ArrowLeft className="size-5" aria-hidden="true" /></IconButton>
        <IconButton label={fav ? tt('favoriteRemove') : tt('favoriteAdd')} onClick={toggle} aria-pressed={fav} className="border border-dark-200 bg-white"><Heart className={fav ? 'size-5 fill-error-600 text-error-600' : 'size-5'} aria-hidden="true" /></IconButton>
      </div>
      <div className="hidden md:block"><Breadcrumbs label={tc('breadcrumbs')} Link={AppLink} items={[{ label: tc('breadcrumbHome'), href: '/' }, { label: tc('breadcrumbCatalog'), href: '/tours' }, { label: tour.title }]} /></div>
      <div className="relative flex flex-col gap-4">
        <div className="flex min-w-0 flex-col gap-4 md:gap-3">
          <div className="flex gap-2">{tags.map((x) => <Tag key={x.k} type={x.k === 'individual' ? 'individual' : x.k === 'group' ? 'group' : x.k}>{tt(`tags.${x.k}`)}</Tag>)}</div>
          <h1 className="text-h3 text-dark-900 md:text-h1">{tour.title}</h1>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 md:gap-x-6">
            <li><Rating value={tour.rating} countLabel={tt('reviewsCount', { count: tour.reviews_count })} /></li>
            {meta(MapPin, tour.region, undefined, 'max-md:order-last max-md:basis-full')}{meta(Clock, t('nights', { days: tour.duration_days, nights: tour.nights }), tt('days', { count: tour.duration_days }))}{meta(Users, t('groupUpTo', { count: tour.group_max }), tt('groupMax', { count: tour.group_max }))}{meta(Globe, t('guide', { langs: tour.languages.join(', ') }), undefined, 'max-md:hidden')}
          </ul>
          {/* Mobile 22:3483: предупреждение о спросе — вместо алерта в карточке бронирования. */}
          {dep?.price_may_rise && dep.seats_left > 0 && (
            <p className="flex items-center gap-2.5 rounded-lg bg-warning-100 px-3.5 py-3 text-body-s-medium text-warning-700 md:hidden">
              <Clock className="size-[18px] shrink-0" aria-hidden="true" />{t('booking.demandShort', { seats: dep.seats_left, date: dayMonth(dep.from, locale) })}
            </p>
          )}
        </div>
        <div className="hidden items-center gap-3 md:absolute md:right-0 md:bottom-0 md:flex">
          <Button variant="outline" onClick={toggle} aria-pressed={fav}>{fav ? t('favorited') : t('favorite')}<Heart className={fav ? 'fill-current' : undefined} aria-hidden="true" /></Button>
          <Button variant="ghost" onClick={share}>{t('share')}</Button>
        </div>
      </div>
      {toast && <div className="fixed right-4 bottom-4 z-50"><ToastView type="info" title={toast} onClose={() => setToast(undefined)} closeLabel="×" /></div>}
    </header>
  );
}
