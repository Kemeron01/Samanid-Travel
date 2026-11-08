'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { CircleAlert, CircleCheck, CircleX, Clock, Info, RefreshCw, Search, WifiOff, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../cn';
import { Button } from './Button';

export function IconButton({ label, children, className, ...rest }: { label: string; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-label={label} className={cn('inline-flex size-10 items-center justify-center rounded-full text-dark-900 hover:bg-dark-100 focus-visible:focus-ring', className)} {...rest}>
      {children}
    </button>
  );
}

/** Figma: Modal. Фокус заперт (Radix), закрытие Esc / подложка / ×. На mobile — нижняя шторка. */
export function Modal({ open, onOpenChange, title, description, children, footer, closeLabel }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string;
  children?: ReactNode; footer?: ReactNode; closeLabel: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-dark-900/50" />
        <Dialog.Content
          className="fixed z-50 flex flex-col gap-5 bg-white p-7 shadow-lg focus:outline-none max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[90dvh] max-md:overflow-y-auto max-md:rounded-t-2xl max-md:pb-[max(1.75rem,env(safe-area-inset-bottom))] md:left-1/2 md:top-1/2 md:w-[520px] md:max-w-[calc(100vw-2rem)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl"
        >
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="text-h4 text-dark-900">{title}</Dialog.Title>
            <Dialog.Close asChild><IconButton label={closeLabel}><X className="size-5" aria-hidden="true" /></IconButton></Dialog.Close>
          </div>
          {description ? <Dialog.Description className="text-body-m text-dark-600">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
          {children}
          {footer && <div className="flex flex-wrap justify-end gap-3">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export { Dialog };

export type AlertType = 'info' | 'success' | 'warning' | 'error';
const alertStyle: Record<AlertType, { box: string; title: string; icon: ReactNode }> = {
  info: { box: 'border-primary-500 bg-primary-50', title: 'text-primary-600', icon: <Info className="text-primary-500" /> },
  success: { box: 'border-success-600 bg-success-100', title: 'text-success-700', icon: <CircleCheck className="text-success-700" /> },
  warning: { box: 'border-warning-500 bg-warning-100', title: 'text-warning-700', icon: <CircleAlert className="text-warning-700" /> },
  error: { box: 'border-error-600 bg-error-100', title: 'text-error-700', icon: <CircleX className="text-error-700" /> },
};

/** Alert — постоянное сообщение в контексте (иконка + заголовок + текст, не только цвет). */
export function Alert({ type = 'info', title, children, className }: { type?: AlertType; title: string; children?: ReactNode; className?: string }) {
  const s = alertStyle[type];
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={cn('flex items-start gap-3 rounded-lg border px-5 py-4', s.box, className)}>
      <span aria-hidden="true" className="mt-0.5 shrink-0 [&>svg]:size-[22px]">{s.icon}</span>
      <div className="flex min-w-0 flex-col gap-1">
        <p className={cn('text-body-m-medium', s.title)}>{title}</p>
        {children && <p className="text-body-s text-dark-700">{children}</p>}
      </div>
    </div>
  );
}

export type ToastType = 'success' | 'error' | 'info';
const toastIcon: Record<ToastType, { wrap: string; icon: ReactNode }> = {
  success: { wrap: 'bg-success-100 text-success-700', icon: <CircleCheck /> },
  error: { wrap: 'bg-error-100 text-error-700', icon: <CircleX /> },
  info: { wrap: 'bg-primary-50 text-primary-500', icon: <Info /> },
};

/** Toast — временное (5 c). Показ/таймер — через провайдер приложения; здесь только визуал. */
export function ToastView({ type = 'success', title, description, onClose, closeLabel, className }: {
  type?: ToastType; title: string; description?: string; onClose?: () => void; closeLabel?: string; className?: string;
}) {
  const t = toastIcon[type];
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={cn('flex w-full max-w-[400px] items-start gap-3 rounded-lg border border-dark-200 bg-white p-4 shadow-lg', className)}>
      <span aria-hidden="true" className={cn('flex size-9 shrink-0 items-center justify-center rounded-full [&>svg]:size-5', t.wrap)}>{t.icon}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-body-s">
        <p className="text-body-s-medium text-dark-900">{title}</p>
        {description && <p className="text-dark-500">{description}</p>}
      </div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label={closeLabel} className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-dark-500 hover:bg-dark-100 focus-visible:focus-ring">
          <X className="size-[18px]" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export type HoldTimerState = 'normal' | 'warning' | 'expired';
const holdStyle: Record<HoldTimerState, string> = {
  normal: 'border-primary-500 bg-primary-50 text-primary-600',
  warning: 'border-warning-500 bg-warning-100 text-warning-700',
  expired: 'border-error-600 bg-error-100 text-error-700',
};

export const WARNING_THRESHOLD_SECONDS = 180;
export const holdState = (remaining: number): HoldTimerState =>
  remaining <= 0 ? 'expired' : remaining < WARNING_THRESHOLD_SECONDS ? 'warning' : 'normal';
export const formatMmSs = (s: number) => {
  const v = Math.max(0, Math.floor(s));
  return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
};

/**
 * Таймер hold (Figma 11:491). Оставшееся время считается из hold_expires_at (приходит из API), не из константы.
 * Скринридеру объявляется раз в минуту (aria-live=polite), визуальный счётчик скрыт от live-региона.
 */
export function HoldTimer({ remainingSeconds, labels, className, compact }: {
  remainingSeconds: number; labels: Record<HoldTimerState, string>; className?: string; compact?: boolean;
}) {
  const state = holdState(remainingSeconds);
  const minutes = Math.ceil(Math.max(0, remainingSeconds) / 60);
  return (
    <div className={cn('inline-flex items-center gap-2.5 rounded-full border px-4 py-2.5', holdStyle[state], className)}>
      <Clock className="size-[18px]" aria-hidden="true" />
      <span className={cn('text-body-s-medium', compact && 'max-md:sr-only')}>{labels[state]}</span>
      <span aria-hidden="true" className="text-[16px] leading-6 font-extrabold tabular-nums">{formatMmSs(remainingSeconds)}</span>
      <span className="sr-only" role="timer" aria-live="polite" aria-atomic="true" key={state === 'expired' ? 'e' : minutes}>
        {state === 'expired' ? labels.expired : `${labels[state]}: ${minutes}`}
      </span>
    </div>
  );
}

export function NetworkErrorBanner({ message, retryLabel, onRetry }: { message: string; retryLabel: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-center gap-3 border-b border-error-600 bg-error-100 px-4 py-3 text-body-s-medium text-error-700 md:px-20">
      <WifiOff className="size-5" aria-hidden="true" />
      <span>{message}</span>
      <button type="button" onClick={onRetry} className="inline-flex min-h-10 items-center gap-1.5 underline focus-visible:focus-ring">
        <RefreshCw className="size-4" aria-hidden="true" />{retryLabel}
      </button>
    </div>
  );
}

export function CookieBanner({ title, text, necessaryLabel, acceptLabel, onNecessary, onAccept }: {
  title: string; text: string; necessaryLabel: string; acceptLabel: string; onNecessary: () => void; onAccept: () => void;
}) {
  return (
    <div role="region" aria-label={title} className="flex flex-col gap-4 rounded-xl bg-dark-900 px-6 py-5 shadow-lg md:flex-row md:items-center md:gap-6">
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-body-m-medium text-white">{title}</p>
        <p className="text-body-s text-dark-300">{text}</p>
      </div>
      <div className="flex items-center gap-4">
        <button type="button" onClick={onNecessary} className="min-h-11 text-body-s-medium text-white underline focus-visible:focus-ring">{necessaryLabel}</button>
        <Button variant="primary" onClick={onAccept}>{acceptLabel}</Button>
      </div>
    </div>
  );
}

export function EmptyState({ title, text, actionLabel, onAction, icon, className }: {
  title: string; text?: string; actionLabel?: string; onAction?: () => void; icon?: ReactNode; className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-4 rounded-xl border border-dark-200 bg-white p-8 text-center', className)}>
      <span aria-hidden="true" className="flex size-[72px] items-center justify-center rounded-full bg-primary-50 text-primary-500 [&>svg]:size-8">{icon ?? <Search />}</span>
      <p className="text-h5 text-dark-900">{title}</p>
      {text && <p className="max-w-[300px] text-body-s text-dark-500">{text}</p>}
      {actionLabel && <Button variant="outline" onClick={onAction} className="border-primary-500 text-primary-500">{actionLabel}</Button>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-xs bg-dark-100', className)} />;
}

export function SkeletonTourCard() {
  return (
    <div role="status" aria-busy="true" className="w-full max-w-[300px] overflow-hidden rounded-xl border border-dark-200 bg-white">
      <Skeleton className="h-[200px] rounded-none" />
      <div className="flex flex-col gap-3 p-5">
        <Skeleton className="h-5 w-[220px] max-w-full" /><Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-[260px] max-w-full" /><Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
