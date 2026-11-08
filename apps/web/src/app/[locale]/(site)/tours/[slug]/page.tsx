import { api } from '@samanid/api';
import { locales, type Locale } from '@samanid/i18n';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BookingCard, MobileBookingBar } from '@/components/tour/BookingCard';
import { BookingProvider } from '@/components/tour/BookingContext';
import { Departures, Gallery, Included, Itinerary, Overview, ReviewsBlock, RouteMap, SectionNav } from '@/components/tour/Sections';
import { TourHeader } from '@/components/tour/TourHeader';
import { TourCardView } from '@/components/tours/TourCardView';
import { Carousel } from '@/components/tours/Carousel';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://samanid.travel';
type P = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params;
  const tour = await api.tour(slug);
  if (!tour) return {};
  const t = await getTranslations({ locale, namespace: 'tourPage.meta' });
  const desc = `${tour.description.slice(0, 140)} ${t('descriptionSuffix')}`;
  return {
    title: tour.title, description: desc,
    openGraph: { title: tour.title, description: desc, type: 'website', url: `${SITE}/${locale}/tours/${slug}` },
    alternates: { canonical: `${SITE}/${locale}/tours/${slug}`, languages: { ...Object.fromEntries(locales.map((l) => [l, `${SITE}/${l}/tours/${slug}`])), 'x-default': `${SITE}/ru/tours/${slug}` } },
  };
}

export default async function TourPage({ params }: P) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [tour, settings, all] = await Promise.all([api.tour(slug), api.settings(), api.tours()]);
  if (!tour) notFound();
  const similar = all.filter((x) => x.slug !== slug).slice(0, 4);
  const t = await getTranslations({ locale: locale as Locale, namespace: 'tourPage' });
  const ld = {
    '@context': 'https://schema.org', '@type': 'TouristTrip', name: tour.title, description: tour.description, touristType: tour.type,
    offers: { '@type': 'Offer', priceCurrency: 'USD', price: tour.price_from, availability: tour.seats_left === 0 ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: tour.rating, reviewCount: tour.reviews_count },
  };
  return (
    <BookingProvider tour={tour}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-0 pb-28 md:px-20 md:pt-8 md:pb-24">
        <div className="relative flex flex-col">
          <div className="order-2 mt-4 md:order-1 md:mt-0"><TourHeader tour={tour} /></div>
          <div className="order-1 md:order-2 md:mt-6"><Gallery tour={tour} /></div>
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_440px]">
          <div className="flex min-w-0 flex-col gap-6">
            <SectionNav count={tour.reviews_summary.count} />
            <Overview tour={tour} /><Itinerary days={tour.days} /><Included tour={tour} />
            <Departures tour={tour} /><RouteMap stops={tour.stops} /><ReviewsBlock tour={tour} />
          </div>
          <aside id="booking" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start"><BookingCard settings={settings} /></aside>
        </div>
        <section aria-labelledby="similar" className="mt-16 md:mt-24">
          <h2 id="similar" className="mb-6 text-h3 text-dark-900 md:text-h2">{t('similar')}</h2>
          <Carousel prevLabel="‹" nextLabel="›">{similar.map((x) => <TourCardView key={x.slug} tour={x} />)}</Carousel>
        </section>
      </div>
      <MobileBookingBar settings={settings} />
    </BookingProvider>
  );
}
