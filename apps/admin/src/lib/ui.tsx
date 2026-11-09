import * as Dialog from '@radix-ui/react-dialog';
import { Button, Modal, Skeleton, ToastView, cn } from '@samanid/ui';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, X } from 'lucide-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

/** Кнопка-обводка цвета primary (Figma: Button / Secondary outline, «Экспорт CSV», «Войти»). */
export const outlineBtn = 'inline-flex h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-primary-500 bg-white px-5 text-button-m text-primary-500 transition-colors hover:bg-primary-50 focus-visible:focus-ring disabled:cursor-not-allowed disabled:border-dark-200 disabled:text-dark-400';
export const card = 'rounded-[20px] border border-dark-200 bg-white';

export function PageHeader({ title, meta, actions, className }: { title: ReactNode; meta?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn('order-[-2] flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-h2 text-dark-900">{title}</h1>
        {meta && <p className="text-body-s text-dark-500">{meta}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

/** Вкладки-ссылки (подразделы раздела). Figma: подчёркивание primary 2px. */
export function RouteTabs({ items, label }: { items: { to: string; label: string; end?: boolean }[]; label: string }) {
  return (
    <nav aria-label={label} className="order-[-1] flex gap-7 overflow-x-auto border-b border-dark-200 [scrollbar-width:none]">
      {items.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.end ?? true}
          className={({ isActive }) => cn('-mb-px shrink-0 border-b-2 pb-3 text-body-m whitespace-nowrap focus-visible:focus-ring', isActive ? 'border-primary-500 text-primary-500' : 'border-transparent text-dark-600 hover:text-dark-900')}>
          {i.label}
        </NavLink>
      ))}
    </nav>
  );
}

export type Tone = 'success' | 'warning' | 'error' | 'neutral' | 'primary' | 'accent';
const toneCls: Record<Tone, string> = {
  success: 'bg-success-100 text-success-700', warning: 'bg-warning-100 text-warning-700', error: 'bg-error-100 text-error-700',
  neutral: 'bg-dark-100 text-dark-700', primary: 'bg-primary-50 text-primary-600', accent: 'bg-accent-100 text-warning-700',
};
/** Небольшая плашка статуса (текст всегда есть — не только цвет). */
export function Pill({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-caption whitespace-nowrap', toneCls[tone], className)}>{children}</span>;
}

export function Kpi({ label, value, icon, foot, valueClass }: { label: string; value: ReactNode; icon?: ReactNode; foot?: ReactNode; valueClass?: string }) {
  return (
    <div className={cn(card, 'flex min-w-0 flex-col gap-3 p-5')}>
      <div className="flex items-center justify-between gap-2"><span className="text-body-s text-dark-600">{label}</span>{icon && <span aria-hidden="true" className="text-dark-500 [&>svg]:size-5">{icon}</span>}</div>
      <span className={cn('text-h2 text-dark-900', valueClass)}>{value}</span>
      {foot}
    </div>
  );
}
export function Stat({ label, value, valueClass }: { label: string; value: ReactNode; valueClass?: string }) {
  return <div className={cn(card, 'flex min-w-0 flex-col gap-1 px-4 py-5')}><span className="text-caption text-dark-600">{label}</span><span className={cn('text-h4 font-bold text-dark-900', valueClass)}>{value}</span></div>;
}

/** Таблица на TanStack Table. Шапка — bg-page, разделители dark-100 (Figma: Table). */
export function DataTable<T>({ columns, data, getRowId, rowClassName, onRowClick, caption, empty }: {
  columns: ColumnDef<T, any>[]; data: T[]; getRowId?: (r: T) => string; rowClassName?: (r: T) => string | undefined; onRowClick?: (r: T) => void; caption: string; empty?: ReactNode;
}) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), getRowId });
  const { t } = useTranslation();
  return (
    <div className={cn(card, 'relative overflow-x-auto rounded-2xl')}>
      <table className="w-full min-w-[720px] border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-bg-page">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>{hg.headers.map((h) => <th key={h.id} scope="col" style={{ width: h.column.columnDef.size }} className="px-4 py-3 text-caption font-medium text-dark-500">{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} onClick={onRowClick ? () => onRowClick(row.original) : undefined} className={cn('border-t border-dark-100', onRowClick && 'cursor-pointer hover:bg-dark-100/40', rowClassName?.(row.original))}>
              {row.getVisibleCells().map((c) => <td key={c.id} className="px-4 py-3 align-middle text-body-s text-dark-900">{flexRender(c.column.columnDef.cell, c.getContext())}</td>)}
            </tr>
          ))}
          {!data.length && <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-body-s text-dark-500">{empty ?? t('common.empty')}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function Loading({ rows = 4 }: { rows?: number }) {
  const { t } = useTranslation();
  return <div role="status" aria-busy="true" className="flex flex-col gap-3"><span className="sr-only">{t('common.loading')}</span>{Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>;
}
export function ErrorBox({ onRetry, error }: { onRetry: () => void; error?: unknown }) {
  const { t } = useTranslation();
  const forbidden = (error as { code?: string } | undefined)?.code === 'forbidden';
  return (
    <div role="alert" className="flex items-center gap-3 rounded-lg border border-error-600 bg-error-100 px-5 py-4">
      <AlertTriangle aria-hidden="true" className="size-5 text-error-700" />
      <p className="flex-1 text-body-s text-dark-700">{forbidden ? t('common.forbidden') : t('common.error')}</p>
      {!forbidden && <Button variant="ghost" size="M" onClick={onRetry}>{t('common.retry')}</Button>}
    </div>
  );
}

/** Боковая панель (Figma 6.5 Drawer, 620px, Shadow/lg). Фокус заперт, Esc и клик по подложке закрывают. */
export function Drawer({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: ReactNode; description?: ReactNode; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-dark-900/30" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[620px] flex-col gap-5 overflow-y-auto bg-white p-7 shadow-lg focus:outline-none">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1.5">
              <Dialog.Title className="text-h3 text-dark-900">{title}</Dialog.Title>
              {description ? <Dialog.Description className="text-caption text-dark-500">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
            </div>
            <Dialog.Close className="inline-flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-dark-100 focus-visible:focus-ring" aria-label={t('common.close')}><X className="size-5" /></Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Подтверждение необратимых действий: Danger-кнопка только здесь. */
export function Confirm({ open, onOpenChange, title, text, confirmLabel, onConfirm, danger = true, busy }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; text: string; confirmLabel: string; onConfirm: () => void; danger?: boolean; busy?: boolean }) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description={text} closeLabel={t('common.close')}
      footer={<><Button variant="ghost" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button><Button variant={danger ? 'danger' : 'secondary'} loading={busy} onClick={onConfirm}>{confirmLabel}</Button></>} />
  );
}

type Toast = { id: number; type: 'success' | 'error' | 'info'; title: string };
const ToastCtx = createContext<(t: Omit<Toast, 'id'>) => void>(() => undefined);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const { t } = useTranslation();
  const push = useCallback((x: Omit<Toast, 'id'>) => { const id = Date.now(); setItems((s) => [...s, { ...x, id }]); setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 4000); }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="fixed right-6 bottom-6 z-[60] flex w-[360px] max-w-[calc(100vw-32px)] flex-col gap-2">
        {items.map((i) => <ToastView key={i.id} type={i.type === 'info' ? 'info' : i.type} title={i.title} closeLabel={t('common.close')} onClose={() => setItems((s) => s.filter((x) => x.id !== i.id))} />)}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/** Сообщение об ошибке API на языке интерфейса. */
export function useApiError() {
  const { t } = useTranslation(); const toast = useToast();
  return (e: unknown) => { const code = (e as { code?: string }).code; toast({ type: 'error', title: code === 'forbidden' ? t('common.forbidden') : t('common.error') }); };
}

export function Field({ label, children, hint, error, id }: { label: string; children: ReactNode; hint?: string; error?: string; id: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="text-body-s-medium text-dark-700">{label}</label>
      {children}
      {error ? <p id={`${id}-error`} className="text-caption text-error-700">{error}</p> : hint ? <p id={`${id}-hint`} className="text-caption text-dark-500">{hint}</p> : null}
    </div>
  );
}

/** Значение токена для SVG-атрибутов (Recharts): var() в атрибутах SVG не работает, читаем из :root. */
export const token = (name: string) => (typeof window === 'undefined' ? '' : getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim());

/** Переключатель-«пилюли» (Figma 43:2785): белая подложка, активный — dark-900. */
export function PillSwitch<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex gap-1 rounded-full border border-dark-200 bg-white p-1">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cn('rounded-full px-3.5 py-2 text-body-s-medium focus-visible:focus-ring', value === o.value ? 'bg-dark-900 text-white' : 'text-dark-700 hover:bg-dark-100')}>{o.label}</button>
      ))}
    </div>
  );
}
