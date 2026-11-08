'use client';
import { Calendar, Check, CircleCheck, Clock, Info, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../cn';

export type PriceRowType = 'default' | 'discount' | 'dynamic' | 'total';

/**
 * Строка разбивки цены (Figma 14:783). Сумма приходит из API уже готовой и на фронте НЕ пересчитывается.
 * Порядок строк: база → детский тариф → динамика → допуслуги → промокод → баллы (≤ 20%) → пени.
 */
export function PriceRow({ type = 'default', label, amount, hint, className }: {
  type?: PriceRowType; label: string; amount: string; hint?: string; className?: string;
}) {
  const total = type === 'total';
  return (
    <div className={cn('flex items-center justify-between gap-4', total && 'border-t border-dark-200 pt-3', className)}>
      <span className={cn('flex items-center gap-1.5', total ? 'text-h5 text-dark-900' : 'text-body-s text-dark-600')}>
        {label}
        {type === 'dynamic' && (
          <span title={hint} className="inline-flex" role={hint ? 'img' : undefined} aria-label={hint}>
            <Info className="size-3.5" aria-hidden="true" />
          </span>
        )}
      </span>
      <span
        className={cn(
          'whitespace-nowrap',
          total ? 'text-price-l text-dark-900' : 'text-body-s-medium',
          type === 'discount' && 'text-success-700',
          type === 'dynamic' && 'text-warning-700',
          type === 'default' && 'text-dark-900',
        )}
      >
        {amount}
      </span>
    </div>
  );
}

export type ScheduleState = 'paid' | 'upcoming' | 'overdue' | 'scheduled';
const sch: Record<ScheduleState, { box: string; icon: string; chip: string; Icon: typeof Check }> = {
  paid: { box: 'border-dark-200 bg-white', icon: 'bg-success-100 text-success-700', chip: 'bg-success-100 text-success-700', Icon: CircleCheck },
  upcoming: { box: 'border-dark-200 bg-white', icon: 'bg-primary-50 text-primary-500', chip: 'bg-primary-50 text-primary-600', Icon: Calendar },
  overdue: { box: 'border-error-600 bg-error-100', icon: 'bg-white text-error-600', chip: 'bg-white text-error-700', Icon: TriangleAlert },
  scheduled: { box: 'border-dark-200 bg-white', icon: 'bg-dark-100 text-dark-600', chip: 'bg-dark-100 text-dark-600', Icon: Clock },
};

/** Строка графика платежей (рассрочка: 3 взноса). Подписи, даты и суммы (включая пеню) приходят из API. */
export function PaymentScheduleRow({ state, title, date, amount, statusLabel, className }: {
  state: ScheduleState; title: string; date: string; amount: string; statusLabel: string; className?: string;
}) {
  const s = sch[state];
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[14px] border px-4 py-3.5', s.box, className)}>
      <span aria-hidden="true" className={cn('flex size-10 shrink-0 items-center justify-center rounded-full [&>svg]:size-5', s.icon)}><s.Icon /></span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-body-m-medium text-dark-900">{title}</p>
        <p className="text-caption text-dark-500">{date}</p>
      </div>
      <p className="text-body-m-medium whitespace-nowrap text-dark-900">{amount}</p>
      <span className={cn('rounded-full px-2.5 py-1 text-caption whitespace-nowrap', s.chip)}>{statusLabel}</span>
    </div>
  );
}

export type TimelineStep = { title: string; meta?: string; state: 'done' | 'current' | 'todo' };

/** Таймлайн статусов заказа. Состояние = иконка (галочка/кольцо) + текст. */
export function StatusTimeline({ steps, className }: { steps: TimelineStep[]; className?: string }) {
  return (
    <ol className={cn('flex flex-col', className)}>
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={i} className="flex gap-3.5" aria-current={s.state === 'current' ? 'step' : undefined}>
            <span className="flex flex-col items-center">
              {s.state === 'done' ? (
                <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-full bg-success-600 text-white"><Check className="size-3.5" /></span>
              ) : s.state === 'current' ? (
                <span aria-hidden="true" className="size-6 rounded-full border-4 border-primary-100 bg-primary-500" />
              ) : (
                <span aria-hidden="true" className="size-6 rounded-full border-2 border-dark-300 bg-white" />
              )}
              {!last && <span aria-hidden="true" className={cn('h-9 w-0.5', s.state === 'done' ? 'bg-success-600' : 'bg-dark-200')} />}
            </span>
            <div className="flex flex-col gap-0.5 pt-0.5">
              <p className={cn('text-body-s-medium', s.state === 'todo' ? 'text-dark-400' : 'text-dark-900')}>{s.title}</p>
              {s.meta && <p className="text-caption text-dark-500">{s.meta}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-xl border border-dark-200 bg-white', className)}>{children}</div>;
}
