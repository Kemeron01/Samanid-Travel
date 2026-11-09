'use client';
import { Alert, Button, HoldTimer, Input, PageContainer, PaymentScheduleRow, SegmentedControl } from '@samanid/ui';
import { api, type Order, type Settings } from '@samanid/api';
import { type Locale } from '@samanid/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { LockKeyhole, TriangleAlert, CircleAlert, ArrowLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Link, useRouter } from '@/i18n/routing';
import { dayMonth, money } from '@/lib/format';
import { card, useTimerLabels } from './CheckoutShell';
import { OrderSummary } from './OrderSummary';
import { useHold } from './useOrder';

const groupDigits = (v: string) => v.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
const expiryMask = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d; };

/** Экран 2.6. Данные карты в Figma — тестовый режим; в проде поля заменяются полями платёжного провайдера (hosted fields). */
export function PaymentStep({ order, settings }: { order: Order; settings: Settings }) {
  const t = useTranslations('checkout.payment');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const labels = useTimerLabels();
  const { left, active } = useHold(order);
  const [plan, setPlan] = useState<'full' | 'installment'>(order.payment_plan);
  const [error, setError] = useState<string>();
  const attempt = useRef(0);
  const snap = order.snapshot;
  const schema = useMemo(() => z.object({
    number: z.string().refine((v) => /^\d{13,19}$/.test(v.replace(/\s/g, '')), t('cardBad')),
    expiry: z.string().regex(/^(0[1-9]|1[0-2]) \/ \d{2}$/, t('expiryBad')),
    cvc: z.string().regex(/^\d{3,4}$/, t('cvcBad')),
    holder: z.string().min(2, t('holderBad')),
  }), [t]);
  type F = z.infer<typeof schema>;
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema), defaultValues: { number: '', expiry: '', cvc: '', holder: '' } });
  const last = snap.installments[snap.installments.length - 1];
  const dateYear = (d: string) => `${dayMonth(d, locale)} ${d.slice(0, 4)}`;
  const amount = plan === 'full' ? snap.total : snap.deposit;
  const dl = order.cancellation_deadline_days; const cancelDate = dl !== null ? (() => { const d = new Date(`${order.departure.from}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - dl); return dayMonth(d.toISOString().slice(0, 10), locale); })() : null;

  const pay = handleSubmit(async (v) => {
    setError(undefined);
    try {
      const tok = await api.orders.cardToken(v.number);
      // Ключ идемпотентности стабилен для попытки: повторный клик не создаёт второй платёж.
      const key = `${order.id}:${plan}:${attempt.current}`;
      const p = await api.orders.createPayment(order.id, { plan, idempotency_key: key, card_last4: tok.last4, card_token: tok.token });
      router.push({ pathname: `/checkout/${order.id}/pending`, query: { payment: p.id } } as never);
    } catch (e) { setError((e as Error).message === 'hold_expired' ? t('holdGone') : t('cardBad')); attempt.current += 1; }
  });

  return (
    <PageContainer className="pb-32 md:pt-8 md:pb-16">
      {/* Mobile 30:2009: панель «← Оплата» + таймер вместо заголовка, внизу — закреплённая сумма и «Оплатить». */}
      <div className="sticky top-0 z-40 -mx-4 flex h-16 items-center justify-between gap-3 bg-white px-4 md:hidden">
        <div className="flex items-center gap-3"><Link href={`/checkout/${order.id}/review` as never} aria-label={t('back')} className="inline-flex rounded-xs text-dark-900 focus-visible:focus-ring"><ArrowLeft className="size-6" aria-hidden="true" /></Link><h1 className="text-h5 text-dark-900">{t('title')}</h1></div>
        {active && <HoldTimer remainingSeconds={left} labels={labels} compact />}
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4 max-md:hidden">
        <div><h1 className="text-h2 text-dark-900 md:text-h1">{t('title')}</h1><p className="mt-1 text-body-s text-dark-500 md:text-body-m">{t('order', { number: order.number, tour: order.tour.title.split(':')[0]! })}</p></div>
        {active && <HoldTimer remainingSeconds={left} labels={labels} compact />}
      </div>
      <div className="mt-4 grid gap-8 md:mt-6 lg:grid-cols-[1fr_440px] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-6">
          <section className={`${card} flex flex-col gap-4 max-md:border-0 max-md:bg-transparent max-md:p-0`} aria-labelledby="how">
            <h2 id="how" className="text-h5 text-dark-900 max-md:sr-only">{t('how')}</h2>
            <SegmentedControl className="md:self-start max-md:[&>*]:flex-1" label={t('how')} value={plan} onValueChange={(v) => setPlan(v as typeof plan)} options={[{ value: 'full', label: t('full') }, { value: 'installment', label: t('installment') }]} />
            {plan === 'installment' ? (
              <>
                <p className="text-body-s text-dark-600">{t('installmentNote', { date: last ? dateYear(last.due) : '' })}</p>
                <ul className="flex flex-col gap-3">{snap.installments.map((r) => (
                  <li key={r.n}><PaymentScheduleRow state={r.status === 'now' ? 'upcoming' : 'scheduled'} title={r.n === 1 ? t('rowDeposit') : t('row', { n: r.n })} date={r.n === 1 ? t('today', { date: dateYear(r.due) }) : dateYear(r.due)} amount={money(r.amount, locale)} statusLabel={r.status === 'now' ? t('now') : t('scheduled')} /></li>))}</ul>
                <p className="flex items-start gap-2 text-caption text-dark-500"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{t('reminder', { reminder: settings.installment_reminder_days, penalty: String(settings.installment_penalty_percent).replace('.', locale === 'en' ? '.' : ','), block: settings.installment_block_days })}</p>
              </>
            ) : <p className="text-body-s text-dark-600">{t('fullNote')}</p>}
          </section>
          <form id="pay-form" onSubmit={pay} noValidate className="flex flex-col gap-6">
            <section className={`${card} flex flex-col gap-4 max-md:border-0 max-md:bg-transparent max-md:p-0`} aria-labelledby="card">
              <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="card" className="text-h5 text-dark-900 max-md:sr-only">{t('cardTitle')}</h2><span className="inline-flex items-center gap-1.5 rounded-full bg-warning-100 px-3 py-1 text-caption text-warning-700"><CircleAlert className="size-3.5" aria-hidden="true" />{t('test')}</span></div>
              <Input label={t('number')} inputMode="numeric" autoComplete="cc-number" placeholder="4417 1234 5678 9010" error={errors.number?.message} {...register('number', { onChange: (e) => setValue('number', groupDigits(e.target.value)) })} />
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <Input label={t('expiry')} inputMode="numeric" autoComplete="cc-exp" placeholder="08 / 29" error={errors.expiry?.message} {...register('expiry', { onChange: (e) => setValue('expiry', expiryMask(e.target.value)) })} />
                <Input label={t('cvc')} type="password" inputMode="numeric" autoComplete="cc-csc" maxLength={4} placeholder="•••" error={errors.cvc?.message} {...register('cvc')} />
              </div>
              <Input label={t('holder')} autoComplete="cc-name" placeholder="AZIZ AZIZOV" error={errors.holder?.message} {...register('holder', { setValueAs: (v: string) => v.toUpperCase() })} />
              <p className="flex items-center gap-2 text-caption text-success-700"><LockKeyhole className="size-4" aria-hidden="true" />{t('secure')}</p>
            </section>
            {error && <Alert type="error" title={error} />}
            <Button type="submit" variant="primary" size="L" className="w-full max-md:hidden" loading={isSubmitting}>{plan === 'full' ? t('payFull', { amount: money(amount, locale) }) : t('payDeposit', { amount: money(amount, locale) })}</Button>
          </form>
          {cancelDate && <Alert className="max-md:hidden" type="info" title={t('refundTitle', { date: cancelDate })}>{t('refundText')}</Alert>}
        </div>
        <div className="max-md:hidden lg:sticky lg:top-24 lg:self-start"><OrderSummary order={order} /></div>
      </div>
      <Link href={`/checkout/${order.id}/review` as never} className="mt-6 inline-block text-body-s-medium text-primary-500 max-md:hidden">← {t('title')}</Link>
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-dark-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <div><p className="text-price-m text-dark-900">{money(amount, locale)}</p>{plan === 'installment' && <p className="text-caption text-primary-500">{t('ofTotal', { total: money(snap.total, locale) })}</p>}</div>
        <Button type="submit" form="pay-form" variant="primary" size="L" loading={isSubmitting}>{t('payShort')}</Button>
      </div>
    </PageContainer>
  );
}
