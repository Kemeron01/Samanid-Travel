'use client';
import { Button, Chip, cn } from '@samanid/ui';
import { api, type Addon, type AddonCategory, type AddonsSummary } from '@samanid/api';
import { type Locale } from '@samanid/i18n';
import { Baby, Check, Eye, MapPin, Shield, Ticket, User } from 'lucide-react';
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
  const parts = sum ? [sum.per_person && t('sumPerson', { price: money(sum.per_person, locale) }), sum.per_group && t('sumGroup', { price: money(sum.per_group, locale) }), sum.per_trip && t('sumTrip', { price: money(sum.per_trip, locale) })].filter(Boolean).join(' + ') : '';
  return (
    <>
      <div role="group" aria-label={t('filters')} className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
        {cats.map((c) => <Chip key={c} selected={c === cat} onClick={() => setCat(c)} className="shrink-0 snap-start">{t(`cats.${c}`)}</Chip>)}
      </div>
      <ul className="mt-6 grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {list.map((a) => { const I = icons[a.icon]; const on = sel.includes(a.id); return (
          <li key={a.id} className={cn('flex flex-col gap-4 rounded-xl border p-6', on ? 'border-[1.5px] border-primary-500 bg-primary-50' : 'border-dark-200 bg-white')}>
            <div className="flex items-start justify-between gap-3">
              <span aria-hidden="true" className={cn('flex size-14 items-center justify-center rounded-lg text-primary-500 [&>svg]:size-6', on ? 'bg-white' : 'bg-primary-50')}><I /></span>
              {on && <span className="inline-flex items-center gap-1.5 rounded-full bg-success-100 px-3 py-1.5 text-caption text-success-700"><Check className="size-3.5" aria-hidden="true" />{t('inOrder')}</span>}
            </div>
            <h2 className="text-h5 text-dark-900">{a.title}</h2>
            <p className="text-body-s text-dark-600">{a.text}</p>
            <div className="mt-auto flex items-center justify-between gap-3 pt-2">
              <p className="flex items-baseline gap-2"><span className="text-price-m text-dark-900">{money(a.price, locale)}</span><span className="text-caption text-dark-500">{t(`units.${a.unit}`)}</span></p>
              {on ? <Button variant="ghost" onClick={() => toggle(a.id, false)} aria-label={`${t('remove')}: ${a.title}`}>{t('remove')}</Button>
                : <Button variant="outline" onClick={() => toggle(a.id, true)} aria-label={`${t('add')}: ${a.title}`} className="border-primary-500 text-primary-500">{t('add')}</Button>}
            </div>
          </li>); })}
      </ul>
      <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-[1280px] flex-col gap-3 rounded-2xl bg-dark-900 px-5 py-4 text-white shadow-lg md:static md:mt-8 md:flex-row md:items-center md:justify-between md:px-6">
        <div aria-live="polite"><p className="text-body-m-medium">{!sum ? '\u00A0' : sum.count > 0 ? `${t('selected', { count: sum.count })} · ${parts}` : t('empty')}</p>
          {sum?.order_number && <p className="text-caption text-dark-300">{t('bindHint', { number: sum.order_number })}</p>}</div>
        <div className="flex items-center gap-3 md:gap-6">
          <button type="button" disabled={!sum?.count} onClick={() => router.push({ pathname: '/account/orders', query: { addons: sel.join(',') } } as never)} className="min-h-11 text-body-s-medium underline focus-visible:focus-ring disabled:opacity-50">{t('bind')}</button>
          <Button variant="primary" disabled={!sum?.count} onClick={() => router.push({ pathname: '/checkout', query: { type: 'addons', ids: sel.join(',') } } as never)}>{t('checkout')}</Button>
        </div>
      </div>
    </>
  );
}
