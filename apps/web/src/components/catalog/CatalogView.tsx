'use client';
import { Breadcrumbs, Button, Chip, EmptyState, Input, Modal, Pagination, Select, SkeletonTourCard } from '@samanid/ui';
import { PRICE_BOUNDS, type Destination, type DurationBucket, type Tour, type TourQuery, type TourSort, type ToursPage } from '@samanid/api';
import { intlLocale, type Locale } from '@samanid/i18n';
import { SlidersHorizontal } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/routing';
import { AppLink } from '@/lib/ui-link';
import { formatISO } from '@samanid/ui';
import { money } from '@/lib/format';
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

export function CatalogView({ query, data, destinations }: { query: TourQuery; data: ToursPage; destinations: Destination[] }) {
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
  if (applied.dateFrom) chips.push({ key: 'dates', label: `${formatISO(applied.dateFrom, intlLocale[locale])}${applied.dateTo ? ` – ${formatISO(applied.dateTo, intlLocale[locale])}` : ''}`, clear: () => push({ ...applied, dateFrom: undefined, dateTo: undefined }) });
  if (applied.type) chips.push({ key: 'type', label: t(`types.${applied.type}`), clear: () => push({ ...applied, type: undefined }) });
  if (applied.available) chips.push({ key: 'av', label: t('available'), clear: () => push({ ...applied, available: false }) });

  const panel = <FiltersPanel value={draft} onChange={setDraft} onApply={apply} onReset={reset} destinations={destinations} total={data.total} />;

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-16 md:px-20 md:pt-8 md:pb-24">
      <Breadcrumbs label={t('breadcrumbs')} Link={AppLink} items={[{ label: t('breadcrumbHome'), href: '/' }, { label: t('breadcrumbCatalog') }]} />
      <div className="mt-5 flex flex-col gap-5 md:mt-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-h3 text-dark-900 md:text-h1">{t('title')}</h1>
          <p className="mt-1 text-body-s text-dark-600 md:text-body-m" aria-live="polite">{t('found', { count: data.total })}</p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[300px_240px]">
          <Input variant="search" label={t('searchLabel')} placeholder={t('searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') push(applied, { q: search }); }} className="max-md:hidden" />
          <Select label={t('sortLabel')} placeholder="" value={sort} onValueChange={(v) => push(applied, { sort: v as TourSort })} className="max-md:hidden"
            options={(['popular', 'price_asc', 'price_desc', 'date'] as TourSort[]).map((s) => ({ value: s, label: t(`sort.${s}`) }))} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 md:hidden">
        <Button variant="outline" onClick={() => setSheet(true)} className="flex-1"><SlidersHorizontal className="size-[18px]" aria-hidden="true" />{chips.length ? t('filtersCount', { count: chips.length }) : t('openFilters')}</Button>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[300px_1fr]">
        <aside className="hidden rounded-xl border border-dark-200 bg-white p-6 lg:block lg:self-start" aria-label={t('filters')}>{panel}</aside>
        <section aria-label={t('title')} className="min-w-0">
          {chips.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {chips.map((c) => <Chip key={c.key} onRemove={c.clear} removeLabel={t('removeFilter', { name: c.label })}>{c.label}</Chip>)}
              <button type="button" onClick={reset} className="min-h-10 rounded-xs px-2 text-body-s-medium text-primary-500 focus-visible:focus-ring">{t('clearAll')}</button>
            </div>
          )}
          {data.items.length === 0 ? (
            <EmptyState className="mx-auto max-w-[420px]" title={t('empty.title')} text={t('empty.text')} actionLabel={t('empty.reset')} onAction={reset} />
          ) : (
            <ul className={`grid gap-6 md:grid-cols-2 xl:grid-cols-3 ${pending ? 'opacity-60' : ''}`} aria-busy={pending}>
              {pending ? Array.from({ length: 3 }, (_, i) => <li key={i}><SkeletonTourCard /></li>) : data.items.map((tour: Tour) => <li key={tour.slug}><TourCardView tour={tour} /></li>)}
            </ul>
          )}
          {data.page_count > 1 && (
            <div className="mt-10 flex justify-center">
              <Pagination page={data.page} pageCount={data.page_count} onChange={(p) => push(applied, { page: p })} labels={{ nav: t('pagination.nav'), prev: t('pagination.prev'), next: t('pagination.next') }} />
            </div>
          )}
        </section>
      </div>

      {/* Mobile: фильтры в нижней шторке (Modal превращается в bottom sheet на < md) */}
      <div className="lg:hidden">
        <Modal open={sheet} onOpenChange={setSheet} title={t('filters')} closeLabel={th('closeMenu')}>
          <Input variant="search" label={t('searchLabel')} placeholder={t('searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select label={t('sortLabel')} placeholder="" value={sort} onValueChange={(v) => push(applied, { sort: v as TourSort })} options={(['popular', 'price_asc', 'price_desc', 'date'] as TourSort[]).map((s) => ({ value: s, label: t(`sort.${s}`) }))} />
          {panel}
        </Modal>
      </div>
    </div>
  );
}
