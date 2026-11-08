'use client';
import { Alert, Button, HoldTimer, PageContainer, StatusBadge, cn } from '@samanid/ui';
import { api, type Order } from '@samanid/api';
import { type Locale } from '@samanid/i18n';
import { useQuery } from '@tanstack/react-query';
import { Check, CircleCheck, Clock, Loader2, Send, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { dateRange, dayMonth, money } from '@/lib/format';
import { useTimerLabels } from './CheckoutShell';
import { useHold } from './useOrder';

const panel = 'mx-auto flex w-full max-w-[520px] flex-col items-center gap-5 rounded-2xl border border-dark-200 bg-white p-6 text-center shadow-md md:p-10';
const Icon = ({ tone, children }: { tone: 'blue' | 'red' | 'green'; children: React.ReactNode }) => <span aria-hidden="true" className={cn('flex size-[72px] items-center justify-center rounded-full [&>svg]:size-8', tone === 'blue' ? 'bg-primary-50 text-primary-500' : tone === 'red' ? 'bg-error-100 text-error-600' : 'bg-success-100 text-success-700')}>{children}</span>;

/** 2.7a: ждём вебхук, опрашиваем статус платежа (polling) до paid | failed. */
export function PendingScreen({ order, paymentId }: { order: Order; paymentId: string }) {
  const t = useTranslations('checkout.status');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { data: p } = useQuery({ queryKey: ['payment', paymentId], queryFn: () => api.orders.getPayment(paymentId), refetchInterval: (q) => (q.state.data?.status === 'processing' || !q.state.data ? 1500 : false) });
  useEffect(() => {
    if (p?.status === 'paid') router.replace({ pathname: `/checkout/${order.id}/success`, query: { payment: paymentId } } as never);
    if (p?.status === 'failed') router.replace({ pathname: `/checkout/${order.id}/failed`, query: { payment: paymentId } } as never);
  }, [p?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  const row = (done: boolean, active: boolean, text: string) => (
    <li className={cn('flex items-center gap-3 text-body-s', !done && !active && 'text-dark-400', active && 'font-semibold text-dark-900')}>
      <span aria-hidden="true" className={cn('flex size-5 items-center justify-center rounded-full', done ? 'bg-success-600 text-white' : active ? 'text-primary-500' : 'border-2 border-dark-200')}>{done ? <Check className="size-3.5" /> : active ? <Loader2 className="size-4 animate-spin" /> : null}</span>{text}</li>
  );
  return (
    <PageContainer className="py-8 md:py-16"><div className={panel} role="status" aria-live="polite">
      <Icon tone="blue"><Loader2 className="animate-spin" /></Icon>
      <h1 className="text-h3 text-dark-900 md:text-h2">{t('pendingTitle')}</h1><p className="text-body-m text-dark-600">{t('pendingText')}</p>
      <ul className="flex w-full flex-col gap-3 rounded-lg bg-bg-page p-5 text-left">{row(true, false, t('s1', { amount: money(p?.amount ?? 0, locale) }))}{row(false, true, t('s2'))}{row(false, false, t('s3'))}</ul>
      <p className="text-caption text-dark-500">{t('foot', { id: paymentId })}</p>
    </div></PageContainer>
  );
}

/** 2.7b: платёж не прошёл; hold продолжает идти. */
export function FailedScreen({ order, paymentId }: { order: Order; paymentId: string }) {
  const t = useTranslations('checkout.status');
  const labels = useTimerLabels(); const router = useRouter();
  const { left, active } = useHold(order);
  const { data: p } = useQuery({ queryKey: ['payment', paymentId], queryFn: () => api.orders.getPayment(paymentId) });
  const code = p?.failure?.code ?? '51';
  return (
    <PageContainer className="py-8 md:py-16"><div className={panel}>
      <Icon tone="red"><X /></Icon><h1 className="text-h3 text-dark-900 md:text-h2">{t('failedTitle')}</h1><p className="text-body-m text-dark-600">{t('failedText')}</p>
      <div className="w-full text-left"><Alert type="error" title={t('failedBank')}>{code === '51' ? t('reason51', { code }) : t('reasonOther', { code })}</Alert></div>
      {active && <HoldTimer remainingSeconds={left} labels={labels} compact />}
      <Button variant="primary" size="L" className="w-full" onClick={() => router.push(`/checkout/${order.id}/payment` as never)}>{t('retry')}</Button>
      <Button variant="outline" size="L" className="w-full border-primary-500 text-primary-500" onClick={() => router.push(`/checkout/${order.id}/payment` as never)}>{t('change')}</Button>
    </div></PageContainer>
  );
}

/** 2.7c: время брони истекло — места освобождены, данные путешественников сохранены. */
export function ExpiredScreen({ order }: { order: Order }) {
  const t = useTranslations('checkout.status'); const locale = useLocale() as Locale; const router = useRouter();
  const restart = async () => { await api.orders.restart(order.id); router.push(`/checkout/${order.id}/travellers` as never); };
  return (
    <PageContainer className="py-8 md:py-16"><div className={panel}>
      <Icon tone="red"><Clock /></Icon><h1 className="text-h3 text-dark-900 md:text-h2">{t('expiredTitle')}</h1>
      <p className="text-body-m text-dark-600">{t('expiredText', { seats: (order.released_seats ?? order.seats).join(', ') || '—' })}</p>
      {order.departure.seats_left > 0 && <p className="flex w-full items-center justify-center gap-2 rounded-lg bg-success-100 px-4 py-3 text-body-s-medium text-success-700"><CircleCheck className="size-4" aria-hidden="true" />{t('expiredStill', { date: dayMonth(order.departure.from, locale), count: order.departure.seats_left })}</p>}
      <Button variant="primary" size="L" className="w-full" onClick={restart}>{t('restart')}</Button>
      <Button variant="ghost" onClick={() => router.push(`/tours/${order.tour.slug}` as never)}>{t('backToTour')}</Button>
    </div></PageContainer>
  );
}

/** 2.7d: запрос по индивидуальному туру отправлен менеджеру. */
export function RequestSent({ req, hours }: { req: { number: string; tour_title: string; from: string; to: string; adults: number }; hours: number }) {
  const t = useTranslations('checkout.request'); const locale = useLocale() as Locale; const router = useRouter(); const ts = useTranslations('tour.tags');
  void ts;
  const step = (done: boolean, active: boolean, text: string) => <li key={text} className={cn('flex items-center gap-3 text-body-s', !done && !active && 'text-dark-400', active && 'font-semibold text-dark-900')}><span aria-hidden="true" className={cn('flex size-5 items-center justify-center rounded-full', done ? 'bg-success-600 text-white' : active ? 'text-primary-500' : 'border-2 border-dark-200')}>{done ? <Check className="size-3.5" /> : active ? <Loader2 className="size-4 animate-spin" /> : null}</span>{text}</li>;
  return (
    <PageContainer className="py-8 md:py-16"><div className={panel}>
      <Icon tone="blue"><Send /></Icon><h1 className="text-h3 text-dark-900 md:text-h2">{t('title')}</h1><p className="text-body-m text-dark-600">{t('text', { hours })}</p>
      <div className="flex w-full flex-col items-start gap-1 rounded-lg border border-dark-200 p-4 text-left"><p className="text-body-m-medium text-dark-900">{req.tour_title}</p><p className="text-caption text-dark-500">{t('meta', { dates: `${dateRange(req.from, req.to, locale)} ${req.to.slice(0, 4)}`, adults: req.adults, number: req.number })}</p><StatusBadge status="awaiting_manager_confirmation" label={t('badge')} /></div>
      <ul className="flex w-full flex-col gap-3 rounded-lg bg-bg-page p-5 text-left">{step(true, false, t('s1'))}{step(false, true, t('s2'))}{step(false, false, t('s3'))}</ul>
      <Button variant="secondary" size="L" className="w-full" onClick={() => router.push('/account/orders' as never)}>{t('toOrders')}</Button>
      <Button variant="ghost" onClick={() => router.push('/tours' as never)}>{t('keep')}</Button>
    </div></PageContainer>
  );
}
