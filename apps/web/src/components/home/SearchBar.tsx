'use client';
import { Button, Calendar, Counter, Popover, cn, formatISO } from '@samanid/ui';
import type { Destination } from '@samanid/api';
import { intlLocale, type Locale } from '@samanid/i18n';
import { Calendar as CalIcon, Car, MapPin, Shield, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';

function Segment({ icon, label, value, placeholder }: { icon: React.ReactNode; label: string; value?: string; placeholder?: string }) {
  return (
    <span className="flex w-full items-center gap-3 text-left">
      <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500 [&>svg]:size-5">{icon}</span>
      <span className="flex min-w-0 flex-col">
        <span className="text-caption text-dark-500">{label}</span>
        <span className={cn('truncate text-body-m-medium', value ? 'text-dark-900' : 'text-dark-400')}>{value ?? placeholder}</span>
      </span>
    </span>
  );
}

/** Поиск на главной (Figma 16:92). Фильтры уходят query-параметрами в каталог (/tours?destination&date_from&date_to&...). */
export function SearchBar({ destinations }: { destinations: Destination[] }) {
  const t = useTranslations('search');
  const ta = useTranslations('a11y');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [dest, setDest] = useState<string>('');
  const [range, setRange] = useState<string[]>([]);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [openD, setOpenD] = useState(false);
  const [openR, setOpenR] = useState(false);

  const destName = destinations.find((d) => d.slug === dest)?.name;
  const dates = range[0] ? `${formatISO(range[0], intlLocale[locale])}${range[1] ? ` — ${formatISO(range[1], intlLocale[locale])}` : ''}` : undefined;
  const people = [t('adultsCount', { count: adults }), children > 0 ? t('childrenCount', { count: children }) : null].filter(Boolean).join(', ');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const query: Record<string, string> = { adults: String(adults) };
    if (dest) query.destination = dest;
    if (range[0]) query.date_from = range[0];
    if (range[1]) query.date_to = range[1];
    if (children) query.children = String(children);
    router.push({ pathname: '/tours', query } as never);
  };

  const trig = 'w-full rounded-lg border border-dark-200 px-3 py-2 hover:bg-dark-100 focus-visible:focus-ring lg:w-auto lg:border-0';
  return (
    <div className="mx-auto w-full max-w-[1120px]">
      <div role="tablist" aria-label="search type" className="mx-auto mb-3 flex w-full max-w-[404px] gap-1 rounded-full bg-white p-1.5 shadow-md lg:-mb-6 lg:relative lg:z-10 lg:mb-0">
        <span role="tab" aria-selected className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full bg-primary-500 px-3 text-body-s-medium text-white"><MapPin className="size-[18px]" aria-hidden="true" />{t('tabs.tours')}</span>
        <Link role="tab" aria-selected={false} href="/transfer" className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full px-3 text-body-s-medium text-dark-700 hover:bg-dark-100 focus-visible:focus-ring"><Car className="size-[18px]" aria-hidden="true" />{t('tabs.transfers')}</Link>
        <Link role="tab" aria-selected={false} href="/addons" className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full px-3 text-body-s-medium text-dark-700 hover:bg-dark-100 focus-visible:focus-ring"><Shield className="size-[18px]" aria-hidden="true" />{t('tabs.addons')}</Link>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-md lg:flex-row lg:items-center lg:gap-0 lg:px-8 lg:py-5">
        <Popover open={openD} onOpenChange={setOpenD} triggerClassName={cn(trig, 'lg:flex-1')} trigger={<Segment icon={<MapPin />} label={t('destination')} value={destName} placeholder={t('destinationPlaceholder')} />} className="w-72 p-2">
          <ul role="listbox" aria-label={t('destination')} className="flex flex-col">
            {[{ slug: '', name: t('anyDestination') }, ...destinations].map((d) => (
              <li key={d.slug} role="option" aria-selected={dest === d.slug}>
                <button type="button" onClick={() => { setDest(d.slug); setOpenD(false); }} className={cn('flex min-h-11 w-full items-center rounded-md px-3 text-left text-body-m hover:bg-dark-100 focus-visible:focus-ring', dest === d.slug && 'bg-primary-50 text-primary-600')}>{d.name}</button>
              </li>
            ))}
          </ul>
        </Popover>
        <span aria-hidden="true" className="hidden h-10 w-px bg-dark-200 lg:block" />
        <Popover open={openR} onOpenChange={setOpenR} triggerClassName={cn(trig, 'lg:flex-1')} trigger={<Segment icon={<CalIcon />} label={t('dates')} value={dates} placeholder={t('datesPlaceholder')} />} className="border-0 shadow-none">
          <Calendar mode="range" value={range} onChange={(v) => { setRange(v); if (v.length === 2) setOpenR(false); }} locale={intlLocale[locale]} prevLabel={ta('prevMonth')} nextLabel={ta('nextMonth')} hint={t('pastUnavailable')} />
        </Popover>
        <span aria-hidden="true" className="hidden h-10 w-px bg-dark-200 lg:block" />
        <Popover triggerClassName={cn(trig, 'lg:flex-1')} trigger={<Segment icon={<Users />} label={t('travellers')} value={people} />} className="w-80 p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4"><span className="text-body-m text-dark-900">{t('adults')}</span><Counter label={t('adults')} value={adults} min={1} max={9} onChange={setAdults} decrementLabel="−" incrementLabel="+" /></div>
            <div className="flex items-center justify-between gap-4"><span className="text-body-m text-dark-900">{t('children')}</span><Counter label={t('children')} value={children} min={0} max={6} onChange={setChildren} decrementLabel="−" incrementLabel="+" /></div>
          </div>
        </Popover>
        {/* Единственная primary-кнопка на экране (правило UI №1) */}
        <Button type="submit" variant="primary" size="L" className="w-full lg:ml-2 lg:w-auto lg:px-8">{t('find')}</Button>
      </form>
    </div>
  );
}
