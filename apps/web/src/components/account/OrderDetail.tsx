'use client';
import { Alert, Button, Modal, PaymentScheduleRow, Select, StatusBadge, StatusTimeline, type TimelineStep } from '@samanid/ui';
import { api, ageOn, type CancelPreview, type Order } from '@samanid/api';
import { type Locale } from '@samanid/i18n';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, Download, Gift, Shield, Ticket, TriangleAlert, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { OrderGate } from '@/components/checkout/OrderGate';
import { orderKey } from '@/components/checkout/useOrder';
import { dateRange, dayMonth, money } from '@/lib/format';

const card = 'rounded-xl border border-dark-200 bg-white p-5 md:p-6';
const today = () => new Date().toISOString().slice(0, 10);
const diffDays = (a: string, b: string) => Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86400000);
const time = (iso: string, l: Locale) => `${dayMonth(iso.slice(0, 10), l)}, ${iso.slice(11, 16)}`;

function CancelFlow({ order, open, onOpenChange }: { order: Order; open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations('account.cancel'); const locale = useLocale() as Locale; const router = useRouter(); const qc = useQueryClient();
  const { data: p } = useQuery({ queryKey: ['cancel-preview', order.id], queryFn: () => api.me.cancelPreview(order.id), enabled: open });
  const [reason, setReason] = useState<string>(); const [busy, setBusy] = useState(false); const [done, setDone] = useState<CancelPreview | null>(null);
  const dl = order.cancellation_deadline_days ?? 7;
  const confirm = async () => { setBusy(true); const o = await api.me.cancel(order.id, reason); qc.setQueryData(orderKey(order.id), o); void qc.invalidateQueries({ queryKey: ['me'] }); setDone(p!); setBusy(false); };
  const bullet = (I: typeof Clock, text: string) => <li className="flex items-start gap-2 text-body-s text-dark-700"><I className="mt-0.5 size-4 shrink-0 text-primary-500" aria-hidden="true" />{text}</li>;
  if (!p) return <Modal open={open} onOpenChange={onOpenChange} title={t('title')} closeLabel="×"><p role="status">…</p></Modal>;
  if (done) return (
    <Modal open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) router.refresh(); }} title={t('doneTitle')} closeLabel="×"
      footer={<Button variant="secondary" size="L" className="w-full" onClick={() => onOpenChange(false)}>{t('ok')}</Button>}>
      <p className="text-body-m text-dark-600">{done.refund > 0 ? `${t('doneText', { last4: done.card_last4, days: done.refund_days, date: dayMonth(new Date(Date.now() + done.refund_days * 86400000).toISOString().slice(0, 10), locale) })}${done.points || done.promo ? ` ${t('restored')}` : ''}` : t('doneTextNoRefund')}</p>
      {done.refund > 0 && <div className="flex items-center justify-between rounded-lg bg-bg-page px-4 py-3"><span className="text-body-m text-dark-900">{t('refundRow', { amount: money(done.refund, locale) })}</span><StatusBadge status="refunded" label={t('refundStatus')} /></div>}
    </Modal>);
  if (!p.allowed) return (
    <Modal open={open} onOpenChange={onOpenChange} title={t('lateTitle')} closeLabel="×"
      footer={<><Button variant="ghost" onClick={() => window.open('https://t.me/samanid_help', '_blank', 'noopener')}>{t('manager')}</Button><Button variant="secondary" onClick={() => router.push(`/orders/${order.id}/change/what` as never)}>{t('move')}</Button></>}>
      <Alert type="warning" title={t('lateWarn', { days: dl })}>{t('lateWarnText', { date: p.deadline ? dayMonth(p.deadline, locale) : '' })}</Alert>
      <p className="text-body-m text-dark-600">{t('lateText')}</p>
    </Modal>);
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={t('title')} closeLabel="×"
      description={t('lead', { tour: order.tour.title.split(':')[0]!, dates: `${dateRange(order.departure.from, order.departure.to, locale)} ${order.departure.to.slice(0, 4)}`, count: order.travellers.length })}
      footer={<><Button variant="ghost" onClick={() => onOpenChange(false)}>{t('keep')}</Button><Button variant="danger" size="L" loading={busy} onClick={confirm}>{p.refund > 0 ? t('confirm', { amount: money(p.refund, locale) }) : t('confirmNoRefund')}</Button></>}>
      <dl className="flex flex-col gap-2 rounded-lg bg-bg-page p-4 text-body-s">
        <div className="flex justify-between"><dt className="text-dark-600">{t('paid')}</dt><dd className="text-dark-900">{money(p.paid, locale)}</dd></div>
        <div className="flex justify-between"><dt className="text-dark-600">{t('penalty')}</dt><dd className="text-success-700">{money(p.penalty, locale)}</dd></div>
        <div className="flex items-baseline justify-between"><dt className="text-dark-600">{t('refund', { last4: p.card_last4 })}</dt><dd className="text-h5 font-extrabold text-dark-900">{money(p.refund, locale)}</dd></div>
      </dl>
      <ul className="flex flex-col gap-2">{bullet(Clock, t('b1', { days: p.refund_days }))}{p.points > 0 && bullet(Gift, t('b2', { points: p.points }))}{p.promo && bullet(Ticket, t('b3', { code: p.promo }))}{p.seats.length > 0 && bullet(Users, t('b4', { seats: p.seats.join(', ') }))}</ul>
      <Select label={t('reason')} placeholder={t('reasonPh')} value={reason} onValueChange={setReason} options={(['plans', 'price', 'health', 'other'] as const).map((k) => ({ value: k, label: t(`reasons.${k}`) }))} />
    </Modal>
  );
}

function Detail({ order }: { order: Order }) {
  const t = useTranslations('account.order'); const to = useTranslations('account.orders'); const ts = useTranslations('status'); const locale = useLocale() as Locale; const router = useRouter();
  const [cancel, setCancel] = useState(false);
  const dl = order.cancellation_deadline_days;
  const deadline = dl !== null ? (() => { const d = new Date(`${order.departure.from}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - dl); return d.toISOString().slice(0, 10); })() : null;
  const active = ['pending_payment', 'partially_paid', 'paid', 'confirmed'].includes(order.status);
  const paid = order.paid_amount ?? 0;
  const ev = order.events ?? [{ kind: 'created' as const, at: order.created_at }];
  const steps: TimelineStep[] = [
    ...ev.map((e) => ({ title: e.kind === 'paid' ? (order.payment_plan === 'installment' ? t('ev.deposit', { amount: money(e.amount ?? 0, locale) }) : t('ev.paid', { amount: money(e.amount ?? 0, locale) })) : e.kind === 'refunded' ? t('ev.refunded', { amount: money(e.amount ?? 0, locale) }) : t(`ev.${e.kind}` as never), meta: time(e.at, locale), state: 'done' as const })),
    ...(active ? [{ title: t('ev.trip'), meta: `${dayMonth(order.departure.from, locale)}, ${order.departure.meeting_time}`, state: 'current' as const }, { title: t('ev.completed'), state: 'todo' as const }] : order.status === 'completed' ? [{ title: t('ev.completed'), state: 'done' as const }] : []),
  ];
  const st = order.installment_state ?? {};
  return (
    <>
      <Link href="/account/orders" className="mb-4 inline-flex items-center gap-2 text-body-s text-dark-800 focus-visible:focus-ring"><ArrowLeft className="size-[18px]" aria-hidden="true" />{t('back')}</Link>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><div className="flex flex-wrap items-center gap-3"><StatusBadge status={order.status} label={ts(order.status)} /><span className="text-body-s text-dark-500">{to('booking', { number: order.number })}</span></div>
          <h1 className="mt-3 text-h3 text-dark-900 md:text-h2">{order.tour.title.split(':')[0]}</h1>
          <p className="mt-1 text-body-m text-dark-600">{dateRange(order.departure.from, order.departure.to, locale)} {order.departure.to.slice(0, 4)} · {t('meeting', { time: order.departure.meeting_time, place: order.departure.meeting_place })}</p></div>
        {active && <div className="flex items-center gap-3"><Button variant="outline" className="border-primary-500 text-primary-500" onClick={() => router.push(`/orders/${order.id}/change/what` as never)}>{t('change')}</Button><button type="button" onClick={() => setCancel(true)} className="min-h-11 rounded-full px-4 text-button-m text-error-600 hover:bg-error-100 focus-visible:focus-ring">{t('cancel')}</button></div>}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="flex min-w-0 flex-col gap-6">
          {active && deadline && today() <= deadline && <div className="flex items-start gap-3 rounded-xl bg-success-100 p-5"><Shield className="mt-0.5 size-5 shrink-0 text-success-700" aria-hidden="true" /><div><p className="text-body-m-medium text-success-700">{t('freeCancel', { date: `${dayMonth(deadline, locale)} ${deadline.slice(0, 4)}`, days: diffDays(today(), deadline) })}</p><p className="text-body-s text-dark-700">{t('freeCancelText', { deadline: dl, refund: order.refund_days })}</p></div></div>}
          {order.refund && <Alert type="info" title={t('refundNote', { amount: money(order.refund.amount, locale), date: dayMonth(order.refund.due, locale) })} />}
          <section className={card}><h2 className="text-h5 text-dark-900">{t('travellers')}</h2>
            <ul className="mt-4 flex flex-col gap-3">{order.travellers.map((tr, i) => { const age = tr.birth_date ? ageOn(tr.birth_date, order.departure.from) : null; return (
              <li key={tr.id} className="flex items-center gap-4 rounded-lg bg-bg-page p-3"><span className="flex size-10 items-center justify-center rounded-md bg-primary-500 text-body-s-medium text-white">{order.seats[i] ?? '—'}</span>
                <div><p className="text-body-m text-dark-900">{tr.full_name}</p><p className="text-caption text-dark-500">{tr.kind === 'adult' ? t('adult') : t('child', { age: age ?? 0 })}{tr.birth_date ? ` · ${tr.birth_date.split('-').reverse().join('.')}` : ''}{tr.kind === 'child' && order.addon_ids.includes('seat') ? ` · ${t('childSeat')}` : ''}</p></div></li>); })}</ul></section>
          {order.voucher && <section className={`${card} flex flex-col gap-3`}><div className="flex items-center justify-between gap-3"><h2 className="text-h5 text-dark-900">{t('voucher')}</h2><Button variant="secondary" onClick={() => router.push(`/checkout/${order.id}/success` as never)}>{t('pdf')} <Download className="size-4" aria-hidden="true" /></Button></div><p className="text-body-s text-dark-600">{t('voucherText', { email: order.contacts.email })}</p></section>}
          {(order.payment_plan === 'installment' || paid > 0) && (
            <section className={card}><h2 className="text-h5 text-dark-900">{order.payment_plan === 'installment' ? t('payment') : t('paymentFull')}</h2>
              <ul className="mt-4 flex flex-col gap-3">{order.payment_plan === 'installment' ? order.snapshot.installments.map((r) => { const s = st[r.n]; const d = diffDays(today(), r.due); return (
                <li key={r.n}><PaymentScheduleRow state={s === 'paid' ? 'paid' : s === 'overdue' ? 'overdue' : d <= 30 ? 'upcoming' : 'scheduled'} title={r.n === 1 ? t('deposit') : t('installment', { n: r.n })} date={`${dayMonth(r.due, locale)} ${r.due.slice(0, 4)}`}
                  amount={s === 'overdue' && order.penalty ? `${money(r.amount, locale)} + ${money(order.penalty, locale)}` : money(r.amount, locale)} statusLabel={s === 'paid' ? t('paidOk') : s === 'overdue' ? t('overdue', { days: -d }) : d <= 30 ? t('inDays', { days: d }) : t('scheduled')} /></li>); })
                : <li><PaymentScheduleRow state="paid" title={t('paymentFull')} date={time(order.events?.find((e) => e.kind === 'paid')?.at ?? order.created_at, locale)} amount={money(paid, locale)} statusLabel={t('paidOk')} /></li>}</ul></section>)}
        </div>
        <aside className="flex flex-col gap-6">
          <section className={card}><h2 className="text-h6 text-dark-900">{t('status')}</h2><StatusTimeline className="mt-4" steps={steps} /></section>
          <section className={card}><h2 className="text-h6 text-dark-900">{t('sum')}</h2>
            <dl className="mt-3 flex flex-col gap-2 text-body-s">{[[t('total'), order.snapshot.total], [t('paid'), paid], [t('left'), Math.max(order.snapshot.total - paid, 0)]].map(([k, v]) => <div key={k as string} className="flex justify-between"><dt className="text-dark-600">{k}</dt><dd className="text-body-s-medium text-dark-900">{money(v as number, locale)}</dd></div>)}</dl></section>
          <section className={card}><h2 className="text-h6 text-dark-900">{t('help')}</h2><p className="mt-2 text-body-s text-dark-600">{t('helpText')}</p></section>
        </aside>
      </div>
      {cancel && <CancelFlow order={order} open={cancel} onOpenChange={setCancel} />}
      <span className="sr-only"><TriangleAlert /></span>
    </>
  );
}

export function OrderDetailPage({ id }: { id: string }) { return <OrderGate id={id} allow="any">{(o) => <Detail order={o} />}</OrderGate>; }
