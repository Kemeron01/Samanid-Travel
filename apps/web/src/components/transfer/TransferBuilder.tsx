'use client';
import { Alert, Button, Checkbox, Counter, DateInput, PriceRow, SegmentedControl, Select, Switch, Textarea, cn } from '@samanid/ui';
import { AddressInput } from '@samanid/ui';
import { api, type CarClass, type Place, type TransferOptions, type TransferQuote } from '@samanid/api';
import { intlLocale, type Locale } from '@samanid/i18n';
import { Bus, Car, Clock, GripVertical, Info, MapPin, Pencil, Plus, Route, Trash2 } from 'lucide-react';
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

function RouteMap({ pts, order, label, badge, className }: { pts: Pt[]; order: number[]; label: string; badge?: string; className?: string }) {
  // Figma 24:4418: плавная линия маршрута, точки 28px с белой обводкой, подписи — белые «пилюли» (caption, тень sm).
  const n = order.length;
  const pos = (i: number) => ({ x: 11 + (i * 74) / Math.max(n - 1, 1), y: 80 - (i * 60) / Math.max(n - 1, 1) - (i % 2 ? 6 : 0) });
  const p = order.map((_, i) => pos(i));
  const d = p.map((q, i) => { if (!i) return `M${q.x} ${q.y}`; const a = p[i - 1]!; const mx = (a.x + q.x) / 2; return `C${mx} ${a.y} ${mx} ${q.y} ${q.x} ${q.y}`; }).join(' ');
  return (
    <div role="img" aria-label={label} className={cn('relative h-[180px] overflow-hidden rounded-2xl bg-primary-50 md:h-[360px] md:border md:border-dark-200', className)}>
      {badge && <span aria-hidden="true" className="absolute top-3 left-3 z-10 rounded-sm bg-white px-2.5 py-1.5 text-caption text-dark-900 shadow-sm md:hidden">{badge}</span>}
      <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
        <path d={d} fill="none" stroke="var(--color-primary-500)" strokeWidth="4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {order.map((o, i) => (
        <div key={o} aria-hidden="true" className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1" style={{ left: `${p[i]!.x}%`, top: `${p[i]!.y}%` }}>
          <span className={cn('size-5 shrink-0 rounded-full border-[3px] border-white md:size-7', i === 0 ? 'bg-accent-500' : i === n - 1 ? 'bg-dark-900' : 'bg-primary-500')} />
          <span className="absolute left-full ml-1 hidden rounded-sm bg-white px-2.5 py-1.5 text-caption whitespace-nowrap text-dark-900 shadow-sm md:block">{letter(i, n - 1)} · {short(pts[o]?.text ?? '')}</span>
        </div>
      ))}
    </div>
  );
}

export function TransferBuilder({ options }: { options: TransferOptions }) {
  const tA = useTranslations('a11y');
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
  const [editing, setEditing] = useState<string | null>(null);
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
  const durText = dur ? (dur.m ? t('duration', dur) : t('durationHours', { h: dur.h })) : '—';
  const carName = t(`cars.${car}`);
  const valid = complete && !!date && !over && !!quote;
  const book = () => { setTouched(true); if (!valid) return; router.push({ pathname: '/checkout', query: { type: 'transfer', points: ids.join(','), date: date!, time, pax: String(pax), car, child: child ? '1' : '0' } } as never); };
  const card = 'flex flex-col gap-4 rounded-2xl border border-dark-200 bg-white p-4 md:p-7';
  // Mobile (25:4464): разделы 2–4 без карточек, заголовки скрыты.
  const flat = 'flex flex-col gap-4 md:rounded-2xl md:border md:border-dark-200 md:bg-white md:p-7';
  const hd = 'text-h5 text-dark-900';

  return (
    <div className="grid gap-6 lg:grid-cols-[640px_1fr] lg:items-start lg:gap-8">
      <div className="flex min-w-0 flex-col gap-4 md:gap-6">
        <RouteMap pts={pts} order={order} label={t('mapLabel')} badge={quote ? `${t('km', { km: quote.total_km })} · ${durText}` : undefined} className="lg:hidden" />
        <section aria-labelledby="t-route" className={card}>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 max-md:sr-only"><h2 id="t-route" className={hd}>{t('route')}</h2><Switch label={t('optimize')} checked={optimize} onCheckedChange={setOptimize} /></div>
          <ol className={cn('flex flex-col gap-3 md:gap-4', pts.every((p) => p.place && editing !== p.id) && 'max-md:hidden')}>
            {pts.map((p, i) => {
              const isMid = i > 0 && i < last; const err = touched && !p.place ? t('required') : undefined;
              return (
                <li key={p.id} draggable={isMid} onDragStart={() => { drag.current = i; }} onDragOver={(e) => { if (isMid && drag.current !== null) e.preventDefault(); }} onDrop={() => { if (drag.current !== null) move(drag.current, i); drag.current = null; }}
                  className={cn('grid grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-3 max-md:rounded-lg max-md:border max-md:border-dark-200 max-md:p-3', isMid ? 'md:grid-cols-[28px_20px_minmax(0,1fr)_48px]' : 'md:grid-cols-[28px_minmax(0,1fr)]', editing !== p.id && p.place && 'max-md:hidden')}>
                  <span aria-hidden="true" className={cn('mt-9 flex size-7 items-center justify-center rounded-full text-caption text-white md:mt-[38px]', i === 0 ? 'bg-accent-500' : i === last ? 'bg-dark-900' : 'bg-primary-500')}>{letter(i, last)}</span>
                  {isMid && <span className="hidden md:block">{(
                    <button type="button" aria-label={t('moveHandle', { n: i })} onKeyDown={(e) => { if (e.key === 'ArrowUp') { e.preventDefault(); move(i, i - 1); } if (e.key === 'ArrowDown') { e.preventDefault(); move(i, i + 1); } }} className="mt-[60px] cursor-grab text-dark-400 focus-visible:focus-ring"><GripVertical className="size-5" aria-hidden="true" /></button>)}</span>}
                  <PlaceField pt={p} label={i === 0 ? t('from') : i === last ? t('to') : t('stop', { n: i })} placeholder={t('placeholder')} listLabel={t('suggestions')} error={err} onChange={(x) => { patch(i, x); if (x.place) setEditing(null); }} />
                  {isMid && <span className="mt-7 md:mt-8"><button type="button" aria-label={t('removeStop', { n: i })} onClick={() => remove(i)} className="inline-flex size-12 items-center justify-center rounded-full text-error-600 hover:bg-error-100 focus-visible:focus-ring"><Trash2 className="size-5" aria-hidden="true" /></button></span>}
                </li>
              );
            })}
          </ol>
          {/* Mobile 25:4474: компактные строки (метка, подпись, значение, карандаш/ручка); тап — редактирование. */}
          <ul className="flex flex-col gap-3 md:hidden">
            {pts.map((p, i) => p.place && editing !== p.id && (
              <li key={p.id}>
                <button type="button" onClick={() => setEditing(p.id)} className="flex min-h-[58px] w-full items-center gap-2.5 rounded-lg border border-dark-200 px-3 text-left focus-visible:focus-ring">
                  <span aria-hidden="true" className={cn('flex size-6 shrink-0 items-center justify-center rounded-full text-caption text-white', i === 0 ? 'bg-accent-500' : i === last ? 'bg-dark-900' : 'bg-primary-500')}>{letter(i, last)}</span>
                  <span className="flex min-w-0 flex-1 flex-col"><span className="text-caption text-dark-500">{i === 0 ? t('from') : i === last ? t('to') : t('stop', { n: i })}</span><span className="truncate text-body-s-medium text-dark-900">{p.text}</span></span>
                  {i > 0 && i < last ? <GripVertical className="size-[18px] shrink-0 text-dark-400" aria-hidden="true" /> : <Pencil className="size-[18px] shrink-0 text-dark-400" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
          {pts.length - 2 < options.max_stops
            ? <button type="button" onClick={addStop} className="flex items-center gap-2 self-start rounded-xs text-body-s-medium text-primary-500 focus-visible:focus-ring md:ml-10"><Plus className="size-[18px]" aria-hidden="true" /><span className="max-md:hidden">{t('addStop', { max: options.max_stops })}</span><span className="md:hidden">{t('addStopShort')}</span></button>
            : <p className="text-caption text-dark-500">{t('tooMany', { max: options.max_stops })}</p>}
          {quote && quote.saved_km > 0 && <Alert type="info" title={t('optimized')}>{t('optimizedText', { km: quote.saved_km })}</Alert>}
        </section>

        <section aria-labelledby="t-when" className={flat}>
          <h2 id="t-when" className={cn(hd, 'max-md:sr-only')}>{t('when')}</h2>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <DateInput label={t('date')} placeholder={t('date')} locale={intlLocale[locale]} prevLabel={ta('prevMonth')} nextLabel={ta('nextMonth')} value={date} onValueChange={setDate} />
            <Select label={t('time')} placeholder={t('time')} value={time} onValueChange={setTime} options={options.time_slots.map((s) => ({ value: s, label: s }))} />
          </div>
          <div className="flex items-center justify-between gap-4"><div><p className="text-body-m-medium text-dark-900">{t('passengers')}</p><p className="text-caption text-dark-500 max-md:hidden">{t('passengersHint')}</p></div>
            <Counter label={t('passengers')} value={pax} min={1} max={16} onChange={setPax} decrementLabel={tA('decrease')} incrementLabel={tA('increase')} /></div>
          {over && <p role="alert" className="text-caption text-error-700">{t('over', { max: maxPax })}</p>}
          <Checkbox label={<><span className="max-md:hidden">{t('child')}</span><span className="md:hidden">{t('childShort', { price: money(options.child_seat_price, locale) })}</span></>} checked={child} onCheckedChange={(c) => setChild(c === true)} />
          {child && (
            <div className="flex items-start gap-4 rounded-lg border-[1.5px] border-primary-500 bg-primary-50 p-5 max-md:hidden">
              <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-md bg-white text-primary-500"><Info className="size-5" /></span>
              <div className="flex-1"><p className="text-body-m-medium text-dark-900">{t('childSeat')}</p><p className="text-body-s text-dark-600">{t('childSeatText')}</p><p className="mt-1 text-body-s-medium text-primary-600">{t('perItem', { price: money(options.child_seat_price, locale) })}</p></div>
            </div>
          )}
        </section>

        <section aria-labelledby="t-car" className={flat}>
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

        <section aria-labelledby="t-note" className={flat}>
          <h2 id="t-note" className={cn(hd, 'max-md:sr-only')}>{t('wishes')}</h2>
          <Textarea label={<><span className="md:hidden">{t('wishes')}</span><span className="max-md:hidden">{t('wishesLabel')}</span></>} placeholder={t('wishesPlaceholder')} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          <p className="-mt-3 text-caption text-dark-500 max-md:hidden">{note.length} / 500</p>
          <div className="flex flex-wrap gap-2 max-md:hidden">{(['sign', 'wait', 'luggage'] as const).map((k) => <button key={k} type="button" onClick={() => setNote((n) => (n ? `${n}\n` : '') + t(`chips.${k}`).replace(/^\+\s*/, ''))} className="min-h-10 rounded-full border border-dark-200 bg-white px-4 text-body-s text-dark-700 hover:bg-dark-100 focus-visible:focus-ring">{t(`chips.${k}`)}</button>)}</div>
        </section>
      </div>

      <aside className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-24" id="breakdown">
        <RouteMap pts={pts} order={order} label={t('mapLabel')} className="max-lg:hidden" />
        <ul className="grid grid-cols-3 gap-3 max-md:hidden">
          {[{ I: Route, v: quote ? t('km', { km: quote.total_km }) : '—', l: t('kmLabel') }, { I: Clock, v: durText, l: t('timeLabel') }, { I: MapPin, v: String(Math.max(pts.length - 2, 0)), l: t('stopsLabel', { count: Math.max(pts.length - 2, 0) }) }].map(({ I, v, l }) => (
            <li key={l} className="flex items-center gap-3 rounded-lg border border-dark-200 bg-white p-4"><I className="size-[22px] shrink-0 text-primary-500" aria-hidden="true" /><div><p className="text-body-m-medium text-dark-900">{v}</p><p className="text-caption text-dark-500">{l}</p></div></li>))}
        </ul>
        <div className="rounded-xl border border-dark-200 bg-white p-5 md:rounded-2xl md:p-7" aria-live="polite" aria-busy={loading}>
          <h2 className="text-h5 text-dark-900">{t('breakdown')}</h2>
          {!complete ? <p className="mt-4 text-body-s text-dark-500">{t('needPoints')}</p> : !quote ? <p className="mt-4 text-body-s text-dark-500">{t('calculating')}</p> : (
            <>
              <div className="mt-3 flex flex-col gap-3">
                {quote.lines.map((l, i) => {
                  const label = l.kind === 'base' ? t('baseFareFor', { car: carName }) : l.kind === 'segment' ? t('segment', { label: `${letter(l.segment!, quote.segments.length)} → ${letter(l.segment! + 1, quote.segments.length)} · ${short(pts.find((p) => p.place?.id === quote.segments[l.segment!]!.from)?.text ?? '')} → ${short(pts.find((p) => p.place?.id === quote.segments[l.segment!]!.to)?.text ?? '')}`, km: l.km }) : l.kind === 'time' ? t('drive', { h: dur!.h, m: dur!.m, rate: money(options.hourly_rate, locale) }) : t('seatLine');
                  return <PriceRow key={i} label={label} amount={money2(l.amount, locale)} />;
                })}
              </div>
              <div className="mt-3"><PriceRow type="total" label={t('total')} amount={money2(quote.total, locale)} /></div>
              <p className="mt-3 flex items-start gap-2 text-caption text-dark-500"><Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{t('note', { minutes: options.free_wait_minutes })}</p>
            </>
          )}
          <Button variant="primary" size="L" className="mt-3 w-full max-md:hidden" onClick={book} disabled={!!(touched && !valid)}>{t('book')}</Button>
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-dark-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <div><p className="text-h4 font-extrabold text-dark-900">{quote ? money2(quote.total, locale) : '—'}</p><a href="#breakdown" className="text-caption text-primary-500">{t('priceBreakdown')}</a></div>
        <Button variant="primary" size="L" onClick={book}>{t('bookShort')}</Button>
      </div>
    </div>
  );
}
