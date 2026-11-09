'use client';
import { Button, Checkbox, Chip, DateRangeInput, PriceRangeSlider, RadioGroup, SegmentedControl, Switch } from '@samanid/ui';
import { PRICE_BOUNDS, type Destination, type DurationBucket, type Tour } from '@samanid/api';
import { intlLocale, type Locale } from '@samanid/i18n';
import { SlidersHorizontal } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { money } from '@/lib/format';

export interface FilterState {
  destinations: string[]; priceMin: number; priceMax: number; dateFrom?: string; dateTo?: string;
  duration?: DurationBucket; type?: Tour['type']; available: boolean;
}

/**
 * Панель фильтров. Состояние — «черновик», применяется кнопкой «Показать N туров» (URL — источник истины).
 * aside — desktop (Figma 19:1240): разделители, чекбоксы, радио. sheet — mobile-шторка (20:2559): чипы, сегмент-контрол, без разделителей.
 */
export function FiltersPanel({ value, onChange, onApply, onReset, destinations, total, mode = 'aside' }: {
  value: FilterState; onChange: (v: FilterState) => void; onApply: () => void; onReset: () => void; destinations: Destination[]; total: number; mode?: 'aside' | 'sheet';
}) {
  const t = useTranslations('catalog');
  const ta = useTranslations('a11y');
  const locale = useLocale() as Locale;
  const set = (p: Partial<FilterState>) => onChange({ ...value, ...p });
  const toggleDest = (slug: string, on: boolean) => set({ destinations: on ? [...value.destinations, slug] : value.destinations.filter((d) => d !== slug) });
  const sep = <hr className="border-dark-200" />;
  const h = 'text-body-m-medium text-dark-900';
  const price = <PriceRangeSlider className="max-w-none" label={t('price')} valueLabel={`${money(value.priceMin, locale)} — ${money(value.priceMax, locale)}`} minLabel={money(PRICE_BOUNDS.min, locale)} maxLabel={`${money(PRICE_BOUNDS.max, locale)}+`}
    min={PRICE_BOUNDS.min} max={PRICE_BOUNDS.max} step={10} value={[value.priceMin, value.priceMax]} onValueChange={([a, b]) => set({ priceMin: a ?? PRICE_BOUNDS.min, priceMax: b ?? PRICE_BOUNDS.max })} thumbLabels={[`${t('price')}: ${money(value.priceMin, locale)}`, `${t('price')}: ${money(value.priceMax, locale)}`]} />;
  const dates = <DateRangeInput label={t('departDates')} placeholder={t('datesPlaceholder')} locale={intlLocale[locale]} prevLabel={ta('prevMonth')} nextLabel={ta('nextMonth')}
    value={[value.dateFrom, value.dateTo].filter(Boolean) as string[]} onValueChange={(v) => set({ dateFrom: v[0], dateTo: v[1] })} />;
  const durations = (['1-3', '4-7', '8+'] as DurationBucket[]).map((d) => <Chip key={d} selected={value.duration === d} onClick={() => set({ duration: value.duration === d ? undefined : d })}>{t(`durations.${d}`)}</Chip>);
  const available = <Switch label={t('available')} checked={value.available} onCheckedChange={(c) => set({ available: c })} />;

  if (mode === 'sheet') return (
    <div className="flex flex-col gap-5">
      {price}{dates}
      <fieldset><legend className={`${h} mb-2.5`}>{t('destination')}</legend>
        <div className="flex flex-wrap gap-2">{destinations.map((d) => <Chip key={d.slug} selected={value.destinations.includes(d.slug)} onClick={() => toggleDest(d.slug, !value.destinations.includes(d.slug))}>{d.name}</Chip>)}</div>
      </fieldset>
      <fieldset><legend className={`${h} mb-2.5`}>{t('duration')}</legend><div className="flex flex-wrap gap-2">{durations}</div></fieldset>
      <div className="flex flex-col items-start gap-2.5"><p className={h} id="type-label-sheet">{t('type')}</p>
        <SegmentedControl allowEmpty label={t('type')} value={value.type ?? ''} onValueChange={(v) => set({ type: (v || undefined) as Tour['type'] | undefined })}
          options={[{ value: 'group', label: t('types.group') }, { value: 'individual', label: t('types.individual') }]} />
      </div>
      {available}
      <div className="flex gap-3">
        <Button variant="ghost" size="L" onClick={onReset}>{t('reset')}</Button>
        <Button variant="secondary" size="L" className="min-w-0 flex-1" onClick={onApply}>{t('show', { count: total })}</Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-h5 text-dark-900"><SlidersHorizontal className="size-5" aria-hidden="true" />{t('filters')}</h2>
        <button type="button" onClick={onReset} className="rounded-xs text-body-s-medium text-primary-500 focus-visible:focus-ring">{t('reset')}</button>
      </div>
      {price}
      {sep}
      {dates}
      {sep}
      <fieldset><legend className={`${h} mb-1`}>{t('destination')}</legend>
        <div className="flex flex-col gap-1">
          {destinations.map((d) => (
            <div key={d.slug} className="flex items-center justify-between">
              <Checkbox label={d.name} checked={value.destinations.includes(d.slug)} onCheckedChange={(c) => toggleDest(d.slug, c === true)} />
              <span className="text-caption text-dark-400">{d.tours_count}</span>
            </div>
          ))}
        </div>
      </fieldset>
      {sep}
      <fieldset><legend className={`${h} mb-3`}>{t('duration')}</legend>
        <div className="flex flex-wrap gap-2">{durations}</div>
      </fieldset>
      {sep}
      <div><p className={`${h} mb-1`} id="type-label">{t('type')}</p>
        <RadioGroup className="gap-1" aria-labelledby="type-label" value={value.type ?? 'all'} onValueChange={(v) => set({ type: v === 'all' ? undefined : (v as Tour['type']) })}
          options={[{ value: 'all', label: t('types.all') }, { value: 'group', label: t('types.group') }, { value: 'individual', label: t('types.individual') }]} />
      </div>
      {sep}
      {available}
      <Button variant="secondary" size="M" className="w-full" onClick={onApply}>{t('show', { count: total })}</Button>
    </div>
  );
}
