'use client';
import { Button, EmptyState, OrderCard, SegmentedControl, SkeletonTourCard } from '@samanid/ui';
import { api, ageOn, type MeListItem, type OrderTab } from '@samanid/api';
import { type Locale } from '@samanid/i18n';
import { useQuery } from '@tanstack/react-query';
import { Bell, Info } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { hms, useCountdown } from '@/components/waitlist/useCountdown';
import { useTimerLabels } from '@/components/checkout/CheckoutShell';
import { dateRange, dayMonth, money } from '@/lib/format';
import { PageTitle } from './AccountShell';

const tabs: OrderTab[] = ['upcoming', 'completed', 'cancelled'];

function OfferBanner() {
  const t = useTranslations('account.orders'); const locale = useLocale() as Locale; const router = useRouter();
  const { data } = useQuery({ queryKey: ['me', 'waitlist'], queryFn: () => api.me.waitlist() });
  const offer = data?.find((w) => w.status === 'offer');
  const left = useCountdown(offer && 'expires_at' in offer ? offer.expires_at! : new Date(0).toISOString());
  if (!offer || left === 0) return null;
  return (
    <div role="status" className="mb-6 flex flex-col gap-3 rounded-xl border border-success-600 bg-success-100 p-5 md:flex-row md:items-center">
      <Bell className="size-6 shrink-0 text-success-700" aria-hidden="true" />
      <div className="flex-1"><p className="text-body-m-medium text-success-700">{t('offerTitle', { tour: offer.tour.title.split(':')[0]!, date: dayMonth(offer.date, locale) })}</p><p className="text-caption text-dark-700">{t('offerText', { time: hms(left) })}</p></div>
      <Button variant="primary" onClick={() => router.push(`/waitlist/offer/${'offer_id' in offer ? offer.offer_id : ''}` as never)}>{t('book')}</Button>
    </div>
  );
}

function Item({ it }: { it: MeListItem }) {
  const t = useTranslations('account.orders'); const treq = useTranslations('checkout.request'); const ts = useTranslations('status'); const locale = useLocale() as Locale; const router = useRouter(); const labels = useTimerLabels();
  const o = it.kind === 'order' ? it.order : null;
  const left = useCountdown(o?.hold_expires_at ?? new Date(0).toISOString());
  if (it.kind === 'request') {
    const r = it.request;
    return <OrderCard status="awaiting_manager_confirmation" statusLabel={treq('badge')} number={t('request', { number: r.number })} title={r.tour_title.split(':')[0]!} dates={`${dateRange(r.from, r.to, locale)} ${r.to.slice(0, 4)}`} travellers={t('travellers', { adults: r.adults, children: 0 })} totalLabel={t('total')} total="—" action={{ label: t('details'), variant: 'outline', onClick: () => router.push(`/requests/${r.id}` as never) }} />;
  }
  const order = o!;
  const kids = order.travellers.filter((x) => x.kind === 'child' || (x.birth_date && ageOn(x.birth_date, order.departure.from) < 12)).length;
  const pending = order.status === 'pending_payment' && left > 0;
  const action = order.status === 'draft' ? { label: t('continue'), variant: 'outline' as const, onClick: () => router.push(`/checkout/${order.id}/travellers` as never) }
    : pending ? { label: t('pay'), variant: 'primary' as const, onClick: () => router.push(`/checkout/${order.id}/payment` as never) }
    : order.status === 'completed' && !order.review_left ? { label: t('review'), variant: 'outline' as const, onClick: () => router.push('/account/reviews' as never) }
    : { label: t('details'), variant: 'outline' as const, onClick: () => router.push(`/account/orders/${order.id}` as never) };
  return (
    <OrderCard image={{ tone: order.tour.image.tone }} status={order.status} statusLabel={ts(order.status)} number={t('booking', { number: order.number })} title={order.tour.title.split(':')[0]!}
      dates={`${dateRange(order.departure.from, order.departure.to, locale)} ${order.departure.to.slice(0, 4)}`} travellers={t('travellers', { adults: order.adults, children: kids ? order.children : order.children })} seats={order.seats.length ? t('seats', { seats: order.seats.join(', ') }) : undefined}
      hold={pending ? { remainingSeconds: left, labels } : undefined} totalLabel={t('total')} total={money(order.snapshot.total, locale)} action={action} />
  );
}

export function OrdersPage() {
  const t = useTranslations('account.orders'); const router = useRouter(); const [tab, setTab] = useState<OrderTab>('upcoming');
  const { data, isLoading } = useQuery({ queryKey: ['me', 'orders', tab], queryFn: () => api.me.orders(tab) });
  const { data: s } = useQuery({ queryKey: ['settings'], queryFn: () => api.settings() });
  const counts = data?.counts;
  return (
    <>
      <PageTitle title={t('title')} />
      <OfferBanner />
      <div className="-mx-4 mb-6 overflow-x-auto px-4 md:mx-0 md:px-0">
        <SegmentedControl label={t('title')} value={tab} onValueChange={(v) => setTab(v as OrderTab)} options={tabs.map((k) => ({ value: k, label: `${t(`tabs.${k}`)}${counts ? ` · ${counts[k]}` : ''}` }))} />
      </div>
      {isLoading ? <SkeletonTourCard /> : data && data.items.length > 0 ? (
        <ul className="flex flex-col gap-4">{data.items.map((it) => <li key={it.kind === 'order' ? it.order.id : it.request.id}><Item it={it} /></li>)}</ul>
      ) : <EmptyState title={t('empty')} text={t('emptyText')} actionLabel={t('find')} onAction={() => router.push('/tours' as never)} />}
      {tab === 'upcoming' && s && <p className="mt-6 flex items-center gap-2 text-caption text-dark-500"><Info className="size-4" aria-hidden="true" />{t('holdNote', { minutes: s.hold_minutes })}</p>}
    </>
  );
}
