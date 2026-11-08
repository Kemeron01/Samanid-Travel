import { api } from '@samanid/api';
import { locales, type Locale } from '@samanid/i18n';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Destinations, HolidayBanner, Hero, Referral, Stats, Subscribe, WhyUs } from '@/components/home/Sections';
import { ReviewsSection } from '@/components/home/ReviewsSection';
import { SeasonalCollections } from '@/components/home/SeasonalCollections';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://samanid.travel';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home.meta' });
  return {
    title: { absolute: t('title') },
    description: t('description'),
    alternates: {
      canonical: `${SITE}/${locale}`,
      languages: { ...Object.fromEntries(locales.map((l) => [l, `${SITE}/${l}`])), 'x-default': `${SITE}/ru` },
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const [settings, stats, tours, destinations, reviews, holiday] = await Promise.all([
    api.settings(), api.homeStats(), api.tours(), api.destinations(), api.reviews(), api.holiday(),
  ]);
  return (
    <>
      <Hero locale={locale} stats={stats} destinations={destinations} />
      <Stats locale={locale} stats={stats} />
      <SeasonalCollections tours={tours} />
      <HolidayBanner locale={locale} holiday={holiday} />
      <Destinations locale={locale} items={destinations} total={stats.destinations} />
      <WhyUs locale={locale} settings={settings} />
      <ReviewsSection reviews={reviews} />
      <Referral locale={locale} settings={settings} />
      <Subscribe locale={locale} />
    </>
  );
}
