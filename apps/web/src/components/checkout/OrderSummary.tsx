'use client';
import { Media, PriceRow } from '@samanid/ui';
import type { Order, PriceLine } from '@samanid/api';
import { intlLocale, type Locale } from '@samanid/i18n';
import { Shield } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { dateRange, dayMonth, money } from '@/lib/format';

const ADDON_NAMES: Record<string, string> = { ins: 'Страховка', seat: 'Детское кресло', guide: 'Частный гид', shahi: 'Экскурсия: Шахи-Зинда', photo: 'Фотосессия', plov: 'Мастер-класс плова' };

/** «Ваш заказ». Все суммы — из снимка цены API (order.snapshot); порядок строк задан бэкендом. */
export function OrderSummary({ order, className }: { order: Order; className?: string }) {
  const t = useTranslations('checkout.summary');
  const tb = useTranslations('tourPage.booking');
  const locale = useLocale() as Locale;
  const snap = order.snapshot;
  const row = (l: PriceLine, i: number) => {
    const amount = `${l.amount > 0 && (l.kind === 'dynamic') ? '+' : l.amount < 0 ? '−' : ''}${money(Math.abs(l.amount), locale)}`;
    switch (l.kind) {
      case 'adults': return <PriceRow key={i} label={tb('lineAdults', { count: l.count, price: money(l.unit_price!, locale) })} amount={amount} />;
      case 'children': return <PriceRow key={i} label={tb('lineChildren', { count: l.count, price: money(l.unit_price!, locale) })} amount={amount} />;
      case 'dynamic': return <PriceRow key={i} type="dynamic" label={t('dynamic', { percent: l.percent })} hint={t('dynamicHint')} amount={amount} />;
      case 'addon': return <PriceRow key={i} label={`${ADDON_NAMES[l.label ?? ''] ?? l.label} × ${l.count}`} amount={amount} />;
      case 'promo': return <PriceRow key={i} type="discount" label={t('promo', { code: l.label, percent: l.percent })} amount={amount} />;
      case 'points': return <PriceRow key={i} type="discount" label={t('points', { count: new Intl.NumberFormat(intlLocale[locale]).format(l.count ?? 0).replace(/ /g, ' ') })} amount={amount} />;
      default: return <PriceRow key={i} label={t('penalty')} amount={amount} />;
    }
  };
  const deadline = order.cancellation_deadline_days;
  const cancelDate = deadline !== null ? (() => { const d = new Date(`${order.departure.from}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - deadline); return dayMonth(d.toISOString().slice(0, 10), locale); })() : null;
  return (
    <aside aria-label={t('title')} className={`rounded-xl border border-dark-200 bg-white p-6 ${className ?? ''}`}>
      <h2 className="text-h5 text-dark-900">{t('title')}</h2>
      <div className="mt-4 flex items-center gap-4 border-b border-dark-200 pb-4">
        <Media tone={order.tour.image.tone} src={order.tour.image.src} className="relative size-[72px] shrink-0 rounded-md" />
        <div className="min-w-0"><p className="text-body-m-medium text-dark-900">{order.tour.title.split(':')[0]}</p>
          <p className="text-caption text-dark-500">{t('meta', { dates: dateRange(order.departure.from, order.departure.to, locale), adults: order.adults, children: order.children })}</p></div>
      </div>
      <div className="mt-4 flex flex-col gap-2.5" aria-live="polite">{snap.lines.map(row)}</div>
      <div className="mt-4 border-t border-dark-200 pt-3"><PriceRow type="total" label={t('total')} amount={money(snap.total, locale)} className="!border-0 !pt-0" /></div>
      {cancelDate && <p className="mt-3 flex items-start gap-2 text-caption text-success-700"><Shield className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{t('cancelNote', { date: cancelDate, days: order.refund_days })}</p>}
    </aside>
  );
}
