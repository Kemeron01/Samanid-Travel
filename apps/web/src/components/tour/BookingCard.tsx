'use client';
import { Alert, Button, Counter, DateRangeInput, PriceRow, Select, Tag, Textarea, cn, formatISO } from '@samanid/ui';
import { api, type Departure, type Settings } from '@samanid/api';
import { intlLocale, type Locale } from '@samanid/i18n';
import { Clock, Shield, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { dateLong, dayMonth, money } from '@/lib/format';
import { useBooking } from './BookingContext';

const addDays = (iso: string, n: number) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

function useDepOption() {
  const t = useTranslations('tourPage.booking');
  const locale = useLocale() as Locale;
  return (d: Departure) => t('option', { from: dayMonth(d.from, locale), to: dateLong(d.to, locale), seats: d.seats_left === 0 ? t('optionNone') : t('optionSeats', { count: d.seats_left }) });
}

/** Блок бронирования (Figma 21:3140 + варианты 22:3248): групповой / лист ожидания / индивидуальный запрос. */
export function BookingCard({ settings }: { settings: Settings }) {
  const { tour } = useBooking();
  if (tour.type === 'individual') return <IndividualCard settings={settings} />;
  return <GroupCard settings={settings} />;
}

const shell = 'flex flex-col gap-5 rounded-2xl border border-dark-200 bg-white p-7 shadow-md';

function GroupCard({ settings }: { settings: Settings }) {
  const tA = useTranslations('a11y');
  const t = useTranslations('tourPage');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { tour, departureId, setDepartureId, adults, setAdults, children, setChildren, quote, quoting } = useBooking();
  const dep = tour.departures.find((d) => d.id === departureId)!;
  const opt = useDepOption();
  const soldOut = dep.seats_left === 0;
  const cancelDays = settings.cancellation_deadline_days;
  const select = (
    <Select label={t('booking.departure')} placeholder="" value={departureId} onValueChange={setDepartureId}
      options={tour.departures.map((d) => ({ value: d.id, label: opt(d) }))} />
  );
  const price = (
    <p className="flex items-baseline gap-2">
      <span className="text-body-s text-dark-500">{t('booking.from')}</span>
      <span className="text-[28px] leading-9 font-extrabold text-dark-900">{money(dep.price, locale)}</span>
      {dep.old_price && <span className="text-body-m text-dark-400 line-through">{money(dep.old_price, locale)}</span>}
      <span className="text-body-s text-dark-500">{t('booking.perAdult')}</span>
    </p>
  );

  if (soldOut) return <WaitlistCard price={price} select={select} hours={settings.waitlist_window_hours} />;

  // Mobile (22:3401): карточки нет — бронирование через нижнюю закреплённую панель.
  return (
    <div className={cn(shell, 'max-md:hidden')}>
      {price}
      {dep.price_may_rise && (
        <Alert type="warning" title={t('booking.demand', { seats: dep.seats_left, date: dayMonth(dep.from, locale) })}>{t('booking.demandText')}</Alert>
      )}
      {select}
      <div className="flex flex-col gap-3">
        <p className="text-body-s-medium text-dark-700">{t('booking.travellers')}</p>
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-body-m-medium text-dark-900">{t('booking.adults')}</p><p className="text-caption text-dark-500">{t('booking.adultsHint')}</p></div>
          <Counter label={t('booking.adults')} value={adults} min={1} max={Math.min(9, dep.seats_left)} onChange={setAdults} decrementLabel={tA('decrease')} incrementLabel={tA('increase')} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-body-m-medium text-dark-900">{t('booking.children')}</p><p className="text-caption text-dark-500">{t('booking.childrenHint', { percent: tour.child_discount_percent })}</p></div>
          <Counter label={t('booking.children')} value={children} min={0} max={Math.min(6, Math.max(dep.seats_left - adults, 0))} onChange={setChildren} decrementLabel={tA('decrease')} incrementLabel={tA('increase')} />
        </div>
      </div>
      <hr className="border-dark-200" />
      <div className="flex flex-col gap-2.5" aria-live="polite" aria-busy={quoting}>
        {quote ? (
          <>
            {quote.lines.map((l) => <PriceRow key={l.kind} label={t(l.kind === 'adults' ? 'booking.lineAdults' : 'booking.lineChildren', { count: l.count, price: money(l.unit_price, locale) })} amount={money(l.amount, locale)} />)}
            <PriceRow type="total" label={t('booking.total')} amount={money(quote.total, locale)} />
          </>
        ) : <p className="text-body-s text-dark-500">{t('booking.calculating')}</p>}
      </div>
      <Button variant="primary" size="L" className="w-full" disabled={!quote}
        onClick={() => router.push({ pathname: '/checkout', query: { tour: tour.slug, departure: dep.id, adults: String(adults), children: String(children) } } as never)}>
        {t('booking.book')}
      </Button>
      <p className="flex items-center gap-2.5 text-caption text-dark-600"><Clock className="size-5 text-dark-500" aria-hidden="true" />{t('booking.holdNote', { minutes: settings.hold_minutes })}</p>
      {/* Блок условный: показывается только если API отдал cancellation_deadline_days */}
      {cancelDays !== null && (
        <div className="flex items-start gap-3 rounded-[14px] bg-success-100 px-4 py-3.5">
          <Shield className="size-5 shrink-0 text-success-700" aria-hidden="true" />
          <div className="flex flex-col gap-0.5"><p className="text-body-s-medium text-success-700">{t('booking.cancelTitle', { date: dayMonth(addDays(dep.from, -cancelDays), locale) })}</p>
            <p className="text-caption text-dark-700">{t('booking.cancelText', { days: cancelDays, refund: settings.refund_days })}</p></div>
        </div>
      )}
      <p className="text-body-s text-dark-600">{t('booking.ownDates')} <Link href="/tours?type=individual" className="font-semibold text-primary-500">{t('booking.individualLink')}</Link></p>
    </div>
  );
}

function WaitlistCard({ price, select, hours }: { price: React.ReactNode; select: React.ReactNode; hours: number }) {
  const tA = useTranslations('a11y');
  const t = useTranslations('tourPage');
  const locale = useLocale() as Locale;
  const { tour, departureId, setDepartureId } = useBooking();
  const [seats, setSeats] = useState(2);
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'fail'>('idle');
  const [pos, setPos] = useState<number | null>(null);
  // Figma 22:3248: ближайшие даты С МЕСТАМИ после выбранной (если таких нет — любые свободные).
  const cur = tour.departures.find((d) => d.id === departureId);
  const free = tour.departures.filter((d) => d.seats_left > 0);
  const after = cur ? free.filter((d) => d.from > cur.from) : [];
  const nearest = (after.length ? after : free).slice(0, 2);
  const join = async () => { setState('loading'); try { const r = await api.joinWaitlist({ tour: tour.slug, departure: departureId, seats }); setPos(r.position); setState('done'); } catch { setState('fail'); } };
  return (
    <div className={shell}>
      {price}{select}
      {state === 'done' ? (
        <Alert type="success" title={t('waitlist.joined')}>{t('waitlist.joinedText')}</Alert>
      ) : (
        <>
          <Alert type="error" title={t('waitlist.none')}>{t('waitlist.text', { hours })}</Alert>
          <div className="flex items-center gap-3 rounded-lg bg-bg-page px-4 py-3.5">
            <Users className="size-5 text-dark-600" aria-hidden="true" />
            <div><p className="text-body-s-medium text-dark-900">{t('waitlist.queue', { count: tour.waitlist_queue })}</p><p className="text-caption text-dark-500">{t('waitlist.position', { pos: tour.waitlist_queue + 1 })}</p></div>
          </div>
          <div className="flex items-center justify-between gap-4"><span className="text-body-m text-dark-900">{t('waitlist.seatsNeeded')}</span>
            <Counter label={t('waitlist.seatsNeeded')} value={seats} min={1} max={6} onChange={setSeats} decrementLabel={tA('decrease')} incrementLabel={tA('increase')} /></div>
          <Button variant="secondary" size="L" className="w-full" loading={state === 'loading'} onClick={join}>{t('waitlist.join')}</Button>
          {state === 'fail' && <p role="alert" className="text-caption text-error-700">{t('waitlist.failed')}</p>}
        </>
      )}
      {pos !== null && <p className="sr-only" role="status">{t('waitlist.position', { pos })}</p>}
      {nearest.length > 0 && (
        <div className="flex flex-col gap-2"><p className="text-body-s-medium text-dark-700">{t('waitlist.nearest')}</p>
          {nearest.map((d) => (
            <button key={d.id} type="button" onClick={() => setDepartureId(d.id)} className="flex items-center justify-between rounded-md border border-dark-200 px-3.5 py-2.5 text-left text-body-s text-dark-900 hover:bg-dark-100 focus-visible:focus-ring">
              <span>{t('waitlist.nearestRow', { from: dayMonth(d.from, locale), to: dayMonth(d.to, locale), seats: t('dates.seatsLeft', { count: d.seats_left }) })}</span>
              <span className="text-body-s-medium text-primary-600">{money(d.price, locale)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function IndividualCard({ settings }: { settings: Settings }) {
  const tA = useTranslations('a11y');
  const t = useTranslations('tourPage');
  const tt = useTranslations('tour');
  const ta = useTranslations('a11y');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { tour, adults, setAdults, children, setChildren } = useBooking();
  const [range, setRange] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [err, setErr] = useState<string>();
  const send = async () => {
    if (range.length < 2) { setErr(t('individual.datesRequired')); return; }
    setErr(undefined); setState('loading');
    const rec = await api.requestIndividual({ tour: tour.slug, date_from: range[0]!, date_to: range[1]!, adults, children });
    void note; setState('done'); router.push(`/requests/${rec.id}` as never);
  };
  if (state === 'done') return <div className={shell}><Alert type="success" title={t('individual.sent')}>{t('individual.sentText', { hours: settings.manager_response_hours })}</Alert></div>;
  return (
    <div className={shell}>
      <Tag type="individual" className="self-start">{tt('tags.individual')}</Tag>
      <p className="flex items-baseline gap-2"><span className="text-body-m text-dark-500">{t('individual.from')}</span><span className="text-[28px] leading-9 font-extrabold text-dark-900">{money(tour.individual?.price_from ?? tour.price_from, locale)}</span><span className="text-body-s text-dark-500">{t('individual.per', { count: tour.individual?.min_group ?? 2 })}</span></p>
      <DateRangeInput label={t('individual.dates')} placeholder={t('individual.datesPlaceholder')} locale={intlLocale[locale]} prevLabel={ta('prevMonth')} nextLabel={ta('nextMonth')} value={range} onValueChange={setRange} error={err} />
      <div className="flex flex-col gap-3"><p className="text-body-s-medium text-dark-700">{t('individual.group')}</p>
        <div className="flex items-center justify-between gap-4"><div><p className="text-body-m-medium text-dark-900">{t('booking.adults')}</p><p className="text-caption text-dark-500">{t('booking.adultsHint')}</p></div><Counter label={t('booking.adults')} value={adults} min={1} max={9} onChange={setAdults} decrementLabel={tA('decrease')} incrementLabel={tA('increase')} /></div>
        <div className="flex items-center justify-between gap-4"><div><p className="text-body-m-medium text-dark-900">{t('booking.children')}</p><p className="text-caption text-dark-500">{t('booking.childrenHintPlain')}</p></div><Counter label={t('booking.children')} value={children} min={0} max={6} onChange={setChildren} decrementLabel={tA('decrease')} incrementLabel={tA('increase')} /></div>
      </div>
      <Textarea label={t('individual.wishes')} placeholder={t('individual.wishesPlaceholder')} value={note} onChange={(e) => setNote(e.target.value)} />
      <Alert type="info" title={t('individual.infoTitle')}>{t('individual.infoText', { hours: settings.manager_response_hours })}</Alert>
      <Button variant="primary" size="L" className="w-full" loading={state === 'loading'} onClick={send}>{t('individual.send')}</Button>
    </div>
  );
}

/** Нижняя закреплённая панель на mobile: цена + кнопка, отступ под safe-area (правило адаптива). */
export function MobileBookingBar({ settings }: { settings: Settings }) {
  const t = useTranslations('tourPage');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { tour, departureId, adults, children, quote } = useBooking();
  const dep = tour.departures.find((d) => d.id === departureId)!;
  const soldOut = dep.seats_left === 0; const individual = tour.type === 'individual';
  const go = () => {
    if (soldOut || individual) document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
    else router.push({ pathname: '/checkout', query: { tour: tour.slug, departure: dep.id, adults: String(adults), children: String(children) } } as never);
  };
  void settings; void quote;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-dark-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="flex flex-col"><p className="flex items-baseline gap-1"><span className="text-h4 font-extrabold text-dark-900">{money(dep.price, locale)}</span><span className="text-caption text-dark-500">{t('booking.perAdultShort')}</span></p>
        <p className={cn('text-caption', soldOut ? 'text-error-700' : 'text-warning-700')}>{dayMonth(dep.from, locale)}–{dayMonth(dep.to, locale)} · {soldOut ? t('dates.noSeats') : t('dates.seatsLeft', { count: dep.seats_left })}</p></div>
      <Button variant={soldOut || individual ? 'secondary' : 'primary'} size="L" onClick={go}>{individual ? t('individual.send') : soldOut ? t('dates.waitlist') : t('booking.book')}</Button>
    </div>
  );
}
export { formatISO };
