'use client';
import { Alert, Button, Checkbox, DateTextInput, HoldTimer, Input, PageContainer, SeatMap, Stepper, cn, type SeatMapCell, type SeatState } from '@samanid/ui';
import { api, type ChangePreview, type Order, type Traveller } from '@samanid/api';
import { type Locale } from '@samanid/i18n';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Shield, Users, Check } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { useCountdown } from '@/components/waitlist/useCountdown';
import { dateRange, dayMonth, money } from '@/lib/format';
import { OrderGate } from './OrderGate';
import { useSetOrder } from './useOrder';

type What = { date: boolean; travellers: boolean; addons: boolean };
interface Draft { what: What; departure_id?: string; seats?: string[]; addon_ids?: string[]; travellers?: Traveller[]; preview?: ChangePreview }
const KEY = (id: string) => `st_change_draft_${id}`;
function useDraft(id: string): [Draft, (d: Draft) => void] {
  const [d, setD] = useState<Draft>({ what: { date: true, travellers: false, addons: false } });
  useEffect(() => { try { const r = sessionStorage.getItem(KEY(id)); if (r) setD(JSON.parse(r) as Draft); } catch { /* ignore */ } }, [id]);
  const save = (n: Draft) => { setD(n); try { sessionStorage.setItem(KEY(id), JSON.stringify(n)); } catch { /* ignore */ } };
  return [d, save];
}
const stepKeys = ['what', 'details', 'recalc', 'done'] as const;

function Shell({ order, step, children, timer }: { order: Order; step: (typeof stepKeys)[number]; children: ReactNode; timer?: string }) {
  const t = useTranslations('orderChange'); const tt = useTranslations('checkout.timer');
  const idx = stepKeys.indexOf(step); const left = useCountdown(timer ?? new Date(0).toISOString());
  return (
    <PageContainer className="mx-auto max-w-[900px] pt-6 pb-24 md:pt-10">
      <div className="flex items-center justify-between gap-4">
        <Link href={`/checkout/${order.id}/success` as never} className="inline-flex items-center gap-2 text-body-s text-dark-800 focus-visible:focus-ring"><ArrowLeft className="size-[18px]" aria-hidden="true" />{t('back', { number: order.number })}</Link>
        {timer && <HoldTimer remainingSeconds={left} labels={{ normal: tt('normal'), warning: tt('warning'), expired: tt('expired') }} compact />}
      </div>
      <h1 className="mt-4 text-h3 text-dark-900 md:text-h1">{t('title')}</h1>
      <div className="mt-4"><Stepper steps={stepKeys.map((k) => t(`steps.${k}`))} current={idx + 1} stepOfLabel={t('stepOf', { n: idx + 1 })} label={t('nav')} /></div>
      <div className="mt-6">{children}</div>
    </PageContainer>
  );
}

function What({ order }: { order: Order }) {
  const t = useTranslations('orderChange'); const router = useRouter(); const [d, save] = useDraft(order.id); const q = useQuery({ queryKey: ['settings'], queryFn: () => api.settings() });
  const opts = [{ k: 'date' as const, I: Calendar }, { k: 'travellers' as const, I: Users }, { k: 'addons' as const, I: Shield }];
  const any = d.what.date || d.what.travellers || d.what.addons;
  return (
    <Shell order={order} step="what">
      <ul className="grid gap-4 md:grid-cols-3">{opts.map(({ k, I }) => { const on = d.what[k]; return (
        <li key={k}><button type="button" role="checkbox" aria-checked={on} onClick={() => save({ ...d, what: { ...d.what, [k]: !on } })}
          className={cn('flex h-full w-full flex-col gap-3 rounded-lg border p-5 text-left focus-visible:focus-ring', on ? 'border-[1.5px] border-primary-500 bg-primary-50' : 'border-dark-200 bg-white')}>
          <span className="flex items-center justify-between"><I className="size-6 text-primary-500" aria-hidden="true" /><span aria-hidden="true" className={cn('flex size-5 items-center justify-center rounded-xs border-[1.5px]', on ? 'border-primary-500 bg-primary-500 text-white' : 'border-dark-300 bg-white')}>{on && <Check className="size-3.5" />}</span></span>
          <span className="text-body-m-medium text-dark-900">{t(`opts.${k}`)}</span><span className="text-body-s text-dark-600">{t(`opts.${k}Text`)}</span></button></li>); })}</ul>
      <div className="mt-4"><Alert type="info" title={t('infoTitle')}>{t('infoText', { days: q.data?.refund_days ?? 7 })}</Alert></div>
      <div className="mt-6 flex items-center justify-between"><Link href={`/checkout/${order.id}/success` as never} className="px-3 py-2 text-button-m text-primary-500">{t('cancel')}</Link>
        <Button variant="secondary" size="L" disabled={!any} onClick={() => router.push(`/orders/${order.id}/change/details` as never)}>{t('next')}</Button></div>
    </Shell>
  );
}

function Details({ order }: { order: Order }) {
  const t = useTranslations('orderChange'); const tt = useTranslations('checkout'); const ts = useTranslations('checkout.seats'); const tp = useTranslations('checkout.travellers');
  const locale = useLocale() as Locale; const router = useRouter(); const [d, save] = useDraft(order.id); const [busy, setBusy] = useState(false);
  const { data: tour } = useQuery({ queryKey: ['tour', order.tour.slug], queryFn: () => api.tour(order.tour.slug) });
  const { data: addons } = useQuery({ queryKey: ['addons'], queryFn: () => api.addons() });
  const depId = d.departure_id ?? order.departure.id;
  const { data: rows } = useQuery({ queryKey: ['seatmap', depId], queryFn: () => api.orders.seatMap(depId) });
  const seats = d.seats ?? order.seats; const total = order.travellers.length;
  const cells: SeatMapCell[][] = useMemo(() => (rows ?? []).map((r) => r.map((c): SeatMapCell => c.kind === 'aisle' ? { kind: 'aisle', label: c.label } : { kind: 'seat', code: c.code!, state: seats.includes(c.code!) ? 'selected' : (c.state as SeatState) })), [rows, seats]);
  const labels = { available: ts('state.available'), selected: ts('state.selected'), held: ts('state.held'), occupied: ts('state.occupied'), unavailable: ts('state.unavailable'), child: ts('state.child') } as Record<SeatState, string>;
  const addonIds = d.addon_ids ?? order.addon_ids; const trav = d.travellers ?? order.travellers;
  const ready = (!d.what.date || seats.length === total);
  const submit = async () => { setBusy(true); const p = await api.orders.changePreview(order.id, { departure_id: d.what.date ? depId : undefined, seats: d.what.date ? seats : undefined, addon_ids: d.what.addons ? addonIds : undefined, travellers: d.what.travellers ? trav : undefined }); save({ ...d, preview: p }); router.push(`/orders/${order.id}/change/recalc` as never); };
  return (
    <Shell order={order} step="details">
      <div className="flex flex-col gap-6">
        {d.what.date && tour && (
          <section aria-labelledby="nd"><h2 id="nd" className="mb-3 text-h5 text-dark-900">{t('newDate')}</h2>
            <ul role="radiogroup" aria-labelledby="nd" className="flex flex-col gap-3">{tour.departures.map((dep) => { const sel = dep.id === depId; const out = dep.seats_left === 0 && dep.id !== order.departure.id; return (
              <li key={dep.id}><button type="button" role="radio" aria-checked={sel} disabled={out} onClick={() => save({ ...d, departure_id: dep.id, seats: [] })}
                className={cn('flex w-full items-center gap-4 rounded-lg border px-4 py-3.5 text-left focus-visible:focus-ring', sel ? 'border-[1.5px] border-primary-500 bg-primary-50' : 'border-dark-200 bg-white', out && 'opacity-60')}>
                <span aria-hidden="true" className={cn('flex size-5 items-center justify-center rounded-full border-[1.5px]', sel ? 'border-primary-500' : 'border-dark-300')}>{sel && <span className="size-2.5 rounded-full bg-primary-500" />}</span>
                <span className="flex-1"><span className="block text-body-m-medium text-dark-900">{dateRange(dep.from, dep.to, locale)}</span><span className={cn('text-caption', out ? 'text-error-700' : 'text-dark-500')}>{out ? t('noSeats') : t('seatsLeft', { count: dep.seats_left })}</span></span>
                <span className="text-h6 font-extrabold text-dark-900">{money(dep.price, locale)}</span></button></li>); })}</ul>
            <h3 className="mt-6 mb-3 text-h5 text-dark-900">{t('seatsOn', { date: dayMonth(tour.departures.find((x) => x.id === depId)!.from, locale) })}</h3>
            <div className="flex justify-center"><SeatMap rows={cells} stateLabels={labels} entranceLabel={ts('entrance')} driverLabel={ts('driver')} onSelect={(c) => save({ ...d, seats: seats.includes(c) ? seats.filter((x) => x !== c) : seats.length < total ? [...seats, c] : seats })} /></div>
            <p role="status" className="mt-2 text-center text-body-s text-dark-600">{seats.length === total ? ts('progress', { selected: seats.length, total }) : ts('need', { count: total - seats.length })}</p>
          </section>)}
        {d.what.travellers && (
          <section aria-labelledby="nt"><h2 id="nt" className="mb-3 text-h5 text-dark-900">{t('travellersTitle')}</h2>
            <div className="flex flex-col gap-4">{trav.map((tr, i) => (
              <div key={tr.id} className="grid gap-4 rounded-lg border border-dark-200 bg-white p-4 md:grid-cols-2">
                <Input label={tp('fullName')} value={tr.full_name} onChange={(e) => save({ ...d, travellers: trav.map((x, j) => (j === i ? { ...x, full_name: e.target.value.toUpperCase() } : x)) })} />
                <DateTextInput label={tp('passport')} placeholder={tp('datePh')} value={tr.passport_expires} onValueChange={(v) => save({ ...d, travellers: trav.map((x, j) => (j === i ? { ...x, passport_expires: v } : x)) })} />
              </div>))}</div></section>)}
        {d.what.addons && (
          <section aria-labelledby="na"><h2 id="na" className="mb-3 text-h5 text-dark-900">{t('addonsTitle')}</h2>
            <ul className="flex flex-col gap-2">{(addons ?? []).filter((a) => ['ins', 'seat', 'guide', 'shahi'].includes(a.id)).map((a) => <li key={a.id} className="flex items-center justify-between rounded-lg border border-dark-200 bg-white px-4 py-2"><Checkbox label={`${a.title} · ${money(a.price, locale)}`} checked={addonIds.includes(a.id)} onCheckedChange={(c) => save({ ...d, addon_ids: c === true ? [...addonIds, a.id] : addonIds.filter((x) => x !== a.id) })} /></li>)}</ul></section>)}
      </div>
      <div className="mt-6 flex items-center justify-between"><Link href={`/orders/${order.id}/change/what` as never} className="px-3 py-2 text-button-m text-primary-500">{tt('prev')}</Link>
        <Button variant="secondary" size="L" disabled={!ready} loading={busy} onClick={submit}>{t('recalcBtn')}</Button></div>
    </Shell>
  );
}

function Recalc({ order }: { order: Order }) {
  const t = useTranslations('orderChange.recalc'); const tr = useTranslations('orderChange'); const locale = useLocale() as Locale; const router = useRouter(); const setOrder = useSetOrder(order.id);
  const [d] = useDraft(order.id); const [busy, setBusy] = useState(false); const p = d.preview;
  if (!p) return <Shell order={order} step="recalc"><p className="text-body-m text-dark-600"><Link href={`/orders/${order.id}/change/what` as never} className="text-primary-500">{tr('steps.what')}</Link></p></Shell>;
  const col = (title: string, b: ChangePreview['before'], hl: boolean) => (
    <div className={cn('flex flex-1 flex-col gap-2 rounded-lg p-4', hl ? 'border border-primary-500 bg-primary-50' : 'bg-bg-page')}>
      <p className="text-overline text-dark-500 uppercase">{title}</p>
      {[['tour', b.tour], ['addons', b.addons], ['discounts', b.discounts]].map(([k, v]) => <p key={k as string} className="flex justify-between text-body-s text-dark-600"><span>{t(k as 'tour')}</span><span className="text-dark-900">{(v as number) < 0 ? '−' : ''}{money(Math.abs(v as number), locale)}</span></p>)}
      <p className="mt-1 flex items-baseline justify-between"><span className="text-body-m-medium text-dark-900">{t('total')}</span><span className="text-h4 font-extrabold text-dark-900">{money(b.total, locale)}</span></p>
    </div>);
  const confirm = async () => { setBusy(true); const r = await api.orders.changeConfirm(order.id, p.change_id); setOrder(r.order); router.push(`/orders/${order.id}/change/done` as never); };
  return (
    <Shell order={order} step="recalc" timer={p.hold_expires_at}>
      <section className="rounded-xl border border-dark-200 bg-white p-5 md:p-6"><h2 className="text-h5 text-dark-900">{t('title')}</h2>
        <div className="mt-4 flex flex-col items-stretch gap-3 md:flex-row md:items-center">{col(t('was'), p.before, false)}<span aria-hidden="true" className="self-center text-dark-400">→</span>{col(t('now'), p.after, true)}</div>
        <div className="mt-4">{p.delta > 0 ? <Alert type="warning" title={t('payTitle', { amount: money(p.delta, locale) })}>{t('payText')}</Alert> : p.delta < 0 ? <Alert type="success" title={t('refundTitle', { amount: money(-p.delta, locale) })}>{t('refundText', { days: p.refund_days })}</Alert> : <Alert type="info" title={t('sameTitle')}>{t('sameText')}</Alert>}</div>
      </section>
      <div className="mt-6 flex items-center justify-between"><Link href={`/orders/${order.id}/change/details` as never} className="px-3 py-2 text-button-m text-primary-500">{t('back')}</Link>
        <Button variant={p.delta > 0 ? 'primary' : 'secondary'} size="L" loading={busy} onClick={confirm}>{p.delta > 0 ? t('pay', { amount: money(p.delta, locale) }) : t('confirm')}</Button></div>
    </Shell>
  );
}

function Done({ order }: { order: Order }) {
  const t = useTranslations('orderChange.done'); const locale = useLocale() as Locale; const router = useRouter(); const [d] = useDraft(order.id); const p = d.preview;
  return (
    <Shell order={order} step="done">
      <section className="flex flex-col items-center gap-4 rounded-xl border border-dark-200 bg-white p-8 text-center">
        <span aria-hidden="true" className="flex size-[60px] items-center justify-center rounded-full bg-success-600 text-white"><Check className="size-8" /></span>
        <h2 role="status" className="text-h3 text-dark-900">{t('title')}</h2>
        <p className="max-w-[560px] text-body-s text-dark-600">{t('text', { dates: `${dateRange(order.departure.from, order.departure.to, locale)} ${order.departure.to.slice(0, 4)}` })}{p && p.delta < 0 ? ` ${t('refund', { amount: money(-p.delta, locale), days: p.refund_days })}` : ''}</p>
        <div className="flex items-center gap-4"><Button variant="secondary" size="L" onClick={() => window.print()}>{t('download')}</Button><Link href={`/checkout/${order.id}/success` as never} className="text-button-m text-primary-500">{t('toOrder')}</Link></div>
      </section>
    </Shell>
  );
}

export function ChangeScreen({ id, step }: { id: string; step: string }) {
  return <OrderGate id={id} allow="any">{(o) => step === 'details' ? <Details order={o} /> : step === 'recalc' ? <Recalc order={o} /> : step === 'done' ? <Done order={o} /> : <What order={o} />}</OrderGate>;
}
export { Input };
