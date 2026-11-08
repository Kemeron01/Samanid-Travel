'use client';
import { Button, Modal, Media, ReviewCard, Tag, cn, type ImageTone } from '@samanid/ui';
import { Car, ChevronDown, Check, CircleCheck, Clock, Eye, MapPin, Ticket, X } from 'lucide-react';
import type { DayPlan, Departure, ReviewsSummary, TourDetail } from '@samanid/api';
import { intlLocale, type Locale } from '@samanid/i18n';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { dayMonth, money } from '@/lib/format';
import { useBooking } from './BookingContext';

const tones: ImageTone[] = ['sky', 'sand', 'sunset', 'mountain', 'night'];
const card = 'rounded-xl border border-dark-200 bg-white p-5 md:p-7 scroll-mt-28';
const h2 = 'text-h5 text-dark-900 md:text-h4';

export function Gallery({ tour }: { tour: TourDetail }) {
  const t = useTranslations('tourPage');
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="relative -mx-4 md:mx-0">
        <Media tone={tour.image.tone} src={tour.image.src} alt={tour.image.alt} caption={tour.region} className="relative h-[280px] md:hidden" />
        <span className="absolute right-4 bottom-4 rounded-full bg-dark-900/70 px-3 py-1 text-caption text-white md:hidden">{t('photoCounter', { count: tour.photos_count })}</span>
        <div className="hidden h-[456px] gap-4 md:grid md:grid-cols-[760fr_504fr]">
          <Media tone={tour.image.tone} src={tour.image.src} alt={tour.image.alt} caption={tour.region} className="relative rounded-xl" />
          <div className="grid grid-cols-2 grid-rows-2 gap-4">
            {[1, 2, 3].map((i) => <Media key={i} tone={tones[i % tones.length]!} caption={`${tour.region} ${i}`} className="relative rounded-xl" />)}
            <button type="button" onClick={() => setOpen(true)} className="relative overflow-hidden rounded-xl focus-visible:focus-ring">
              <Media tone="night" className="absolute inset-0" />
              <span className="absolute inset-0 flex items-center justify-center gap-2 bg-dark-900/50 text-body-m-medium text-white"><Eye className="size-5" aria-hidden="true" />{t('photos', { count: tour.photos_count })}</span>
            </button>
          </div>
        </div>
      </div>
      <Modal open={open} onOpenChange={setOpen} title={t('photos', { count: tour.photos_count })} closeLabel="×">
        <div className="grid max-h-[60dvh] grid-cols-2 gap-3 overflow-y-auto">
          {Array.from({ length: Math.min(tour.photos_count, 12) }, (_, i) => <Media key={i} tone={tones[i % tones.length]!} caption={`${i + 1}`} className="relative aspect-[4/3] rounded-lg" />)}
        </div>
      </Modal>
    </>
  );
}

export function SectionNav({ count }: { count: number }) {
  const t = useTranslations('tourPage.tabs');
  const items = [['overview', t('overview')], ['program', t('program')], ['included', t('included')], ['dates', t('dates')], ['reviews', t('reviews', { count })]] as const;
  const [active, setActive] = useState('overview');
  useEffect(() => {
    const io = new IntersectionObserver((es) => { const v = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]; if (v) setActive(v.target.id); }, { rootMargin: '-140px 0px -65% 0px' });
    items.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <nav aria-label={t('nav')} className="sticky top-16 z-30 -mx-4 bg-bg-page px-4 md:top-20 md:mx-0 md:px-0">
      <ul className="flex snap-x gap-8 overflow-x-auto [scrollbar-width:none]">
        {items.map(([id, label]) => (
          <li key={id} className="shrink-0 snap-start">
            <a href={`#${id}`} aria-current={active === id ? 'true' : undefined}
              className={cn('relative flex min-h-11 items-center whitespace-nowrap text-body-m-medium focus-visible:focus-ring', active === id ? 'text-primary-500 after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-xs after:bg-primary-500' : 'text-dark-600')}>{label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Overview({ tour }: { tour: TourDetail }) {
  const t = useTranslations('tourPage');
  return (
    <section id="overview" className={card}>
      <h2 className={h2}>{t('about')}</h2>
      <p className="mt-4 text-body-s text-dark-700 md:text-body-m">{tour.description}</p>
      <ul className="mt-5 grid gap-3 md:grid-cols-2">
        {tour.highlights.map((h) => <li key={h} className="flex items-center gap-2.5 text-body-s-medium text-dark-900 md:text-body-s md:font-normal"><CircleCheck className="size-5 shrink-0 text-success-600" aria-hidden="true" />{h}</li>)}
      </ul>
    </section>
  );
}

const badgeIcon = { car: Car, ticket: Ticket, 'map-pin': MapPin } as const;

export function Itinerary({ days }: { days: DayPlan[] }) {
  const t = useTranslations('tourPage');
  const [open, setOpen] = useState<Set<number>>(new Set([0]));
  const [showAll, setShowAll] = useState(false);
  const toggle = (i: number) => setOpen((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  const allOpen = open.size === days.length;
  const visible = showAll ? days : days.slice(0, 3);
  return (
    <section id="program" className={card}>
      <div className="flex items-center justify-between gap-4">
        <h2 className={h2}><span className="md:hidden">{t('program')}</span><span className="hidden md:inline">{t('programFull')}</span></h2>
        <button type="button" onClick={() => setOpen(allOpen ? new Set() : new Set(days.map((_, i) => i)))} className="hidden min-h-10 text-body-s-medium text-primary-500 focus-visible:focus-ring md:block">{allOpen ? t('collapseAll') : t('expandAll')}</button>
      </div>
      <ul className="mt-4 flex flex-col md:divide-y md:divide-dark-200 max-md:gap-3">
        {visible.map((d, i) => {
          const isOpen = open.has(i);
          return (
            <li key={i} className="max-md:rounded-lg max-md:border max-md:border-dark-200 max-md:p-4 md:py-5">
              <h3>
                <button type="button" aria-expanded={isOpen} aria-controls={`day-${i}`} onClick={() => toggle(i)} className="flex w-full items-center gap-3 text-left focus-visible:focus-ring">
                  <span className={cn('rounded-full px-3 py-1.5 text-caption whitespace-nowrap', isOpen ? 'bg-primary-500 text-white' : 'bg-primary-50 text-primary-600')}>{t('day', { n: i + 1 })}</span>
                  <span className="flex-1 text-body-s-medium text-dark-900 md:text-body-m-medium">{d.title}</span>
                  <ChevronDown className={cn('size-5 shrink-0 text-dark-600 transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
                </button>
              </h3>
              {isOpen && d.body && (
                <div id={`day-${i}`} className="mt-3 flex flex-col gap-3 md:pl-[84px]">
                  <p className="text-body-s text-dark-600">{d.body}</p>
                  {d.badges && <ul className="hidden flex-wrap gap-4 md:flex">{d.badges.map((b) => { const I = badgeIcon[b.icon]; return <li key={b.label} className="flex items-center gap-2 text-caption text-dark-600"><I className="size-5" aria-hidden="true" />{b.label}</li>; })}</ul>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {!showAll && days.length > 3 && <button type="button" onClick={() => setShowAll(true)} className="mt-4 min-h-10 text-body-s-medium text-primary-500 md:hidden">{t('moreDays', { count: days.length - 3 })}</button>}
    </section>
  );
}

export function Included({ tour }: { tour: TourDetail }) {
  const t = useTranslations('tourPage');
  const col = (title: string, items: string[], ok: boolean) => (
    <div><h3 className={cn('text-body-m-medium', ok ? 'text-success-700' : 'text-error-700')}>{title}</h3>
      <ul className="mt-3 flex flex-col gap-3">{items.map((x) => <li key={x} className="flex items-start gap-2.5 text-body-s text-dark-700">{ok ? <Check className="mt-0.5 size-5 shrink-0 text-success-600" aria-hidden="true" /> : <X className="mt-0.5 size-5 shrink-0 text-error-600" aria-hidden="true" />}{x}</li>)}</ul></div>
  );
  return (
    <section id="included" className={card}>
      <h2 className={h2}>{t('includedTitle')}</h2>
      <div className="mt-5 grid gap-6 md:grid-cols-2 md:gap-6">{col(t('included'), tour.included, true)}{col(t('notIncluded'), tour.excluded, false)}</div>
    </section>
  );
}

const wd = (iso: string, l: Locale) => { const s = new Intl.DateTimeFormat(intlLocale[l], { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`)); return s.charAt(0).toUpperCase() + s.slice(1).replace('.', ''); };

export function Departures({ tour }: { tour: TourDetail }) {
  const t = useTranslations('tourPage');
  const locale = useLocale() as Locale;
  const { departureId, setDepartureId } = useBooking();
  const row = (d: Departure) => {
    const sel = d.id === departureId; const out = d.seats_left === 0; const low = !out && d.seats_left <= 3;
    const action = out ? t('dates.waitlist') : sel ? t('dates.selected') : t('dates.select');
    return (
      <li key={d.id}>
        <button type="button" role="radio" aria-checked={sel} onClick={() => { setDepartureId(d.id); if (out) document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' }); }}
          className={cn('grid w-full items-center gap-x-4 gap-y-1 rounded-lg border px-4 py-3.5 text-left focus-visible:focus-ring max-md:grid-cols-[28px_1fr_auto] md:grid-cols-[200px_130px_130px_1fr_auto] md:px-4',
            sel ? 'border-[1.5px] border-primary-500 bg-primary-50' : 'border-dark-200 bg-white hover:bg-dark-100')}>
          <span aria-hidden="true" className={cn('flex size-5 items-center justify-center rounded-full border-[1.5px] md:hidden', sel ? 'border-primary-500' : out ? 'border-dark-200 bg-dark-100' : 'border-dark-300')}>{sel && <span className="size-2.5 rounded-full bg-primary-500" />}</span>
          <span className="flex flex-col"><span className="text-body-m-medium text-dark-900">{dayMonth(d.from, locale)} — {dayMonth(d.to, locale)}</span>
            <span className="hidden text-caption text-dark-500 md:block">{wd(d.from, locale)} — {wd(d.to, locale)}</span>
            <span className={cn('text-caption md:hidden', out ? 'text-error-700' : low ? 'text-warning-700' : 'text-dark-500')}>{out ? t('dates.noSeats') : t('dates.seatsLeft', { count: d.seats_left })}</span></span>
          <span className="hidden md:block">{out ? <span className="text-body-s-medium text-error-700">{t('dates.noSeats')}</span> : low ? <Tag type="seatsLeft">{t('dates.seatsOf', { free: d.seats_left, total: d.capacity })}</Tag> : <span className="text-body-s text-dark-900">{t('dates.seatsOf', { free: d.seats_left, total: d.capacity })}</span>}</span>
          <span className="flex items-baseline gap-2 max-md:justify-end md:col-auto"><span className="text-h5 font-extrabold text-dark-900">{money(d.price, locale)}</span>{d.old_price && <span className="hidden text-caption text-dark-400 line-through md:inline">{money(d.old_price, locale)}</span>}</span>
          <span className="hidden md:block" />
          <span className={cn('hidden min-h-10 items-center rounded-full px-5 text-button-m md:inline-flex', sel ? 'bg-primary-500 text-white' : 'border-[1.5px] border-primary-500 text-primary-500')}>{action}</span>
          {out && <span className="text-body-s-medium text-primary-500 md:hidden">{t('dates.waitlist')} →</span>}
        </button>
      </li>
    );
  };
  return (
    <section id="dates" className={card}>
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className={h2}>{t('dates.title')}</h2><p className="hidden text-caption text-dark-500 md:block">{t('dates.note', { percent: tour.child_discount_percent })}</p></div>
      <div className="mt-4 hidden grid-cols-[200px_130px_130px_1fr] gap-x-4 rounded-md bg-bg-page px-4 py-2.5 text-caption text-dark-500 md:grid"><span>{t('dates.departure')}</span><span>{t('dates.seats')}</span><span>{t('dates.price')}</span></div>
      <ul role="radiogroup" aria-label={t('dates.title')} className="mt-4 flex flex-col gap-3 md:mt-3">{tour.departures.map(row)}</ul>
      <p className="mt-4 flex items-start gap-2 text-caption text-dark-500"><Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{t('dates.dynamic')}</p>
    </section>
  );
}

/** Схема маршрута. Карта — внешний виджет (Google/Yandex) по решению дизайна; пока декоративный плейсхолдер + доступный список остановок. */
export function RouteMap({ stops }: { stops: string[] }) {
  const t = useTranslations('tourPage');
  return (
    <section id="route" className={cn(card, 'max-md:hidden')}>
      <h2 className={h2}>{t('route')}</h2>
      <div className="relative mt-5 h-[300px] overflow-hidden rounded-lg bg-primary-50">
        <svg aria-hidden="true" viewBox="0 0 744 300" className="absolute inset-0 size-full"><path d="M60 230 C 200 250, 300 190, 430 150 S 600 80, 690 70" fill="none" stroke="var(--color-primary-500)" strokeWidth="2.5" strokeDasharray="6 6" /><circle cx="60" cy="230" r="9" fill="var(--color-accent-500)" /><circle cx="430" cy="150" r="7" fill="var(--color-primary-500)" /><circle cx="690" cy="70" r="9" fill="var(--color-dark-900)" /></svg>
      </div>
      <ol aria-label={t('routeStops')} className="mt-4 flex flex-wrap gap-2">{stops.map((s, i) => <li key={s} className="rounded-sm bg-bg-page px-3 py-1.5 text-caption text-dark-700">{i + 1}. {s}</li>)}</ol>
    </section>
  );
}

export function ReviewsBlock({ tour }: { tour: TourDetail }) {
  const t = useTranslations('tourPage');
  const tv = useTranslations('home.reviews');
  const locale = useLocale() as Locale;
  const s: ReviewsSummary = tour.reviews_summary;
  const initials = (n: string) => n.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const month = (d: string) => { const x = new Intl.DateTimeFormat(intlLocale[locale], { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`)); return x.charAt(0).toUpperCase() + x.slice(1); };
  return (
    <section id="reviews" className={card}>
      <div className="flex items-baseline justify-between gap-2"><h2 className={h2}>{t('reviews.title')}</h2><p className="hidden text-caption text-dark-500 md:block">{t('reviews.afterTrip')}</p></div>
      <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-1"><p className="text-[56px] leading-[64px] font-extrabold text-dark-900">{s.rating.toFixed(1)}</p>
          <div><p role="img" aria-label={t('reviews.stars', { n: s.rating.toFixed(1) })} className="flex gap-0.5">{Array.from({ length: 5 }, (_, i) => <svg key={i} aria-hidden="true" viewBox="0 0 24 24" className="size-[18px] fill-accent-500"><path d="M12 2l3 6.5 7 .9-5.2 4.8 1.4 7L12 17.8 5.8 21.2l1.4-7L2 9.4l7-.9z" /></svg>)}</p><p className="mt-1 text-caption text-dark-500">{t('reviews.count', { count: s.count })}</p></div></div>
        <ul className="flex flex-1 flex-col gap-2" aria-label={t('reviews.title')}>{s.distribution.map((p, i) => (
          <li key={i} className="flex items-center gap-3 text-caption text-dark-600"><span className="w-2">{5 - i}</span><span className="h-2 flex-1 overflow-hidden rounded-full bg-dark-100"><span className="block h-full rounded-full bg-accent-500" style={{ width: `${Math.max(p, p > 0 ? 1 : 0)}%` }} /></span><span className="w-8 text-right">{p}%</span></li>))}</ul>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">{tour.reviews.map((r) => <ReviewCard key={r.id} initials={initials(r.author)} name={r.author} meta={`${month(r.date)} · ${r.tour_title}`} rating={r.rating} text={r.text} verifiedLabel={tv('verified')} />)}</div>
      <Button variant="outline" className="mt-6 border-primary-500 text-primary-500">{t('reviews.all', { count: s.count })}</Button>
    </section>
  );
}

