'use client';
import { Breadcrumbs, Button, Chip, EmptyState, Input, Modal, Pagination, Select, SkeletonTourCard } from '@samanid/ui';
import { PRICE_BOUNDS, type Destination, type DurationBucket, type Tour, type TourQuery, type TourSort, type ToursPage } from '@samanid/api';
import { intlLocale, type Locale } from '@samanid/i18n';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { api } from '@samanid/api';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/routing';
import { AppLink } from '@/lib/ui-link';
import { formatISO } from '@samanid/ui';
import { dateRange, money } from '@/lib/format';
import { TourCardView } from '@/components/tours/TourCardView';
import { FiltersPanel, type FilterState } from './FiltersPanel';

const toState = (q: TourQuery): FilterState => ({
  destinations: q.destination ? q.destination.split(',').filter(Boolean) : [], priceMin: q.price_min ?? PRICE_BOUNDS.min, priceMax: q.price_max ?? PRICE_BOUNDS.max,
  dateFrom: q.date_from, dateTo: q.date_to, duration: q.duration, type: q.type, available: Boolean(q.available),
});

/** Строит query-параметры: фильтры = query-параметры URL (Dev notes 1.2). */
function toParams(s: FilterState, extra: { q?: string; sort?: TourSort } = {}) {
  const p: Record<string, string> = {};
  if (s.destinations.length) p.destination = s.destinations.join(',');
  if (s.priceMin > PRICE_BOUNDS.min) p.price_min = String(s.priceMin);
  if (s.priceMax < PRICE_BOUNDS.max) p.price_max = String(s.priceMax);
  if (s.dateFrom) p.date_from = s.dateFrom;
  if (s.dateTo) p.date_to = s.dateTo;
  if (s.duration) p.duration = s.duration;
  if (s.type) p.type = s.type;
  if (s.available) p.available = '1';
  if (extra.q) p.q = extra.q;
  if (extra.sort && extra.sort !== 'popular') p.sort = extra.sort;
  return p;
}

export function CatalogView({ query, data, destinations, relaxed }: { query: TourQuery; data: ToursPage; destinations: Destination[]; relaxed?: { minPrice?: number; items: Tour[] } }) {
  const t = useTranslations('catalog');
  const th = useTranslations('a11y');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const applied = useMemo(() => toState(query), [query]);
  const [draft, setDraft] = useState<FilterState>(applied);
  const [sheet, setSheet] = useState(false);
  const [search, setSearch] = useState(query.q ?? '');
  const sort: TourSort = query.sort ?? 'popular';
  useEffect(() => setDraft(applied), [applied]);
  // Mobile (Figma 20:2443): «Показать ещё N туров» догружает следующие страницы вместо пагинации.
  const [more, setMore] = useState<{ items: Tour[]; page: number }>({ items: [], page: data.page });
  const [loadingMore, setLoadingMore] = useState(false);
  useEffect(() => setMore({ items: [], page: data.page }), [data]);
  const shown = data.items.length + more.items.length;
  const perPage = data.items.length || 1;
  const loadMore = async () => {
    setLoadingMore(true);
    try { const next = await api.toursPage({ ...query, page: more.page + 1 }); setMore((m) => ({ items: [...m.items, ...next.items], page: next.page })); } finally { setLoadingMore(false); }
  };

  const push = (s: FilterState, extra: { q?: string; sort?: TourSort; page?: number } = {}) => {
    const params = toParams(s, { q: extra.q ?? query.q, sort: extra.sort ?? sort });
    if (extra.page && extra.page > 1) params.page = String(extra.page);
    startTransition(() => router.push({ pathname, query: params } as never));
  };
  const apply = () => { setSheet(false); push(draft); };
  const reset = () => { const e: FilterState = { destinations: [], priceMin: PRICE_BOUNDS.min, priceMax: PRICE_BOUNDS.max, available: false }; setDraft(e); push(e); };

  // Активные фильтры → чипы с «×»
  const chips: { key: string; label: string; clear: () => void }[] = [];
  for (const slug of applied.destinations) {
    const name = destinations.find((d) => d.slug === slug)?.name ?? slug;
    chips.push({ key: `d-${slug}`, label: name, clear: () => push({ ...applied, destinations: applied.destinations.filter((x) => x !== slug) }) });
  }
  if (applied.priceMax < PRICE_BOUNDS.max) chips.push({ key: 'pmax', label: t('upTo', { price: money(applied.priceMax, locale) }), clear: () => push({ ...applied, priceMax: PRICE_BOUNDS.max }) });
  if (applied.priceMin > PRICE_BOUNDS.min) chips.push({ key: 'pmin', label: money(applied.priceMin, locale), clear: () => push({ ...applied, priceMin: PRICE_BOUNDS.min }) });
  if (applied.duration) chips.push({ key: 'dur', label: t(`durations.${applied.duration as DurationBucket}`), clear: () => push({ ...applied, duration: undefined }) });
  if (applied.dateFrom) chips.push({ key: 'dates', label: applied.dateTo ? dateRange(applied.dateFrom, applied.dateTo, locale) : formatISO(applied.dateFrom, intlLocale[locale]), clear: () => push({ ...applied, dateFrom: undefined, dateTo: undefined }) });
  if (applied.type) chips.push({ key: 'type', label: t(`types.${applied.type}`), clear: () => push({ ...applied, type: undefined }) });
  if (applied.available) chips.push({ key: 'av', label: t('available'), clear: () => push({ ...applied, available: false }) });

  const panel = <FiltersPanel value={draft} onChange={setDraft} onApply={apply} onReset={reset} destinations={destinations} total={data.total} />;
  const sortOptions = (['popular', 'price_asc', 'price_desc', 'date'] as TourSort[]);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pt-5 pb-16 md:px-20 md:pt-8 md:pb-24">
      <div className="max-md:hidden"><Breadcrumbs label={t('breadcrumbs')} Link={AppLink} items={[{ label: t('breadcrumbHome'), href: '/' }, { label: t('breadcrumbCatalog') }]} /></div>
      {/* Mobile 20:2197: заголовок 36/44, без хлебных крошек; поиск без видимого лейбла; «Фильтры N» + сортировка в одну строку. */}
      <div className="flex flex-col gap-4 md:mt-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-4 md:gap-1.5">
          <h1 className="text-h2 text-dark-900 md:text-h1"><span className="md:hidden">{t('titleShort')}</span><span className="hidden md:inline">{t('title')}</span></h1>
          <p className="text-body-s text-dark-600 md:text-body-m md:text-dark-500" aria-live="polite"><span className="md:hidden">{t('foundShort', { count: data.total })}</span><span className="hidden md:inline">{t('found', { count: data.total })}</span></p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[300px_240px]">
          <Input variant="search" label={t('searchLabel')} placeholder={t('searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') push(applied, { q: search }); }} className="max-md:[&>label]:sr-only" />
          <Select label={t('sortLabel')} placeholder="" value={sort} onValueChange={(v) => push(applied, { sort: v as TourSort })} className="max-md:hidden"
            options={sortOptions.map((s) => ({ value: s, label: t(`sort.${s}`) }))} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 lg:hidden">
        <button type="button" onClick={() => setSheet(true)} className="flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-dark-900 px-4 text-button-m text-white focus-visible:focus-ring">
          <SlidersHorizontal className="size-[18px] shrink-0" aria-hidden="true" />{t('openFilters')}
          {chips.length > 0 && <span className="flex size-5 items-center justify-center rounded-full bg-accent-500 text-caption text-dark-900"><span className="sr-only">: </span>{chips.length}</span>}
        </button>
        <label className="relative flex h-11 min-w-0 flex-1 items-center justify-center rounded-full border border-dark-200 bg-white text-button-m text-dark-900 focus-within:focus-ring md:hidden">
          <span className="sr-only">{t('sortLabel')}</span>
          <select value={sort} onChange={(e) => push(applied, { sort: e.target.value as TourSort })} className="absolute inset-0 cursor-pointer appearance-none rounded-full opacity-0">
            {sortOptions.map((s) => <option key={s} value={s}>{t(`sort.${s}`)}</option>)}
          </select>
          <span aria-hidden="true" className="pointer-events-none flex items-center gap-2">{t(`sortShort.${sort}`)}<ChevronDown className="size-4" /></span>
        </label>
      </div>

      <div className="mt-4 grid gap-8 md:mt-6 lg:grid-cols-[300px_1fr]">
        <aside className="hidden rounded-2xl border border-dark-200 bg-white p-6 lg:block lg:self-start" aria-label={t('filters')}>{panel}</aside>
        <section aria-label={t('title')} className="min-w-0">
          {chips.length > 0 && (
            <div className="-mx-4 mb-4 flex snap-x scroll-px-4 items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:mb-6 md:scroll-px-0 md:flex-wrap md:px-0">
              {chips.map((c) => <Chip key={c.key} onRemove={c.clear} removeLabel={t('removeFilter', { name: c.label })} className="shrink-0 snap-start">{c.label}</Chip>)}
              <button type="button" onClick={reset} className="min-h-10 shrink-0 rounded-xs px-2 text-body-s-medium whitespace-nowrap text-primary-500 focus-visible:focus-ring">{t('clearAll')}</button>
            </div>
          )}
          {data.items.length === 0 ? (
            <>
              <EmptyState title={t('empty.title')} text={relaxed?.minPrice ? t('empty.textFrom', { price: money(relaxed.minPrice, locale) }) : t('empty.text')} actionLabel={t('empty.reset')} onAction={reset} />
              {!!relaxed?.items.length && (
                <section aria-labelledby="suggest" className="mt-6">
                  <h2 id="suggest" className="mb-4 text-h5 text-dark-900">{t('empty.suggest')}</h2>
                  <ul className="grid gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">{relaxed.items.map((tour) => <li key={tour.slug}><TourCardView tour={tour} /></li>)}</ul>
                </section>
              )}
            </>
          ) : (
            <ul className={`grid gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 ${pending ? 'opacity-60' : ''}`} aria-busy={pending}>
              {pending ? Array.from({ length: 3 }, (_, i) => <li key={i}><SkeletonTourCard /></li>) : [...data.items, ...more.items].map((tour: Tour, i) => <li key={tour.slug} className={i >= data.items.length ? 'md:hidden' : undefined}><TourCardView tour={tour} /></li>)}
            </ul>
          )}
          {shown < data.total && !pending && (
            <div className="mt-4 flex flex-col items-center gap-4 md:hidden">
              <Button variant="outline" size="L" className="w-full" disabled={loadingMore} onClick={loadMore}>{t('loadMore', { count: Math.min(perPage, data.total - shown) })}</Button>
              <p className="text-caption text-dark-500" aria-live="polite">{t('shown', { shown, total: data.total })}</p>
            </div>
          )}
          {data.page_count > 1 && (
            <div className="mt-10 hidden justify-center md:flex">
              <Pagination page={data.page} pageCount={data.page_count} onChange={(p) => push(applied, { page: p })} labels={{ nav: t('pagination.nav'), prev: t('pagination.prev'), next: t('pagination.next') }} />
            </div>
          )}
        </section>
      </div>

      {/* Mobile: фильтры в нижней шторке (Modal превращается в bottom sheet на < md) */}
      <div className="lg:hidden">
        <Modal open={sheet} onOpenChange={setSheet} title={t('filters')} closeLabel={th('closeMenu')}>
          <FiltersPanel mode="sheet" value={draft} onChange={setDraft} onApply={apply} onReset={reset} destinations={destinations} total={data.total} />
        </Modal>
      </div>
    </div>
  );
}
