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
    <article aria-label={order.number} className="grid w-full max-w-[685px] overflow-hidden rounded-2xl border border-dark-200 bg-white text-left md:grid-cols-[1fr_232px]">
      <div className="flex flex-col gap-4 p-5 md:p-6">
        <div className="flex items-start justify-between gap-3 max-md:hidden"><Logo compact /><StatusBadge status="confirmed" label={t('status')} /></div>
        {/* Mobile 31:2492: «ВАУЧЕР», номер, «тур · даты», «Места … · сбор …», QR в подложке внутри карточки. */}
        <div><p className="text-overline text-dark-500 uppercase"><span className="md:hidden">{t('voucherShort')}</span><span className="max-md:hidden">{t('voucher')}</span></p><p className="text-h3 text-dark-900 md:text-h2">{order.number}</p></div>
        <p className="text-body-m-medium text-dark-900"><span className="max-md:hidden">{order.tour.title.split(':')[0]}</span><span className="md:hidden">{order.tour.title.split(':')[0]} · {dateRange(order.departure.from, order.departure.to, locale)}</span></p>
        <p className="-mt-2 text-caption text-dark-500 md:hidden">{t('seatsMeeting', { seats: order.seats.join(', '), time: order.departure.meeting_time })}</p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 max-md:hidden">
          {f(t('dates'), dates)}{f(t('meeting'), `${dayMonth(order.departure.from, locale)}, ${order.departure.meeting_time}`)}
          {f(t('place'), order.departure.meeting_place)}
          {f(t('travellers'), <ul>{order.travellers.map((tr, i) => <li key={tr.id}>{tr.full_name} · {order.seats[i]}</li>)}</ul>)}
        </dl>
      </div>
      <div className="mx-5 mb-5 flex flex-col items-center justify-center gap-3 rounded-lg bg-primary-50 p-4 md:m-0 md:rounded-none md:border-l md:border-dashed md:border-dark-300 md:p-6">
        <QRCodeSVG value={order.voucher?.qr ?? order.number} size={132} marginSize={0} role="img" aria-label={`QR ${order.number}`} />
        <p className="text-center text-caption text-dark-500 max-md:sr-only">{t('showGuide')}</p>
      </div>
    </article>
  );
}
