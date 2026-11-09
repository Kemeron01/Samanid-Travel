'use client';
import { Alert, Checkbox, cn } from '@samanid/ui';
import { type Order } from '@samanid/api';
import { type Locale } from '@samanid/i18n';
import { Check, Pencil, TriangleAlert, Shield } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { ageOn } from '@samanid/api';
import { dateRange, dayMonth, money } from '@/lib/format';
import { OrderSummary } from './OrderSummary';
import { CheckoutShell, card } from './CheckoutShell';

const ADDON_NAMES: Record<string, string> = { ins: 'Страховка путешественника', seat: 'Детское кресло', guide: 'Частный гид на день', shahi: 'Экскурсия: Шахи-Зинда на рассвете' };

export function ReviewStep({ order }: { order: Order }) {
  const t = useTranslations('checkout.review');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [accept, setAccept] = useState(false);
  const [err, setErr] = useState(false);
  const snap = order.snapshot; const dyn = snap.lines.find((l) => l.kind === 'dynamic');
  const dl = order.cancellation_deadline_days;
  const cancelDate = dl !== null ? (() => { const d = new Date(`${order.departure.from}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - dl); return `${dayMonth(d.toISOString().slice(0, 10), locale)} ${d.getUTCFullYear()}`; })() : null;
  const edit = (step: string) => <Link href={`/checkout/${order.id}/${step}` as never} className="-my-2 inline-flex min-h-10 items-center gap-1.5 rounded-xs text-body-s-medium text-primary-500 focus-visible:focus-ring"><Pencil className="size-4" aria-hidden="true" />{t('edit')}</Link>;
  const row = (l: string, v: string, key?: string) => <div key={key ?? l} className="flex flex-wrap justify-between gap-x-4 text-body-s"><dt className="text-dark-600">{l}</dt><dd className="text-dark-900">{v}</dd></div>;
  const go = () => { if (!accept) { setErr(true); return; } router.push(`/checkout/${order.id}/payment` as never); };
  return (
    <CheckoutShell order={order} step="review" title={t('title')} lead={t('lead')} leadShort="" barNote={t('lockedShort')}
      nav={{ backHref: `/checkout/${order.id}/discounts`, nextLabel: t('pay', { total: money(snap.total, locale) }), mobileLabel: t('payShort'), primary: true, onNext: go }}>
      {/* Mobile 30:1922: одна сводная карточка + плашка бесплатной отмены; подробные секции — только на desktop. */}
      <OrderSummary order={order} compact className="md:hidden" />
      {cancelDate && <p className="flex items-center gap-2.5 rounded-lg bg-success-100 px-4 py-3.5 text-body-s-medium text-success-700 md:hidden"><Shield className="size-5 shrink-0" aria-hidden="true" />{t('cancelShort', { date: cancelDate, refund: order.refund_days })}</p>}
      <section className={cn(card, 'max-md:hidden')}><div className="flex items-center justify-between"><h2 className="text-h6 text-dark-900">{t('tour')}</h2>{edit('travellers')}</div>
        <dl className="mt-3 flex flex-col gap-3">{row(order.tour.title.split(':')[0]!, `${dateRange(order.departure.from, order.departure.to, locale)} ${order.departure.to.slice(0, 4)}`)}{row(t('meeting'), t('meetingValue', { date: dayMonth(order.departure.from, locale), time: order.departure.meeting_time, place: order.departure.meeting_place }))}</dl></section>
      <section className={cn(card, 'max-md:hidden')}><div className="flex items-center justify-between"><h2 className="text-h6 text-dark-900">{t('people')}</h2>{edit('seats')}</div>
        <dl className="mt-3 flex flex-col gap-3">{order.travellers.map((tr, i) => { const seat = order.seats[i] ?? ''; const age = ageOn(tr.birth_date, order.departure.from); return row(`${tr.full_name} · ${tr.kind === 'adult' ? t('adult') : t('child', { age })}`, tr.kind === 'child' && order.addon_ids.includes('seat') ? t('seatChild', { seat }) : t('seat', { seat }), tr.id); })}</dl></section>
      {snap.lines.some((l) => l.kind === 'addon') && <section className={cn(card, 'max-md:hidden')}><div className="flex items-center justify-between"><h2 className="text-h6 text-dark-900">{t('addons')}</h2>{edit('addons')}</div>
        <dl className="mt-3 flex flex-col gap-3">{snap.lines.filter((l) => l.kind === 'addon').map((l) => row(`${ADDON_NAMES[l.label ?? ''] ?? l.label}${(l.count ?? 1) > 1 ? ` × ${l.count}` : ''}`, money(l.amount, locale), l.label))}</dl></section>}
      <Alert className="max-md:hidden" type="warning" title={t('lockedTitle', { total: money(snap.total, locale) })}>{dyn ? t('lockedText', { percent: dyn.percent }) : t('lockedTextPlain')}</Alert>
      {cancelDate && (
        <section className={cn(card, 'max-md:hidden')}><h2 className="text-h6 text-dark-900">{t('cancelTitle')}</h2>
          <ul className="mt-3 flex flex-col gap-2.5">{[t('cancelFree', { date: cancelDate, days: dl }), t('cancelMoney', { refund: order.refund_days }), ...(order.promo_code || order.points_used ? [t('cancelRestore')] : [])].map((x) => <li key={x} className="flex items-start gap-2 text-body-s text-dark-700"><Check className="mt-0.5 size-4 shrink-0 text-success-600" aria-hidden="true" />{x}</li>)}</ul></section>
      )}
      <div><Checkbox label={t('accept')} checked={accept} onCheckedChange={(c) => { setAccept(c === true); setErr(false); }} />{err && <p role="alert" className="mt-1 flex items-center gap-1.5 text-caption text-error-700"><TriangleAlert className="size-4" aria-hidden="true" />{t('acceptReq')}</p>}</div>
    </CheckoutShell>
  );
}
