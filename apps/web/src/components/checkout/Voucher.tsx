'use client';
import { Logo, StatusBadge } from '@samanid/ui';
import type { Order } from '@samanid/api';
import { type Locale } from '@samanid/i18n';
import { QRCodeSVG } from 'qrcode.react';
import { useLocale, useTranslations } from 'next-intl';
import { dateRange, dayMonth } from '@/lib/format';

/** Ваучер (Figma 31:1921). QR кодирует ссылку проверки /voucher/{код} (экран 4.x «Проверка ваучера»). */
export function Voucher({ order }: { order: Order }) {
  const t = useTranslations('checkout.success'); const locale = useLocale() as Locale;
  const dates = `${dateRange(order.departure.from, order.departure.to, locale)} ${order.departure.to.slice(0, 4)}`;
  const f = (l: string, v: React.ReactNode) => <div><dt className="text-caption text-dark-500">{l}</dt><dd className="text-body-s text-dark-900">{v}</dd></div>;
  return (
    <article aria-label={order.number} className="grid w-full max-w-[685px] overflow-hidden rounded-2xl border border-dark-200 bg-white md:grid-cols-[1fr_232px]">
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3"><Logo compact /><StatusBadge status="confirmed" label={t('status')} /></div>
        <div><p className="text-overline text-dark-500 uppercase">{t('voucher')}</p><p className="text-h2 text-dark-900">{order.number}</p></div>
        <p className="text-body-m-medium text-dark-900">{order.tour.title.split(':')[0]}</p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          {f(t('dates'), dates)}{f(t('meeting'), `${dayMonth(order.departure.from, locale)}, ${order.departure.meeting_time}`)}
          {f(t('place'), order.departure.meeting_place)}
          {f(t('travellers'), <ul>{order.travellers.map((tr, i) => <li key={tr.id}>{tr.full_name} · {order.seats[i]}</li>)}</ul>)}
        </dl>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 border-t border-dashed border-dark-300 bg-primary-50 p-6 md:border-t-0 md:border-l">
        <QRCodeSVG value={order.voucher?.qr ?? order.number} size={132} marginSize={0} role="img" aria-label={`QR ${order.number}`} />
        <p className="text-center text-caption text-dark-500">{t('showGuide')}</p>
      </div>
    </article>
  );
}
