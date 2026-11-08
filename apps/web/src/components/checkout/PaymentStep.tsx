'use client';
import { Alert, Button, HoldTimer, Input, PageContainer, PaymentScheduleRow, SegmentedControl } from '@samanid/ui';
import { api, type Order, type Settings } from '@samanid/api';
import { type Locale } from '@samanid/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { LockKeyhole, TriangleAlert } from 'lucide-react';
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
    <PageContainer className="pt-6 pb-16 md:pt-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-h2 text-dark-900 md:text-h1">{t('title')}</h1><p className="mt-1 text-body-s text-dark-500 md:text-body-m">{t('order', { number: order.number, tour: order.tour.title })}</p></div>
        {active && <HoldTimer remainingSeconds={left} labels={labels} compact />}
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_440px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className={`${card} flex flex-col gap-4`} aria-labelledby="how">
            <h2 id="how" className="text-h5 text-dark-900">{t('how')}</h2>
            <SegmentedControl label={t('how')} value={plan} onValueChange={(v) => setPlan(v as typeof plan)} options={[{ value: 'full', label: t('full') }, { value: 'installment', label: t('installment') }]} />
            {plan === 'installment' ? (
              <>
                <p className="text-body-s text-dark-600">{t('installmentNote', { date: last ? dateYear(last.due) : '' })}</p>
                <ul className="flex flex-col gap-3">{snap.installments.map((r) => (
                  <li key={r.n}><PaymentScheduleRow state={r.status === 'now' ? 'upcoming' : 'scheduled'} title={r.n === 1 ? t('rowDeposit') : t('row', { n: r.n })} date={r.n === 1 ? t('today', { date: dateYear(r.due) }) : dateYear(r.due)} amount={money(r.amount, locale)} statusLabel={r.status === 'now' ? t('now') : t('scheduled')} /></li>))}</ul>
                <p className="flex items-start gap-2 text-caption text-dark-500"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{t('reminder', { reminder: settings.installment_reminder_days, penalty: String(settings.installment_penalty_percent).replace('.', locale === 'en' ? '.' : ','), block: settings.installment_block_days })}</p>
              </>
            ) : <p className="text-body-s text-dark-600">{t('fullNote')}</p>}
          </section>
          <form onSubmit={pay} noValidate className="flex flex-col gap-6">
            <section className={`${card} flex flex-col gap-4`} aria-labelledby="card">
              <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="card" className="text-h5 text-dark-900">{t('cardTitle')}</h2><span className="rounded-full bg-warning-100 px-3 py-1 text-caption text-warning-700">{t('test')}</span></div>
              <Input label={t('number')} inputMode="numeric" autoComplete="cc-number" placeholder="4417 1234 5678 9010" error={errors.number?.message} {...register('number', { onChange: (e) => setValue('number', groupDigits(e.target.value)) })} />
              <div className="grid gap-4 md:grid-cols-2">
                <Input label={t('expiry')} inputMode="numeric" autoComplete="cc-exp" placeholder="08 / 29" error={errors.expiry?.message} {...register('expiry', { onChange: (e) => setValue('expiry', expiryMask(e.target.value)) })} />
                <Input label={t('cvc')} type="password" inputMode="numeric" autoComplete="cc-csc" maxLength={4} placeholder="•••" error={errors.cvc?.message} {...register('cvc')} />
              </div>
              <Input label={t('holder')} autoComplete="cc-name" placeholder="AZIZ AZIZOV" error={errors.holder?.message} {...register('holder', { setValueAs: (v: string) => v.toUpperCase() })} />
              <p className="flex items-center gap-2 text-caption text-success-700"><LockKeyhole className="size-4" aria-hidden="true" />{t('secure')}</p>
            </section>
            {error && <Alert type="error" title={error} />}
            <Button type="submit" variant="primary" size="L" className="w-full" loading={isSubmitting}>{plan === 'full' ? t('payFull', { amount: money(amount, locale) }) : t('payDeposit', { amount: money(amount, locale) })}</Button>
          </form>
          {cancelDate && <Alert type="info" title={t('refundTitle', { date: cancelDate })}>{t('refundText')}</Alert>}
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start"><OrderSummary order={order} /></div>
      </div>
      <Link href={`/checkout/${order.id}/review` as never} className="mt-6 inline-block text-body-s-medium text-primary-500">← {t('title')}</Link>
    </PageContainer>
  );
}
