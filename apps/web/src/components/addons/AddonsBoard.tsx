'use client';
import { Button, Chip, cn } from '@samanid/ui';
import { api, type Addon, type AddonCategory, type AddonsSummary } from '@samanid/api';
import { type Locale } from '@samanid/i18n';
import { Baby, Check, Eye, MapPin, Plus, Shield, Ticket, User } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { money } from '@/lib/format';

const icons = { shield: Shield, user: User, 'map-pin': MapPin, baby: Baby, eye: Eye, ticket: Ticket } as const;
const cats: ('all' | AddonCategory)[] = ['all', 'insurance', 'guides', 'excursions', 'kids'];

export function AddonsBoard({ addons }: { addons: Addon[] }) {
  const t = useTranslations('addonsPage');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [cat, setCat] = useState<'all' | AddonCategory>('all');
  const [sel, setSel] = useState<string[]>(() => addons.filter((a) => a.in_order).map((a) => a.id));
  const [sum, setSum] = useState<AddonsSummary | null>(null);
  useEffect(() => { let on = true; api.addonsSummary(sel).then((s) => on && setSum(s)); return () => { on = false; }; }, [sel]);
  const toggle = (id: string, on: boolean) => setSel((s) => (on ? [...s, id] : s.filter((x) => x !== id)));
  const list = addons.filter((a) => cat === 'all' || a.category === cat);
  const amounts = sum ? [sum.per_person, sum.per_group, sum.per_trip].filter((x): x is number => !!x) : [];
  const short = amounts.length === 1 ? money(amounts[0]!, locale) : '';
  const parts = sum ? [sum.per_person && t('sumPerson', { price: money(sum.per_person, locale) }), sum.per_group && t('sumGroup', { price: money(sum.per_group, locale) }), sum.per_trip && t('sumTrip', { price: money(sum.per_trip, locale) })].filter(Boolean).join(' + ') : '';
  return (
    <>
      <div role="group" aria-label={t('filters')} className="-mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:scroll-px-0 md:px-0">
        {cats.map((c) => <Chip key={c} selected={c === cat} onClick={() => setCat(c)} className="shrink-0 snap-start">{c === 'kids' ? <><span className="md:hidden">{t('kidsShort')}</span><span className="max-md:hidden">{t('cats.kids')}</span></> : t(`cats.${c}`)}</Chip>)}
      </div>
      <ul className="mt-3 grid gap-3 md:mt-6 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {list.map((a) => { const I = icons[a.icon]; const on = sel.includes(a.id); return (
          <li key={a.id} className={cn('rounded-lg border md:rounded-xl', on ? 'border-[1.5px] border-primary-500 bg-primary-50' : 'border-dark-200 bg-white')}>
            {/* Mobile 25:4920: компактная строка — иконка 44, название, цена, круглая кнопка +/✓ */}
            <div className="flex items-center gap-3.5 p-4 md:hidden">
              <span aria-hidden="true" className={cn('flex size-11 shrink-0 items-center justify-center rounded-md text-primary-500 [&>svg]:size-[22px]', on ? 'bg-white' : 'bg-primary-50')}><I /></span>
              <div className="min-w-0 flex-1"><h2 className="text-body-m text-dark-900">{a.title}</h2><p className="mt-0.5 text-body-s-medium text-primary-600">{money(a.price, locale)} {t(`units.${a.unit}`)}</p></div>
              <button type="button" aria-pressed={on} aria-label={`${on ? t('remove') : t('add')}: ${a.title}`} onClick={() => toggle(a.id, !on)}
                className={cn('inline-flex size-10 shrink-0 items-center justify-center rounded-full focus-visible:focus-ring', on ? 'bg-primary-500 text-white' : 'border border-dark-200 bg-white text-dark-900')}>
                {on ? <Check className="size-5" aria-hidden="true" /> : <Plus className="size-5" aria-hidden="true" />}
              </button>
            </div>
            <div className="flex h-full flex-col gap-4 p-6 max-md:hidden">
            <div className="flex items-start justify-between gap-3">
              <span aria-hidden="true" className={cn('flex size-14 items-center justify-center rounded-lg text-primary-500 [&>svg]:size-6', on ? 'bg-white' : 'bg-primary-50')}><I /></span>
              {on && <span className="inline-flex items-center gap-1.5 rounded-full bg-success-100 px-3 py-1.5 text-caption text-success-700"><Check className="size-3.5" aria-hidden="true" />{t('inOrder')}</span>}
            </div>
            <h2 className="text-h5 text-dark-900">{a.title}</h2>
            <p className="text-body-s text-dark-600">{a.text}</p>
            <div className="mt-auto flex items-center justify-between gap-3 pt-2">
              <p className="flex items-baseline gap-2"><span className="text-price-m text-dark-900">{money(a.price, locale)}</span><span className="text-caption text-dark-500">{t(`units.${a.unit}`)}</span></p>
              {on ? <Button variant="ghost" onClick={() => toggle(a.id, false)} aria-label={`${t('remove')}: ${a.title}`}>{t('remove')}</Button>
                : <Button variant="outline" onClick={() => toggle(a.id, true)} aria-label={`${t('add')}: ${a.title}`}>{t('add')}</Button>}
            </div>
            </div>
          </li>); })}
      </ul>
      {/* Mobile 25:4890: плашка итога сразу под списком: «2 услуги · $40» + «Оформить». */}
      <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-dark-900 px-4 py-3.5 text-white md:mt-8 md:px-6 md:py-4 md:shadow-lg">
        <div aria-live="polite"><p className="text-body-m md:text-body-m-medium">{!sum ? '\u00A0' : sum.count > 0 ? <><span className="md:hidden">{t('selectedShort', { count: sum.count })} · {short || parts}</span><span className="max-md:hidden">{t('selected', { count: sum.count })} · {parts}</span></> : t('empty')}</p>
          {sum?.order_number && <p className="text-caption text-dark-300 max-md:hidden">{t('bindHint', { number: sum.order_number })}</p>}</div>
        <div className="flex items-center gap-3 md:gap-6">
          <button type="button" disabled={!sum?.count} onClick={() => router.push({ pathname: '/account/orders', query: { addons: sel.join(',') } } as never)} className="min-h-11 rounded-xs text-body-s-medium text-white focus-visible:focus-ring disabled:opacity-50 max-md:hidden">{t('bind')}</button>
          <Button variant="primary" disabled={!sum?.count} onClick={() => router.push({ pathname: '/checkout', query: { type: 'addons', ids: sel.join(',') } } as never)}><span className="md:hidden">{t('checkoutShort')}</span><span className="max-md:hidden">{t('checkout')}</span></Button>
        </div>
      </div>
    </>
  );
}
