import { api } from '@samanid/api';
import { DestinationCard, PageContainer } from '@samanid/ui';
import { locales, type Locale } from '@samanid/i18n';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { AppLink } from '@/lib/ui-link';
import { money } from '@/lib/format';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://samanid.travel';
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params; const t = await getTranslations({ locale, namespace: 'destinationPage.meta' });
  return { title: t('title'), description: t('description'), alternates: { canonical: `${SITE}/${locale}/destinations`, languages: Object.fromEntries(locales.map((l) => [l, `${SITE}/${l}/destinations`])) } };
}
/** Список направлений: в Figma отдельного макета нет — собран из DestinationCard (вопрос к дизайнеру). */
export default async function DestinationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params; const locale = raw as Locale; setRequestLocale(locale);
  const [items, t, tm] = [await api.destinations(), await getTranslations({ locale, namespace: 'destinationPage' }), await getTranslations({ locale, namespace: 'home.destinations' })];
  return (
    <PageContainer className="pt-8 pb-16 md:pt-12 md:pb-24">
      <h1 className="text-h3 text-dark-900 md:text-h1">{t('listTitle')}</h1>
      <p className="mt-2 text-body-m text-dark-600">{t('listText', { count: items.length })}</p>
      <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{items.map((d) => <li key={d.slug}><DestinationCard Link={AppLink} href={`/destinations/${d.slug}`} name={d.name} meta={tm('meta', { count: d.tours_count, price: money(d.price_from, locale) })} image={{ tone: d.image.tone, caption: d.name }} /></li>)}</ul>
    </PageContainer>
  );
}
