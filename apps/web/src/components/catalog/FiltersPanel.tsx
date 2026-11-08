'use client';
import { Button, Checkbox, Chip, DateRangeInput, PriceRangeSlider, RadioGroup, Switch } from '@samanid/ui';
import { PRICE_BOUNDS, type Destination, type DurationBucket, type Tour } from '@samanid/api';
import { intlLocale, type Locale } from '@samanid/i18n';
import { SlidersHorizontal } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { money } from '@/lib/format';

export interface FilterState {
  destinations: string[]; priceMin: number; priceMax: number; dateFrom?: string; dateTo?: string;
  duration?: DurationBucket; type?: Tour['type']; available: boolean;
}

/** Панель фильтров (Figma 19:1240). Состояние — «черновик», применяется кнопкой «Показать N туров» (URL — источник истины). */
export function FiltersPanel({ value, onChange, onApply, onReset, destinations, total }: {
  value: FilterState; onChange: (v: FilterState) => void; onApply: () => void; onReset: () => void; destinations: Destination[]; total: number;
}) {
  const t = useTranslations('catalog');
  const ta = useTranslations('a11y');
  const locale = useLocale() as Locale;
  const set = (p: Partial<FilterState>) => onChange({ ...value, ...p });
  const toggleDest = (slug: string, on: boolean) => set({ destinations: on ? [...value.destinations, slug] : value.destinations.filter((d) => d !== slug) });
  const sep = <hr className="border-dark-200" />;
  const h = 'text-body-m-medium text-dark-900';
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-h5 text-dark-900"><SlidersHorizontal className="size-5" aria-hidden="true" />{t('filters')}</h2>
        <button type="button" onClick={onReset} className="rounded-xs text-body-s text-primary-500 focus-visible:focus-ring">{t('reset')}</button>
      </div>
      <PriceRangeSlider className="max-w-none" label={t('price')} valueLabel={`${money(value.priceMin, locale)} — ${money(value.priceMax, locale)}`} minLabel={money(PRICE_BOUNDS.min, locale)} maxLabel={`${money(PRICE_BOUNDS.max, locale)}+`}
        min={PRICE_BOUNDS.min} max={PRICE_BOUNDS.max} step={10} value={[value.priceMin, value.priceMax]} onValueChange={([a, b]) => set({ priceMin: a ?? PRICE_BOUNDS.min, priceMax: b ?? PRICE_BOUNDS.max })} thumbLabels={[`${t('price')}: ${money(value.priceMin, locale)}`, `${t('price')}: ${money(value.priceMax, locale)}`]} />
      {sep}
      <DateRangeInput label={t('departDates')} placeholder={t('datesPlaceholder')} locale={intlLocale[locale]} prevLabel={ta('prevMonth')} nextLabel={ta('nextMonth')}
        value={[value.dateFrom, value.dateTo].filter(Boolean) as string[]} onValueChange={(v) => set({ dateFrom: v[0], dateTo: v[1] })} />
      {sep}
      <fieldset className="flex flex-col"><legend className={`${h} mb-1`}>{t('destination')}</legend>
        {destinations.map((d) => (
          <div key={d.slug} className="flex items-center justify-between">
            <Checkbox label={d.name} checked={value.destinations.includes(d.slug)} onCheckedChange={(c) => toggleDest(d.slug, c === true)} />
            <span className="text-caption text-dark-400">{d.tours_count}</span>
          </div>
        ))}
      </fieldset>
      {sep}
      <fieldset><legend className={`${h} mb-3`}>{t('duration')}</legend>
        <div className="flex flex-wrap gap-2">
          {(['1-3', '4-7', '8+'] as DurationBucket[]).map((d) => <Chip key={d} selected={value.duration === d} onClick={() => set({ duration: value.duration === d ? undefined : d })}>{t(`durations.${d}`)}</Chip>)}
        </div>
      </fieldset>
      {sep}
      <div><p className={`${h} mb-1`} id="type-label">{t('type')}</p>
        <RadioGroup aria-labelledby="type-label" value={value.type ?? 'all'} onValueChange={(v) => set({ type: v === 'all' ? undefined : (v as Tour['type']) })}
          options={[{ value: 'all', label: t('types.all') }, { value: 'group', label: t('types.group') }, { value: 'individual', label: t('types.individual') }]} />
      </div>
      {sep}
      <Switch label={t('available')} checked={value.available} onCheckedChange={(c) => set({ available: c })} />
      <Button variant="secondary" size="M" className="w-full" onClick={onApply}>{t('show', { count: total })}</Button>
    </div>
  );
}
