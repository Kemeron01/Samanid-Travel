'use client';
import { ReviewCard } from '@samanid/ui';
import type { Review } from '@samanid/api';
import { useLocale, useTranslations } from 'next-intl';
import { intlLocale, type Locale } from '@samanid/i18n';
import { Link } from '@/i18n/routing';
import { Carousel } from '@/components/tours/Carousel';

const initials = (n: string) => n.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const t = useTranslations('home.reviews');
  const ts = useTranslations('home.seasonal');
  const locale = useLocale() as Locale;
  const month = (d: string) => { const s = new Intl.DateTimeFormat(intlLocale[locale], { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`)); return s.charAt(0).toUpperCase() + s.slice(1); };
  return (
    <section aria-labelledby="reviews-title" className="py-12 md:py-24">
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-20">
        <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
          <div>
            <h2 id="reviews-title" className="text-h3 text-dark-900 md:text-h2">{t('title')}</h2>
            <p className="mt-2 text-body-s text-dark-600 md:text-body-l">{t('subtitle')}</p>
          </div>
          <Link href="/reviews" className="text-body-s-medium text-primary-500 md:hidden">{ts('all')}</Link>
        </div>
        <Carousel prevLabel={t('prev')} nextLabel={t('next')} itemClassName="w-[90%] md:w-[413px]">
          {reviews.map((r) => (
            <ReviewCard key={r.id} initials={initials(r.author)} name={r.author} meta={`${month(r.date)} · ${r.tour_title}`} rating={r.rating} text={r.text} verifiedLabel={r.verified ? t('verified') : undefined} />
          ))}
        </Carousel>
      </div>
    </section>
  );
}
