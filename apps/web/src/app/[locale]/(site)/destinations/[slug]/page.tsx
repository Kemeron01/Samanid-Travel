import { api } from '@samanid/api';
import { Breadcrumbs, Media, PageContainer, buttonVariants, cn } from '@samanid/ui';
import { locales, type Locale } from '@samanid/i18n';
import { Calendar, Clock, CreditCard, MapPin, Shield, Star, Ticket } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ReadMore } from '@/components/destination/ReadMore';
import { Carousel } from '@/components/tours/Carousel';
import { TourCardView } from '@/components/tours/TourCardView';
import { Link } from '@/i18n/routing';
import { AppLink } from '@/lib/ui-link';
import { compact } from '@/lib/format';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://samanid.travel';
type P = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params;
  const d = await api.destination(slug);
  if (!d) return {};
  return { title: d.name, description: d.tagline, openGraph: { title: d.name, description: d.tagline },
    alternates: { canonical: `${SITE}/${locale}/destinations/${slug}`, languages: { ...Object.fromEntries(locales.map((l) => [l, `${SITE}/${l}/destinations/${slug}`])), 'x-default': `${SITE}/ru/destinations/${slug}` } } };
}

export default async function DestinationPage({ params }: P) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale; setRequestLocale(locale);
  const [d, tours] = await Promise.all([api.destination(slug), api.tours({ destination: slug })]);
  if (!d) notFound();
  const t = await getTranslations({ locale, namespace: 'destinationPage' });
  const tc = await getTranslations({ locale, namespace: 'catalog' });
  const ts = await getTranslations({ locale, namespace: 'home.seasonal' });
  const facts = [
    { i: Shield, k: 'visa', f: d.facts.visa }, { i: Calendar, k: 'season', f: d.facts.season }, { i: CreditCard, k: 'currency', f: d.facts.currency }, { i: Clock, k: 'time', f: d.facts.time },
  ] as const;
  return (
    <>
      <section className="relative isolate overflow-hidden text-white">
        <Media tone="sky" src={d.image.src} alt={d.image.alt} caption={d.name} className="absolute inset-0 -z-10" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-b from-dark-900/10 from-20% to-dark-900/85" />
        <PageContainer className="flex min-h-[320px] flex-col justify-end gap-1.5 pt-10 pb-5 md:min-h-[520px] md:gap-3 md:pt-20 md:pb-[124px]">
          <div className="hidden md:block [&_a]:text-dark-300 [&_li>span]:text-white [&_svg]:text-dark-300"><Breadcrumbs label={tc('breadcrumbs')} Link={AppLink} items={[{ label: tc('breadcrumbHome'), href: '/' }, { label: t('breadcrumb'), href: '/destinations' }, { label: d.name }]} /></div>
          <h1 className="text-h1 md:text-display">{d.name}</h1>
          <p className="hidden max-w-[760px] text-body-l text-dark-200 md:block">{d.tagline}</p>
          <p className="text-body-s-medium md:hidden">{t('heroShort', { count: d.tours_count, rating: d.rating.toFixed(1) })}</p>
          <ul className="hidden flex-wrap items-center gap-x-6 gap-y-1 text-body-s-medium md:flex">
            <li className="flex items-center gap-2"><Ticket className="size-[18px]" aria-hidden="true" />{t('toursCount', { count: d.tours_count })}</li>
            <li className="flex items-center gap-2"><Star className="size-[18px]" aria-hidden="true" />{t('ratingBy', { rating: d.rating.toFixed(1), count: compact(d.reviews_count, locale) })}</li>
            <li className="flex items-center gap-2"><MapPin className="size-[18px]" aria-hidden="true" />{d.area}</li>
          </ul>
        </PageContainer>
      </section>
      <PageContainer>
        <ul className="relative z-10 mt-5 grid grid-cols-2 gap-2.5 md:mt-0 md:grid-cols-4 md:gap-5">
          {facts.map(({ i: I, k, f }) => (
            <li key={k} className="flex flex-col gap-1.5 rounded-lg border border-dark-200 bg-white p-[15px] md:gap-2.5 md:rounded-xl md:p-6 md:shadow-md">
              <span className="flex items-center gap-2.5"><span aria-hidden="true" className="flex items-center justify-center text-primary-500 md:size-10 md:rounded-md md:bg-primary-50"><I className="size-5" /></span><span className="hidden text-body-m-medium text-dark-900 md:inline">{t(k)}</span></span>
              <span className="text-caption text-dark-500 md:hidden">{t(k === 'season' ? 'seasonShort' : k)}</span>
              <span className="text-body-s-medium text-dark-900 md:hidden">{f.short}</span><span className="hidden text-body-s text-dark-600 md:inline">{f.text}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-8 md:mt-16 md:grid-cols-[1fr_520px] md:gap-16">
          <section aria-labelledby="about"><h2 id="about" className="mb-3 text-h4 text-dark-900 md:mb-4 md:text-h2">{t('about')}</h2><ReadMore paragraphs={d.about} /></section>
          <section aria-labelledby="see" className="max-md:hidden"><h2 id="see" className="mb-4 text-h4 text-dark-900">{t('see')}</h2>
            <ul className="flex flex-col gap-3">{d.sights.map((s) => (
              <li key={s.title} className="flex items-center gap-4 rounded-lg border border-dark-200 bg-white p-3"><Media tone={s.tone} className="relative size-[72px] shrink-0 rounded-md [&_svg]:size-7 [&_span]:hidden" /><div><p className="text-body-m text-dark-900">{s.title}</p><p className="text-body-s text-dark-500">{s.text}</p></div></li>))}</ul></section>
        </div>
        <section aria-labelledby="tours" className="mt-4 pb-16 md:mt-16 md:pb-24">
          <div className="mb-4 flex items-center justify-between gap-4 md:mb-6"><h2 id="tours" className="text-h4 text-dark-900 md:text-h2">{t('toursIn', { name: d.name })}</h2>
            <Link href={{ pathname: '/tours', query: { destination: slug } } as never} className={cn(buttonVariants({ variant: 'outline' }), 'hidden md:inline-flex')}>{t('allTours', { count: d.tours_count })}</Link></div>
          {/* Mobile 23:4054: карточки списком (2 шт.), desktop — лента из 4. */}
          <ul className="flex flex-col gap-4 md:hidden">{tours.slice(0, 2).map((x) => <li key={x.slug}><TourCardView tour={x} /></li>)}</ul>
          <div className="max-md:hidden"><Carousel prevLabel={ts('prev')} nextLabel={ts('next')} label={t('toursIn', { name: d.name })} arrows={false}>{tours.slice(0, 4).map((x) => <TourCardView key={x.slug} tour={x} />)}</Carousel></div>
          <Link href={{ pathname: '/tours', query: { destination: slug } } as never} className={cn(buttonVariants({ variant: 'outline', size: 'L' }), 'mt-4 w-full md:hidden')}>{t('allTours', { count: d.tours_count })}</Link>
        </section>
      </PageContainer>
    </>
  );
}
