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
    <PageContainer className="flex flex-col items-center gap-6 py-8 text-center md:py-14">
      <span aria-hidden="true" className="flex size-[76px] items-center justify-center rounded-full bg-success-600 text-white"><Check className="size-10" /></span>
      <h1 className="text-h3 text-dark-900 md:text-h1" role="status">{t('title')}</h1>
      <p className="text-body-m text-dark-600">{t('text', { email: order.contacts.email })}</p>
      <Voucher order={order} />
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="secondary" size="L" onClick={() => window.print()}>{t('pdf')} <Download className="size-4" aria-hidden="true" /></Button>
        <Button variant="outline" size="L" className="border-primary-500 text-primary-500" onClick={ics}>{t('calendar')}</Button>
        <Button variant="ghost" size="L" onClick={() => router.push('/account/orders' as never)}>{t('orders')}</Button>
      </div>
      <section aria-labelledby="next" className="mt-4 w-full max-w-[860px] text-left"><h2 id="next" className="mb-4 text-h5 text-dark-900">{t('next')}</h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {tile(Mail, t('emailTitle'), t('emailText'))}
          {tile(Send, t('tgTitle'), t('tgText'), <Button variant="outline" className="self-start border-primary-500 text-primary-500" onClick={() => router.push('/account/notifications' as never)}>{t('tgConnect')}</Button>)}
          {partial ? tile(CreditCard, t('payTitle'), t('payText', { amount: money(next.amount, locale), date: `${dayMonth(next.due, locale)} ${next.due.slice(0, 4)}`, days: reminderDays })) : tile(CreditCard, t('paidTitle'), t('paidText'))}
        </ul></section>
    </PageContainer>
  );
}
