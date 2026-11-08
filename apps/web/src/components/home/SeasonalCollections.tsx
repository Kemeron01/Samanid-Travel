'use client';
import { Chip } from '@samanid/ui';
import type { Tour } from '@samanid/api';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Link } from '@/i18n/routing';
import { Carousel } from '@/components/tours/Carousel';
import { TourCardView } from '@/components/tours/TourCardView';

type Season = Tour['season'];
const seasons: Season[] = ['spring', 'summer', 'navruz', 'may', 'autumn'];

/** Сезонные подборки: чипы фильтруют карточки на клиенте (данные уже пришли с сервера). */
export function SeasonalCollections({ tours }: { tours: Tour[] }) {
  const t = useTranslations('home.seasonal');
  const [season, setSeason] = useState<Season>('spring');
  const list = useMemo(() => tours.filter((x) => x.season === season), [tours, season]);
  return (
    <section aria-labelledby="seasonal-title" className="py-12 md:py-24">
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-20">
        <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
          <div>
            <h2 id="seasonal-title" className="text-h3 text-dark-900 md:text-h2">{t('title')}</h2>
            <p className="mt-2 hidden text-body-l text-dark-600 md:block">{t('subtitle')}</p>
          </div>
          <Link href="/tours" className="text-body-s-medium text-primary-500 md:hidden">{t('all')}</Link>
        </div>
        <div role="group" aria-label={t('title')} className="-mx-4 mb-6 flex snap-x gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:px-0">
          {seasons.map((s) => <Chip key={s} selected={s === season} onClick={() => setSeason(s)} className="shrink-0 snap-start">{t(s)}</Chip>)}
        </div>
        <Carousel prevLabel={t('prev')} nextLabel={t('next')}>{list.map((tour) => <TourCardView key={tour.slug} tour={tour} />)}</Carousel>
      </div>
    </section>
  );
}
