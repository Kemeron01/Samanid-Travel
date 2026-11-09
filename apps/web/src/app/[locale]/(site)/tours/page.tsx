import { api, type DurationBucket, type TourQuery, type TourSort } from '@samanid/api';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@samanid/i18n';
import { CatalogView } from '@/components/catalog/CatalogView';

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | undefined) => (v !== undefined && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : undefined);
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://samanid.travel';

/** URL-параметры → TourQuery (фильтры = query-параметры, SSR отдаёт готовую выдачу для SEO). */
function parse(sp: SP): TourQuery {
  const dur = one(sp.duration); const type = one(sp.type); const sort = one(sp.sort);
  return {
    destination: one(sp.destination), price_min: num(one(sp.price_min)), price_max: num(one(sp.price_max)),
    date_from: one(sp.date_from), date_to: one(sp.date_to),
    duration: dur === '1-3' || dur === '4-7' || dur === '8+' ? (dur as DurationBucket) : undefined,
    type: type === 'group' || type === 'individual' ? type : undefined,
    available: one(sp.available) === '1' ? true : undefined,
    q: one(sp.q), sort: (['popular', 'price_asc', 'price_desc', 'date'] as string[]).includes(sort ?? '') ? (sort as TourSort) : undefined,
    page: num(one(sp.page)),
  };
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'catalog.meta' });
  return {
    title: t('title'), description: t('description'),
    alternates: { canonical: `${SITE}/${locale}/tours`, languages: { ...Object.fromEntries(locales.map((l) => [l, `${SITE}/${l}/tours`])), 'x-default': `${SITE}/ru/tours` } },
  };
}

export default async function ToursPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<SP> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = parse(await searchParams);
  const [data, destinations] = await Promise.all([api.toursPage(query), api.destinations()]);
  // Пустая выдача (Figma 19:2157): ослабляем бюджет и даты — «от $N» и подборка «Возможно, вам подойдёт».
  let relaxed: { minPrice?: number; items: typeof data.items } | undefined;
  if (data.total === 0) {
    const r = await api.toursPage({ ...query, price_min: undefined, price_max: undefined, date_from: undefined, date_to: undefined, page: 1, per_page: 50 });
    const pool = r.items.length ? r.items : (await api.toursPage({ sort: 'popular', per_page: 2 })).items;
    relaxed = { minPrice: r.items.length ? Math.min(...r.items.map((t) => t.price_from)) : undefined, items: pool.slice(0, 2) };
  }
  return <CatalogView query={query} data={data} destinations={destinations} relaxed={relaxed} />;
}
