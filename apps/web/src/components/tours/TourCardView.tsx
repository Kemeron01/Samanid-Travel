'use client';
import { TourCard, type TagType } from '@samanid/ui';
import type { Tour } from '@samanid/api';
import { type Locale } from '@samanid/i18n';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { AppLink } from '@/lib/ui-link';
import { dayMonth, money } from '@/lib/format';

const FAV_KEY = 'st_favorites';
const readFavs = (): string[] => { try { return JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]') as string[]; } catch { return []; } };

/** Карточка тура из данных API. Метки: не более 2 (ограничение в TourCard). Избранное — локально, пока нет /me/favorites. */
export function TourCardView({ tour, onWaitlist }: { tour: Tour; onWaitlist?: (slug: string) => void }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [fav, setFav] = useState(false);
  useEffect(() => { setFav(readFavs().includes(tour.slug)); }, [tour.slug]);
  const toggle = () => {
    const cur = readFavs(); const next = cur.includes(tour.slug) ? cur.filter((s) => s !== tour.slug) : [...cur, tour.slug];
    try { localStorage.setItem(FAV_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    setFav(next.includes(tour.slug));
  };
  const soldOut = tour.seats_left === 0;
  const tagLabel = (k: Tour['tags'][number]) => k === 'discount' ? t('tour.tags.discount', { percent: tour.discount_percent ?? 0 }) : t(`tour.tags.${k}` as never);
  const tagType: Record<string, TagType> = { hit: 'hit', discount: 'discount', new: 'new', individual: 'individual', group: 'group' };
  return (
    <TourCard
      Link={AppLink}
      href={`/tours/${tour.slug}`}
      title={tour.title}
      region={tour.region}
      image={{ tone: tour.image.tone, src: tour.image.src, alt: tour.image.alt, caption: tour.region }}
      tags={tour.tags.map((k) => ({ type: tagType[k]!, label: tagLabel(k) }))}
      favorite={{ active: fav, onToggle: toggle, label: fav ? t('tour.favoriteRemove') : t('tour.favoriteAdd') }}
      facts={{ duration: t('tour.days', { count: tour.duration_days }), group: t('tour.groupMax', { count: tour.group_max }), nextDate: tour.next_departure ? dayMonth(tour.next_departure, locale) : '—' }}
      rating={{ value: tour.rating, count: tour.reviews_count }}
      oldPrice={tour.old_price ? money(tour.old_price, locale) : undefined}
      priceTemplate={t.raw('price.from') as string}
      price={money(tour.price_from, locale)}
      perPerson={t('tour.perPerson')}
      seatsLeft={tour.seats_left && tour.seats_left > 0 ? t('tour.seatsLeft', { count: tour.seats_left }) : undefined}
      soldOut={soldOut ? { label: t('tour.tags.soldOut'), nextDepartureLabel: t('tour.nextDeparture'), nextDeparture: tour.next_departure ? dayMonth(tour.next_departure, locale) : '—', waitlistLabel: t('tour.waitlist'), onWaitlist: () => onWaitlist?.(tour.slug) } : undefined}
    />
  );
}
