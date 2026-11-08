'use client';
import { Button, HoldTimer, Modal, PageContainer, Stepper, cn } from '@samanid/ui';
import type { Order } from '@samanid/api';
import { type Locale } from '@samanid/i18n';
import { ArrowLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import { Link } from '@/i18n/routing';
import { money } from '@/lib/format';
import { useHold, STEPS, type StepKey } from './useOrder';
import { OrderSummary } from './OrderSummary';

export function useTimerLabels() {
  const t = useTranslations('checkout.timer');
  return { normal: t('normal'), warning: t('warning'), expired: t('expired') };
}

/** Каркас шагов 1–5: назад к туру, таймер hold (со 2-го шага), степпер, контент + «Ваш заказ». На mobile — нижняя панель с суммой. */
export function CheckoutShell({ order, step, title, lead, children, nav, showTimer }: {
  order: Order; step: StepKey; title: string; lead?: string; children: ReactNode; showTimer?: boolean;
  nav: { backHref?: string; onBack?: () => void; nextLabel: string; onNext: () => void; loading?: boolean; disabled?: boolean; primary?: boolean };
}) {
  const t = useTranslations('checkout');
  const locale = useLocale() as Locale;
  const labels = useTimerLabels();
  const { left, active } = useHold(order);
  const [detail, setDetail] = useState(false);
  const idx = STEPS.indexOf(step);
  const stepNames = STEPS.map((s) => t(`steps.${s}`));
  const timer = (showTimer ?? idx >= 1) && active ? <HoldTimer remainingSeconds={left} labels={labels} compact /> : null;
  const back = nav.backHref ? <Link href={nav.backHref as never} className="rounded-md px-3 py-2 text-button-m text-primary-500 hover:bg-primary-50 focus-visible:focus-ring">{t('prev')}</Link>
    : <button type="button" onClick={nav.onBack} className="rounded-md px-3 py-2 text-button-m text-primary-500 hover:bg-primary-50 focus-visible:focus-ring">{t('prev')}</button>;
  return (
    <PageContainer className="pt-5 pb-32 md:pt-8 md:pb-20">
      <div className="flex min-h-12 items-center justify-between gap-4">
        <Link href={`/tours/${order.tour.slug}` as never} className="inline-flex items-center gap-2 rounded-xs text-body-s text-dark-800 focus-visible:focus-ring"><ArrowLeft className="size-[18px]" aria-hidden="true" /><span className="max-md:sr-only md:not-sr-only">{t('back')}</span><span className="font-semibold md:hidden">{t('bookingTitle')}</span></Link>
        {timer}
      </div>
      <div className="mt-4"><Stepper steps={stepNames} current={idx + 1} stepOfLabel={t('stepOf', { n: idx + 1 })} label={t('stepsNav')} /></div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_440px]">
        <div className="min-w-0">
          <h1 className="text-h3 text-dark-900 md:text-h2">{title}</h1>
          {lead && <p className="mt-2 text-body-s text-dark-600 md:text-body-m">{lead}</p>}
          <div className="mt-6 flex flex-col gap-6">{children}</div>
          <div className="mt-8 hidden items-center justify-between md:flex">{idx > 0 ? back : <span />}
            <Button variant={nav.primary ? 'primary' : 'secondary'} size="L" onClick={nav.onNext} loading={nav.loading} disabled={nav.disabled}>{nav.nextLabel}</Button></div>
        </div>
        <div className="max-lg:hidden lg:sticky lg:top-24 lg:self-start"><OrderSummary order={order} /></div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-dark-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <div><p className="text-h4 font-extrabold text-dark-900">{money(order.snapshot.total, locale)}</p><button type="button" onClick={() => setDetail(true)} className="text-caption text-primary-500 lg:hidden">{t('details')}</button></div>
        <Button variant={nav.primary ? 'primary' : 'secondary'} size="L" onClick={nav.onNext} loading={nav.loading} disabled={nav.disabled}>{idx === 4 ? nav.nextLabel.split(' · ')[0] : t('next')}</Button>
      </div>
      <div className="lg:hidden"><Modal open={detail} onOpenChange={setDetail} title={t('summary.title')} closeLabel="×"><OrderSummary order={order} className="border-0 p-0" /></Modal></div>
    </PageContainer>
  );
}
export const card = 'rounded-xl border border-dark-200 bg-white p-5 md:p-6';
export { cn };
