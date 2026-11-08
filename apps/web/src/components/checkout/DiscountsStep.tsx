'use client';
import { Alert, PromoCode, SingleSlider, Switch } from '@samanid/ui';
import { api, type Order } from '@samanid/api';
import { intlLocale, type Locale } from '@samanid/i18n';
import { Gift } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { dayMonth, money } from '@/lib/format';
import { CheckoutShell, card } from './CheckoutShell';
import { usePatchOrder, useSetOrder } from './useOrder';

export function DiscountsStep({ order }: { order: Order }) {
  const t = useTranslations('checkout.discounts');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const patch = usePatchOrder(order.id);
  const setOrder = useSetOrder(order.id);
  const [code, setCode] = useState(order.promo_code ?? '');
  const [promoErr, setPromoErr] = useState<string>();
  const [busy, setBusy] = useState(false);
  const snap = order.snapshot;
  const promoLine = snap.lines.find((l) => l.kind === 'promo');
  const [spend, setSpend] = useState(order.points_used > 0);
  const [points, setPoints] = useState(order.points_used || order.snapshot.points_max * 100);
  const maxPoints = snap.points_max * 100;
  const nf = (n: number) => new Intl.NumberFormat(intlLocale[locale]).format(n).replace(/ /g, ' ');
  useEffect(() => { const h = setTimeout(() => { const want = spend ? Math.min(points, maxPoints) : 0; if (want !== order.points_used) patch.mutate({ points_used: want }); }, 200); return () => clearTimeout(h); }, [spend, points]); // eslint-disable-line react-hooks/exhaustive-deps
  const apply = async () => { setBusy(true); setPromoErr(undefined); try { setOrder(await api.orders.applyPromo(order.id, code)); } catch { setPromoErr(t('invalid')); } finally { setBusy(false); } };
  const remove = async () => { setOrder(await api.orders.removePromo(order.id)); setCode(''); };
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => api.settings() });
  const cap = settings?.bonus_cap_percent ?? 20;
  return (
    <CheckoutShell order={order} step="discounts" title={t('title')} lead={t('lead', { cap })}
      nav={{ backHref: `/checkout/${order.id}/addons`, nextLabel: t('next'), loading: patch.isPending, onNext: () => router.push(`/checkout/${order.id}/review` as never) }}>
      <section className={card}>
        <PromoCode label={t('promo')} placeholder={t('promoPh')} applyLabel={t('apply')} removeLabel={t('remove')} value={code} onValueChange={(v) => setCode(v.toUpperCase())}
          onApply={apply} onRemove={remove} applied={Boolean(order.promo_code)} loading={busy} helper={t('helper')} error={promoErr}
          appliedMessage={promoLine ? t('applied', { percent: promoLine.percent, amount: money(Math.abs(promoLine.amount), locale) }) : undefined} />
      </section>
      <section className={`${card} flex flex-col gap-5`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4"><span aria-hidden="true" className="flex size-12 items-center justify-center rounded-md bg-accent-100 text-accent-600"><Gift className="size-6" /></span>
            <div><h2 className="text-body-m-medium text-dark-900">{t('pointsTitle', { count: nf(order.points_balance) })}</h2><p className="text-caption text-dark-500">{t('pointsRate', { date: dayMonth(order.points_expire, locale) + ' ' + order.points_expire.slice(0, 4) })}</p></div></div>
          <Switch label={t('spend')} checked={spend} onCheckedChange={setSpend} />
        </div>
        {spend && maxPoints > 0 && (
          <SingleSlider label={t('spendLabel')} valueLabel={t('spendValue', { points: nf(points), amount: money(Math.floor(points / 100), locale) })} minLabel="0" maxLabel={t('max', { cap: settings?.bonus_cap_percent ?? cap, amount: money(snap.points_cap, locale) })} thumbLabel={t('spendLabel')}
            min={0} max={maxPoints} step={100} value={Math.min(points, maxPoints)} onValueChange={setPoints} />
        )}
      </section>
      <Alert type="info" title={t('refundTitle')}>{t('refundText')}</Alert>
    </CheckoutShell>
  );
}
