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
      <span aria-hidden="true" className="flex shrink-0 items-center justify-center text-primary-500 lg:size-11 lg:rounded-full lg:bg-primary-50 [&>svg]:size-5">{icon}</span>
      <span className="flex min-w-0 flex-col lg:gap-0.5">
        <span className="text-caption text-dark-500">{label}</span>
        <span className={cn('truncate text-body-m-medium', value ? 'text-dark-900' : 'text-dark-400')}>{value ?? placeholder}</span>
      </span>
    </span>
  );
}

/** Поиск на главной (Figma 16:92). Фильтры уходят query-параметрами в каталог (/tours?destination&date_from&date_to&...). */
export function SearchBar({ destinations }: { destinations: Destination[] }) {
  const tA = useTranslations('a11y');
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

  // Figma: mobile 18:776 — поле с рамкой 14px радиус; desktop 16:93 — сегменты 300/270/280 без рамки, разделители 1×40.
  const trig = 'w-full rounded-[14px] border border-dark-200 px-3.5 py-3 hover:bg-dark-100 focus-visible:focus-ring lg:h-14 lg:rounded-md lg:border-0 lg:px-0 lg:py-0';
  const tab = 'flex flex-1 items-center justify-center gap-2 rounded-full p-2 text-body-s-medium focus-visible:focus-ring lg:flex-none lg:px-5 lg:py-2.5 [&>svg]:hidden lg:[&>svg]:block';
  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-3 rounded-2xl bg-white p-4 shadow-md lg:items-center lg:gap-2 lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none">
      <div role="tablist" aria-label="search type" className="flex w-full gap-1 rounded-full bg-dark-100 p-1 lg:w-auto lg:bg-white lg:p-1.5 lg:shadow-md">
        <span role="tab" aria-selected className={cn(tab, 'bg-white text-dark-900 shadow-sm lg:bg-primary-500 lg:text-white lg:shadow-none')}><MapPin className="size-[18px]" aria-hidden="true" />{t('tabs.tours')}</span>
        <Link role="tab" aria-selected={false} href="/transfer" className={cn(tab, 'text-dark-600 hover:bg-white/60 lg:text-dark-700 lg:hover:bg-dark-100')}><Car className="size-[18px]" aria-hidden="true" />{t('tabs.transfers')}</Link>
        <Link role="tab" aria-selected={false} href="/addons" className={cn(tab, 'text-dark-600 hover:bg-white/60 lg:text-dark-700 lg:hover:bg-dark-100')}><Shield className="size-[18px]" aria-hidden="true" />{t('tabs.addons')}</Link>
      </div>
      <form onSubmit={submit} className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:gap-0 lg:rounded-2xl lg:bg-white lg:py-5 lg:pr-4 lg:pl-8 lg:shadow-lg">
        <Popover open={openD} onOpenChange={setOpenD} triggerClassName={cn(trig, 'lg:min-w-0 lg:flex-1 xl:w-[300px] xl:flex-none')} trigger={<Segment icon={<MapPin />} label={t('destination')} value={destName} placeholder={t('destinationPlaceholder')} />} className="w-72 p-2">
          <ul role="listbox" aria-label={t('destination')} className="flex flex-col">
            {[{ slug: '', name: t('anyDestination') }, ...destinations].map((d) => (
              <li key={d.slug} role="option" aria-selected={dest === d.slug}>
                <button type="button" onClick={() => { setDest(d.slug); setOpenD(false); }} className={cn('flex min-h-11 w-full items-center rounded-md px-3 text-left text-body-m hover:bg-dark-100 focus-visible:focus-ring', dest === d.slug && 'bg-primary-50 text-primary-600')}>{d.name}</button>
              </li>
            ))}
          </ul>
        </Popover>
        <span aria-hidden="true" className="hidden h-10 w-px shrink-0 bg-dark-200 lg:block" />
        <Popover open={openR} onOpenChange={setOpenR} triggerClassName={cn(trig, 'lg:min-w-0 lg:flex-1 lg:pl-6 xl:w-[270px] xl:flex-none')} trigger={<Segment icon={<CalIcon />} label={t('dates')} value={dates} placeholder={t('datesPlaceholder')} />} className="border-0 shadow-none">
          <Calendar mode="range" value={range} onChange={(v) => { setRange(v); if (v.length === 2) setOpenR(false); }} locale={intlLocale[locale]} prevLabel={ta('prevMonth')} nextLabel={ta('nextMonth')} hint={t('pastUnavailable')} />
        </Popover>
        <span aria-hidden="true" className="hidden h-10 w-px shrink-0 bg-dark-200 lg:block" />
        <Popover triggerClassName={cn(trig, 'lg:min-w-0 lg:flex-1 lg:pl-6 xl:w-[280px] xl:flex-none')} trigger={<Segment icon={<Users />} label={t('travellers')} value={people} />} className="w-80 p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4"><span className="text-body-m text-dark-900">{t('adults')}</span><Counter label={t('adults')} value={adults} min={1} max={9} onChange={setAdults} decrementLabel={tA('decrease')} incrementLabel={tA('increase')} /></div>
            <div className="flex items-center justify-between gap-4"><span className="text-body-m text-dark-900">{t('children')}</span><Counter label={t('children')} value={children} min={0} max={6} onChange={setChildren} decrementLabel={tA('decrease')} incrementLabel={tA('increase')} /></div>
          </div>
        </Popover>
        {/* Единственная primary-кнопка на экране (правило UI №1) */}
        <Button type="submit" variant="primary" size="L" className="w-full lg:ml-auto lg:w-auto">{t('find')}</Button>
      </form>
    </div>
  );
}
