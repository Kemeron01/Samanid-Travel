'use client';
import { ReviewCard } from '@samanid/ui';
import type { Review } from '@samanid/api';
import { useLocale, useTranslations } from 'next-intl';
import { intlLocale, type Locale } from '@samanid/i18n';
import { Carousel } from '@/components/tours/Carousel';
import { monthYear } from '@/lib/format';

const initials = (n: string) => n.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const t = useTranslations('home.reviews');
  const locale = useLocale() as Locale;
  const month = (d: string) => monthYear(d, locale);
  return (
    <section id="reviews" aria-labelledby="reviews-title" className="scroll-mt-24 pt-12 md:pt-24">
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-20">
        <Carousel prevLabel={t('prev')} nextLabel={t('next')} label={t('title')} dots={false} itemClassName="w-full md:w-[413px]" gapClassName="md:gap-5" headClassName="mb-4 md:mb-8"
          head={<>
            <div>
              <h2 id="reviews-title" className="text-h3 text-dark-900 md:text-h2"><span className="md:hidden">{t('titleShort')}</span><span className="hidden md:inline">{t('title')}</span></h2>
              <p className="mt-1 text-body-s text-dark-500 md:mt-2 md:text-body-l"><span className="md:hidden">{t('subtitleShort')}</span><span className="hidden md:inline">{t('subtitle')}</span></p>
            </div>
          </>}>
          {reviews.map((r) => (
            <ReviewCard key={r.id} initials={initials(r.author)} name={r.author} meta={`${month(r.date)} · ${r.tour_title}`} rating={r.rating} text={r.text} verifiedLabel={r.verified ? t('verified') : undefined} />
          ))}
        </Carousel>
      </div>
    </section>
  );
}
