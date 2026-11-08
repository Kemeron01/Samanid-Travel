'use client';
import { Alert, Button, Checkbox, Counter, DateInput, PriceRow, SegmentedControl, Select, Switch, Textarea, cn } from '@samanid/ui';
import { AddressInput } from '@samanid/ui';
import { api, type CarClass, type Place, type TransferOptions, type TransferQuote } from '@samanid/api';
import { intlLocale, type Locale } from '@samanid/i18n';
import { Bus, Car, GripVertical, Info, MapPin, Plus, Route, Timer, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { money, money2 } from '@/lib/format';

interface Pt { id: string; text: string; place?: Place }
let uid = 0; const nid = () => `p${++uid}`;
const short = (s: string) => s.split(/[,(]/)[0]!.trim().split(' ').slice(0, 2).join(' ');
const letter = (i: number, last: number) => (i === 0 ? 'A' : i === last ? 'B' : String(i));
const carIcon = { sedan: Car, minivan: Bus, microbus: Bus } as const;

/** Одно поле места с автодополнением (источник — api.places; в проде геокодер). */
function PlaceField({ pt, label, onChange, error, listLabel, placeholder }: { pt: Pt; label: string; onChange: (p: Pt) => void; error?: string; listLabel: string; placeholder: string }) {
  const [sug, setSug] = useState<Place[]>([]);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  const search = (q: string) => { clearTimeout(t.current); t.current = setTimeout(() => { api.places(q).then(setSug); }, 150); };
  return (
    <AddressInput label={label} placeholder={placeholder} value={pt.text} listLabel={listLabel} error={error}
      onValueChange={(v) => { onChange({ ...pt, text: v, place: undefined }); search(v); }}
      suggestions={sug.map((p) => ({ id: p.id, title: p.title, subtitle: p.subtitle }))}
      onSelect={(o) => onChange({ ...pt, text: o.title, place: sug.find((p) => p.id === o.id) })} />
  );
}

function RouteMap({ pts, order, label }: { pts: Pt[]; order: number[]; label: string }) {
  const n = order.length; const x = (i: number) => 50 + (i * 600) / Math.max(n - 1, 1); const y = (i: number) => 230 - (i * 150) / Math.max(n - 1, 1) - (i % 2 ? 25 : 0);
  const path = order.map((_, i) => `${i ? 'L' : 'M'}${x(i)} ${y(i)}`).join(' ');
  return (
    <div role="img" aria-label={label} className="relative h-[220px] overflow-hidden rounded-2xl bg-primary-50 md:h-[360px]">
      <svg aria-hidden="true" viewBox="0 0 700 300" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full">
        <path d={path} fill="none" stroke="var(--color-primary-500)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
        {order.map((o, i) => <g key={o}><circle cx={x(i)} cy={y(i)} r="10" fill={i === 0 ? 'var(--color-accent-500)' : i === n - 1 ? 'var(--color-dark-900)' : 'var(--color-primary-500)'} stroke="var(--color-white)" strokeWidth="3" />
          <text x={i === n - 1 ? x(i) - 16 : x(i) + 16} y={y(i) - 14} textAnchor={i === n - 1 ? 'end' : 'start'} fontSize="13" fontWeight="600" fill="var(--color-dark-900)">{letter(i, n - 1)} · {short(pts[o]?.text ?? '')}</text></g>)}
      </svg>
    </div>
  );
}

export function TransferBuilder({ options }: { options: TransferOptions }) {
  const t = useTranslations('transferPage');
  const ta = useTranslations('a11y');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [pts, setPts] = useState<Pt[]>(() => [
    { id: nid(), text: 'Аэропорт Ташкент (TAS)', place: { id: 'tas', title: 'Аэропорт Ташкент (TAS)', subtitle: '' } },
    { id: nid(), text: 'Водохранилище Чарвак, смотровая', place: { id: 'charvak', title: 'Водохранилище Чарвак, смотровая', subtitle: '' } },
    { id: nid(), text: 'Канатная дорога Чимган', place: { id: 'cable', title: 'Канатная дорога Чимган', subtitle: '' } },
    { id: nid(), text: 'Hotel Uzbekistan, Ташкент', place: { id: 'uzb', title: 'Hotel Uzbekistan', subtitle: '' } },
  ]);
  const [optimize, setOptimize] = useState(true);
  const [date, setDate] = useState<string | undefined>('2027-05-14');
  const [time, setTime] = useState('09:30');
  const [pax, setPax] = useState(3);
  const [child, setChild] = useState(true);
  const [car, setCar] = useState<CarClass>('minivan');
  const [note, setNote] = useState('2 больших чемодана, рейс может задержаться');
  const [quote, setQuote] = useState<TransferQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const seq = useRef(0);
  const drag = useRef<number | null>(null);
  const last = pts.length - 1;
  const complete = pts.every((p) => p.place);
  const maxPax = options.classes.find((c) => c.id === car)!.max_passengers;
  const over = pax > maxPax;

  const ids = useMemo(() => pts.map((p) => p.place?.id ?? ''), [pts]);
  useEffect(() => {
    if (!complete || !date || over) { setQuote(null); return; }
    const n = ++seq.current; setLoading(true);
    const h = setTimeout(() => {
      api.transferQuote({ points: ids, date, time, passengers: pax, car, child_seat: child, optimize })
        .then((q) => { if (n === seq.current) setQuote(q); }).finally(() => { if (n === seq.current) setLoading(false); });
    }, 200);
    return () => clearTimeout(h);
  }, [ids, complete, date, time, pax, car, child, optimize, over]);

  const move = useCallback((from: number, to: number) => setPts((p) => { if (to < 1 || to > p.length - 2 || from === to) return p; const n = [...p]; const [m] = n.splice(from, 1); n.splice(to, 0, m!); return n; }), []);
  const patch = (i: number, p: Pt) => setPts((a) => a.map((x, j) => (j === i ? p : x)));
  const addStop = () => setPts((a) => [...a.slice(0, -1), { id: nid(), text: '' }, a[a.length - 1]!]);
  const remove = (i: number) => setPts((a) => a.filter((_, j) => j !== i));
  const order = quote?.order ?? pts.map((_, i) => i);
  const dur = quote ? { h: Math.floor(quote.drive_minutes / 60), m: quote.drive_minutes % 60 } : null;
  const carName = t(`cars.${car}`);
  const valid = complete && !!date && !over && !!quote;
  const book = () => { setTouched(true); if (!valid) return; router.push({ pathname: '/checkout', query: { type: 'transfer', points: ids.join(','), date: date!, time, pax: String(pax), car, child: child ? '1' : '0' } } as never); };
  const card = 'flex flex-col gap-5 rounded-xl border border-dark-200 bg-white p-5 md:p-7';
  const hd = 'text-h5 text-dark-900';

  return (
    <div className="grid gap-6 lg:grid-cols-[640px_1fr] lg:items-start lg:gap-8">
      <div className="flex min-w-0 flex-col gap-6">
        <section aria-labelledby="t-route" className={card}>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"><h2 id="t-route" className={hd}>{t('route')}</h2><Switch label={t('optimize')} checked={optimize} onCheckedChange={setOptimize} /></div>
          <ol className="flex flex-col gap-3">
            {pts.map((p, i) => {
              const isMid = i > 0 && i < last; const err = touched && !p.place ? t('required') : undefined;
              return (
                <li key={p.id} draggable={isMid} onDragStart={() => { drag.current = i; }} onDragOver={(e) => { if (isMid && drag.current !== null) e.preventDefault(); }} onDrop={() => { if (drag.current !== null) move(drag.current, i); drag.current = null; }}
                  className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-3 max-md:rounded-lg max-md:border max-md:border-dark-200 max-md:p-3 md:grid-cols-[28px_20px_minmax(0,1fr)_auto]">
                  <span aria-hidden="true" className={cn('mt-9 flex size-7 items-center justify-center rounded-full text-caption text-white md:mt-9', i === 0 ? 'bg-accent-500' : i === last ? 'bg-dark-900' : 'bg-primary-500')}>{letter(i, last)}</span>
                  <span className="hidden md:block">{isMid && (
                    <button type="button" aria-label={t('moveHandle', { n: i })} onKeyDown={(e) => { if (e.key === 'ArrowUp') { e.preventDefault(); move(i, i - 1); } if (e.key === 'ArrowDown') { e.preventDefault(); move(i, i + 1); } }} className="mt-9 cursor-grab text-dark-400 focus-visible:focus-ring"><GripVertical className="size-5" aria-hidden="true" /></button>)}</span>
                  <PlaceField pt={p} label={i === 0 ? t('from') : i === last ? t('to') : t('stop', { n: i })} placeholder={t('placeholder')} listLabel={t('suggestions')} error={err} onChange={(x) => patch(i, x)} />
                  <span className="mt-9">{isMid && <button type="button" aria-label={t('removeStop', { n: i })} onClick={() => remove(i)} className="inline-flex size-10 items-center justify-center rounded-full text-error-600 hover:bg-error-100 focus-visible:focus-ring"><Trash2 className="size-5" aria-hidden="true" /></button>}</span>
                </li>
              );
            })}
          </ol>
          {pts.length - 2 < options.max_stops
            ? <button type="button" onClick={addStop} className="flex min-h-10 items-center gap-2 self-start text-body-s-medium text-primary-500 focus-visible:focus-ring"><Plus className="size-4" aria-hidden="true" /><span className="max-md:hidden">{t('addStop', { max: options.max_stops })}</span><span className="md:hidden">{t('addStopShort')}</span></button>
            : <p className="text-caption text-dark-500">{t('tooMany', { max: options.max_stops })}</p>}
          {quote && quote.saved_km > 0 && <Alert type="info" title={t('optimized')}>{t('optimizedText', { km: quote.saved_km })}</Alert>}
        </section>

        <section aria-labelledby="t-when" className={card}>
          <h2 id="t-when" className={hd}>{t('when')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <DateInput label={t('date')} placeholder={t('date')} locale={intlLocale[locale]} prevLabel={ta('prevMonth')} nextLabel={ta('nextMonth')} value={date} onValueChange={setDate} />
            <Select label={t('time')} placeholder={t('time')} value={time} onValueChange={setTime} options={options.time_slots.map((s) => ({ value: s, label: s }))} />
          </div>
          <div className="flex items-center justify-between gap-4"><div><p className="text-body-m-medium text-dark-900">{t('passengers')}</p><p className="text-caption text-dark-500">{t('passengersHint')}</p></div>
            <Counter label={t('passengers')} value={pax} min={1} max={16} onChange={setPax} decrementLabel="−" incrementLabel="+" /></div>
          {over && <p role="alert" className="text-caption text-error-700">{t('over', { max: maxPax })}</p>}
          <Checkbox label={<><span className="max-md:hidden">{t('child')}</span><span className="md:hidden">{t('childShort', { price: money(options.child_seat_price, locale) })}</span></>} checked={child} onCheckedChange={(c) => setChild(c === true)} />
          {child && (
            <div className="flex items-start gap-4 rounded-lg border-[1.5px] border-primary-500 bg-primary-50 p-5 max-md:hidden">
              <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-md bg-white text-primary-500"><Info className="size-5" /></span>
              <div className="flex-1"><p className="text-body-m-medium text-dark-900">{t('childSeat')}</p><p className="text-body-s text-dark-600">{t('childSeatText')}</p><p className="mt-1 text-body-s-medium text-primary-600">{t('perItem', { price: money(options.child_seat_price, locale) })}</p></div>
            </div>
          )}
        </section>

        <section aria-labelledby="t-car" className={card}>
          <h2 id="t-car" className={cn(hd, 'max-md:sr-only')}>{t('carClass')}</h2>
          <p className="text-body-m-medium text-dark-900 md:hidden" aria-hidden="true">{t('carClassShort')}</p>
          <div className="md:hidden"><SegmentedControl label={t('carClassShort')} value={car} onValueChange={(v) => setCar(v as CarClass)} options={options.classes.slice(0, 2).map((c) => ({ value: c.id, label: t(`cars.${c.id}`) }))} /></div>
          <div role="radiogroup" aria-labelledby="t-car" className="grid grid-cols-3 gap-3 max-md:hidden">
            {options.classes.map((c) => { const I = carIcon[c.id]; const sel = c.id === car; return (
              <button key={c.id} type="button" role="radio" aria-checked={sel} onClick={() => setCar(c.id)} className={cn('relative flex flex-col gap-1.5 rounded-lg border p-4 text-left focus-visible:focus-ring', sel ? 'border-[1.5px] border-primary-500 bg-primary-50' : 'border-dark-200 bg-white hover:bg-dark-100')}>
                <I className={cn('size-6', sel ? 'text-primary-500' : 'text-dark-600')} aria-hidden="true" />
                <span className="text-body-m-medium text-dark-900">{t(`cars.${c.id}`)}</span><span className={cn('text-caption', sel ? 'text-primary-600' : 'text-dark-500')}>{t('upTo', { count: c.max_passengers })}</span>
                <span className={cn('text-body-s-medium', sel ? 'text-primary-600' : 'text-dark-900')}>{t('perKm', { price: money2(c.price_per_km, locale) })}</span>
                <span aria-hidden="true" className={cn('absolute top-4 right-4 flex size-6 items-center justify-center rounded-full border-[1.5px]', sel ? 'border-primary-500' : 'border-dark-300')}>{sel && <span className="size-2.5 rounded-full bg-primary-500" />}</span>
              </button>); })}
          </div>
        </section>

        <section aria-labelledby="t-note" className={card}>
          <h2 id="t-note" className={cn(hd, 'max-md:sr-only')}>{t('wishes')}</h2>
          <Textarea label={t('wishesLabel')} placeholder={t('wishesPlaceholder')} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          <p className="-mt-3 text-caption text-dark-500">{note.length} / 500</p>
          <div className="flex flex-wrap gap-2 max-md:hidden">{(['sign', 'wait', 'luggage'] as const).map((k) => <button key={k} type="button" onClick={() => setNote((n) => (n ? `${n}\n` : '') + t(`chips.${k}`).replace(/^\+\s*/, ''))} className="min-h-10 rounded-full border border-dark-200 bg-white px-4 text-body-s text-dark-700 hover:bg-dark-100 focus-visible:focus-ring">{t(`chips.${k}`)}</button>)}</div>
        </section>
      </div>

      <aside className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-24" id="breakdown">
        <RouteMap pts={pts} order={order} label={t('mapLabel')} />
        <ul className="grid grid-cols-3 gap-3 max-md:hidden">
          {[{ I: Route, v: quote ? t('km', { km: quote.total_km }) : '—', l: t('kmLabel') }, { I: Timer, v: dur ? t('duration', dur) : '—', l: t('timeLabel') }, { I: MapPin, v: String(Math.max(pts.length - 2, 0)), l: t('stopsLabel', { count: Math.max(pts.length - 2, 0) }) }].map(({ I, v, l }) => (
            <li key={l} className="flex items-center gap-3 rounded-lg border border-dark-200 bg-white p-4"><I className="size-6 shrink-0 text-primary-500" aria-hidden="true" /><div><p className="text-body-m-medium text-dark-900">{v}</p><p className="text-caption text-dark-500">{l}</p></div></li>))}
        </ul>
        <div className="rounded-xl border border-dark-200 bg-white p-6" aria-live="polite" aria-busy={loading}>
          <h2 className="text-h6 text-dark-900">{t('breakdown')}</h2>
          {!complete ? <p className="mt-4 text-body-s text-dark-500">{t('needPoints')}</p> : !quote ? <p className="mt-4 text-body-s text-dark-500">{t('calculating')}</p> : (
            <>
              <div className="mt-4 flex flex-col gap-3">
                {quote.lines.map((l, i) => {
                  const label = l.kind === 'base' ? t('baseFareFor', { car: carName }) : l.kind === 'segment' ? t('segment', { label: `${letter(l.segment!, quote.segments.length)} → ${letter(l.segment! + 1, quote.segments.length)} · ${short(pts.find((p) => p.place?.id === quote.segments[l.segment!]!.from)?.text ?? '')} → ${short(pts.find((p) => p.place?.id === quote.segments[l.segment!]!.to)?.text ?? '')}`, km: l.km }) : l.kind === 'time' ? t('drive', { h: dur!.h, m: dur!.m, rate: money(options.hourly_rate, locale) }) : t('seatLine');
                  return <PriceRow key={i} label={label} amount={money2(l.amount, locale)} />;
                })}
              </div>
              <div className="mt-4"><PriceRow type="total" label={t('total')} amount={money2(quote.total, locale)} /></div>
              <p className="mt-3 flex items-start gap-2 text-caption text-dark-500"><Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{t('note', { minutes: options.free_wait_minutes })}</p>
            </>
          )}
          <Button variant="primary" size="L" className="mt-5 w-full max-md:hidden" onClick={book} disabled={!!(touched && !valid)}>{t('book')}</Button>
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-dark-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <div><p className="text-h4 font-extrabold text-dark-900">{quote ? money2(quote.total, locale) : '—'}</p><a href="#breakdown" className="text-caption text-primary-500">{t('priceBreakdown')}</a></div>
        <Button variant="primary" size="L" onClick={book}>{t('bookShort')}</Button>
      </div>
    </div>
  );
}
