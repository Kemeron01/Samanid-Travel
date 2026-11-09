'use client';
import { Button, PageContainer } from '@samanid/ui';
import type { Order } from '@samanid/api';
import { type Locale } from '@samanid/i18n';
import { Check, CreditCard, Download, Mail, Send } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { dayMonth, money } from '@/lib/format';
import { Voucher } from './Voucher';

export function SuccessScreen({ order, reminderDays }: { order: Order; reminderDays: number }) {
  const t = useTranslations('checkout.success'); const locale = useLocale() as Locale; const router = useRouter();
  const next = order.snapshot.installments.find((r) => r.n === 2);
  const partial = order.status === 'partially_paid' && next;
  const ics = () => {
    const d = (iso: string) => iso.replace(/-/g, '');
    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `UID:${order.number}@samanid.travel`, `DTSTART;VALUE=DATE:${d(order.departure.from)}`, `DTEND;VALUE=DATE:${d(order.departure.to)}`, `SUMMARY:${order.tour.title}`, `LOCATION:${order.departure.meeting_place}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' })); a.download = `${order.number}.ics`; a.click(); URL.revokeObjectURL(a.href);
  };
  const tile = (I: typeof Mail, title: string, text: string, extra?: React.ReactNode) => <li className="flex flex-col gap-3 rounded-xl border border-dark-200 bg-white p-5"><span aria-hidden="true" className="flex size-10 items-center justify-center rounded-md bg-primary-50 text-primary-500"><I className="size-5" /></span><h3 className="text-body-m-medium text-dark-900">{title}</h3><p className="text-body-s text-dark-500">{text}</p>{extra}</li>;
  return (
    <PageContainer className="flex flex-col items-center pt-8 pb-16 text-center md:pt-16 md:pb-24">
      <span aria-hidden="true" className="flex size-[72px] items-center justify-center rounded-full bg-success-600 text-white md:size-[88px]"><Check className="size-9 md:size-11" /></span>
      <div role="status" aria-live="polite" className="contents"><h1 className="mt-6 text-h2 text-dark-900 md:mt-8 md:text-h1"><span className="max-md:sr-only">{t('title')}</span><span aria-hidden="true" className="md:hidden">{t('titleShort')}</span></h1></div>
      <p className="mt-3 text-body-m text-dark-600 max-md:hidden md:mt-4 md:text-body-l">{t('text', { email: order.contacts.email })}</p>
      <div className="mt-4 flex w-full justify-center md:mt-12"><Voucher order={order} /></div>
      <div className="mt-4 flex w-full flex-col items-stretch gap-3 md:mt-8 md:w-auto md:flex-row md:flex-wrap md:items-center md:justify-center">
        <Button variant="secondary" size="L" onClick={() => window.print()}>{t('pdf')} <Download className="size-4" aria-hidden="true" /></Button>
        <Button variant="outline" size="L" onClick={ics} className="max-md:hidden">{t('calendar')}</Button>
        <Button variant="outline" size="L" className="md:hidden" onClick={() => router.push('/account/notifications' as never)}>{t('tgConnectFull')}</Button>
        <Button variant="ghost" size="L" onClick={() => router.push('/account/orders' as never)}>{t('orders')}</Button>
      </div>
      <section aria-labelledby="next" className="mt-8 w-full max-w-[880px] text-left max-md:hidden"><h2 id="next" className="mb-4 text-h5 text-dark-900 md:text-h4">{t('next')}</h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {tile(Mail, t('emailTitle'), t('emailText'))}
          {tile(Send, t('tgTitle'), t('tgText'), <Button variant="outline" className="mt-1 self-start" onClick={() => router.push('/account/notifications' as never)}>{t('tgConnect')}</Button>)}
          {partial ? tile(CreditCard, t('payTitle'), t('payText', { amount: money(next.amount, locale), date: `${dayMonth(next.due, locale)} ${next.due.slice(0, 4)}`, days: reminderDays })) : tile(CreditCard, t('paidTitle'), t('paidText'))}
        </ul></section>
    </PageContainer>
  );
}
